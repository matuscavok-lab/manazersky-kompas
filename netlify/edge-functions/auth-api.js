import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";
import {
  ACCOUNT_LABELS,
  LICENSE_STORE_NAME,
  USERS_BLOB_KEY,
  USERS_STORE_NAME,
  buildCorsHeaders,
  createSessionToken,
  extractBearerToken,
  getEnv,
  hashPasswordPbkdf2,
  jsonResponse,
  normalizeAccountType,
  normalizeEmail,
  normalizeUserRecord,
  normalizeUsersDb,
  readOrSeedLicenseDb,
  readOrSeedUsersDb,
  toPublicUser,
  verifySessionToken,
  verifySingleLicenseKey,
  verifyUserPassword,
} from "./_shared/security.js";

function buildLicenseStatusResponse(parsed, currentUser, checkedAt) {
  if (!parsed) {
    return {
      active: false,
      isExpired: false,
      isRevoked: false,
      revokedKey: null,
      expiredKey: null,
      expiredAtFormatted: null,
      inDatabase: false,
      dbStatus: "none",
      error: null,
      licenseKey: "",
      tier: currentUser.tier === "free" ? "free" : currentUser.tier || "free",
      programCode: "",
      programLabel: "",
      isPermanent: false,
      expiresAt: null,
      daysRemaining: null,
      formattedExpiry: "",
      isSigned: false,
      isCloud: true,
      dbSource: "netlify-cloud",
      startupCheckedAt: checkedAt,
    };
  }

  if (parsed.isExpired) {
    return {
      active: false,
      isExpired: true,
      isRevoked: false,
      revokedKey: null,
      expiredKey: parsed.cleanKey,
      expiredAtFormatted: parsed.formattedExpiry || "",
      inDatabase: Boolean(parsed.inDatabase),
      dbStatus: parsed.dbStatus || "active",
      error: parsed.error || `Platnosť tohto licenčného kľúča vypršala dňa ${parsed.formattedExpiry || ""}.`,
      licenseKey: "",
      tier: "free",
      programCode: parsed.programCode || "",
      programLabel: parsed.programLabel || "",
      isPermanent: false,
      expiresAt: null,
      daysRemaining: 0,
      formattedExpiry: parsed.formattedExpiry || "",
      isSigned: Boolean(parsed.isSigned),
      isCloud: true,
      dbSource: "netlify-cloud",
      startupCheckedAt: checkedAt,
    };
  }

  if (!parsed.valid) {
    return {
      active: false,
      isExpired: false,
      isRevoked: true,
      revokedKey: parsed.cleanKey,
      expiredKey: null,
      expiredAtFormatted: null,
      inDatabase: Boolean(parsed.inDatabase),
      dbStatus: parsed.dbStatus || "not_found",
      error:
        parsed.error ||
        "Licenčný kľúč bol zablokovaný alebo sa nenachádza v databáze vydaných kľúčov.",
      licenseKey: "",
      tier: "free",
      programCode: parsed.programCode || "",
      programLabel: parsed.programLabel || "",
      isPermanent: false,
      expiresAt: null,
      daysRemaining: 0,
      formattedExpiry: "",
      isSigned: Boolean(parsed.isSigned),
      isCloud: true,
      dbSource: "netlify-cloud",
      startupCheckedAt: checkedAt,
    };
  }

  return {
    active: true,
    isExpired: false,
    isRevoked: false,
    revokedKey: null,
    expiredKey: null,
    expiredAtFormatted: null,
    inDatabase: true,
    dbStatus: "active",
    error: null,
    licenseKey: parsed.cleanKey,
    tier: parsed.tier,
    programCode: parsed.programCode,
    programLabel: parsed.programLabel,
    isPermanent: Boolean(parsed.isPermanent),
    expiresAt: parsed.expiresAt || null,
    daysRemaining: parsed.daysRemaining,
    formattedExpiry: parsed.formattedExpiry || "",
    isSigned: Boolean(parsed.isSigned),
    isCloud: true,
    dbSource: "netlify-cloud",
    startupCheckedAt: checkedAt,
  };
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const corsHeaders = buildCorsHeaders(request, { allowAdminOrigin: false });

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (pathname === "/api/auth/logout") {
    if (method !== "POST") {
      return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
    }
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  const authSecret = getEnv("AUTH_TOKEN_SECRET").trim();
  if (!authSecret) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Serverová autentifikácia nie je nakonfigurovaná (chýba env premenná AUTH_TOKEN_SECRET v Netlify Dashboarde).",
      },
      503,
      corsHeaders,
    );
  }

  const licenseHmacSecret = getEnv("LICENSE_HMAC_SECRET").trim();

  try {
    const usersStore = getStore({ name: USERS_STORE_NAME, consistency: "strong" });
    const licenseStore = getStore({ name: LICENSE_STORE_NAME, consistency: "strong" });

    if (pathname === "/api/auth/register") {
      if (method !== "POST") {
        return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: "Neplatný JSON v požiadavke." }, 400, corsHeaders);
      }

      const fullName = String(body?.fullName || "").trim();
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      const accountType = normalizeAccountType(body?.accountType);
      const organization = String(body?.organization || "").trim();
      const consent = Boolean(body?.consent);
      const pendingLicenseKey = String(body?.pendingLicenseKey || "").trim().toUpperCase();

      if (fullName.length < 2) {
        return jsonResponse(
          { ok: false, error: "Zadajte prosím svoje celé meno a priezvisko." },
          400,
          corsHeaders,
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse(
          { ok: false, error: "Zadajte prosím platnú e-mailovú adresu." },
          400,
          corsHeaders,
        );
      }
      if (password.length < 8) {
        return jsonResponse(
          { ok: false, error: "Heslo musí obsahovať aspoň 8 znakov." },
          400,
          corsHeaders,
        );
      }
      if (!consent) {
        return jsonResponse(
          { ok: false, error: "Pre vytvorenie účtu potvrďte súhlas so spracovaním údajov." },
          400,
          corsHeaders,
        );
      }

      const usersDb = await readOrSeedUsersDb(usersStore);
      if ((usersDb.users || []).some((u) => normalizeEmail(u.email) === email)) {
        return jsonResponse(
          {
            ok: false,
            error: "Tento e-mail je už zaregistrovaný. Prepnite sa prosím na záložku Prihlásenie.",
          },
          409,
          corsHeaders,
        );
      }

      const nowIso = new Date().toISOString();
      let inheritedTier = "free";
      let inheritedLicenseKey = "";
      let inheritedExpiresAt = null;
      let inheritedProgram = "";
      let inheritedActivatedAt = null;
      let pendingActivationError = "";

      if (pendingLicenseKey) {
        const licenseDb = await readOrSeedLicenseDb(licenseStore);
        const parsedPending = await verifySingleLicenseKey(
          pendingLicenseKey,
          licenseDb,
          licenseHmacSecret,
        );
        if (parsedPending.valid) {
          inheritedTier = parsedPending.tier;
          inheritedLicenseKey = parsedPending.cleanKey;
          inheritedExpiresAt = parsedPending.expiresAt || null;
          inheritedProgram = parsedPending.programLabel || "";
          inheritedActivatedAt = nowIso;
        } else {
          pendingActivationError = parsedPending.error || "Licenčný kľúč sa nepodarilo aktivovať.";
        }
      }

      const passwordHash = await hashPasswordPbkdf2(password);
      const randomBytes = crypto.getRandomValues(new Uint8Array(4));
      const suffix = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");

      const newUser = normalizeUserRecord(
        {
          id: `usr_${Date.now()}_${suffix}`,
          fullName,
          email,
          passwordHash,
          hashAlg: "pbkdf2-sha256-v1",
          accountType,
          accountTypeLabel: ACCOUNT_LABELS[accountType] || "🎓 Študent VŠ",
          organization,
          tier: inheritedTier,
          licenseKey: inheritedLicenseKey,
          licenseExpiresAt: inheritedExpiresAt,
          licenseProgram: inheritedProgram,
          licenseActivatedAt: inheritedActivatedAt,
          isDemo: false,
          createdAt: nowIso,
          lastLoginAt: nowIso,
          updatedAt: nowIso,
        },
        nowIso,
      );

      const nextDeletedMap = { ...(usersDb.deletedAtMap || {}) };
      delete nextDeletedMap[email];

      const nextUsersDb = normalizeUsersDb(
        {
          ...usersDb,
          updatedAt: nowIso,
          deletedAtMap: nextDeletedMap,
          deletedEmails: Object.keys(nextDeletedMap).sort(),
          users: [newUser, ...(usersDb.users || [])],
        },
        nowIso,
      );

      await usersStore.setJSON(USERS_BLOB_KEY, nextUsersDb);
      const token = await createSessionToken(newUser, authSecret);
      const publicUser = toPublicUser(newUser);

      return jsonResponse(
        {
          ok: true,
          user: publicUser,
          token,
          pendingActivationError,
          message: inheritedLicenseKey
            ? `Účet bol vytvorený a licenčný kľúč (${inheritedProgram}) bol priradený k vášmu profilu.`
            : "Účet bol úspešne vytvorený. Získali ste bezplatný balík Free.",
        },
        201,
        corsHeaders,
      );
    }

    if (pathname === "/api/auth/login") {
      if (method !== "POST") {
        return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: "Neplatný JSON v požiadavke." }, 400, corsHeaders);
      }

      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      const pendingLicenseKey = String(body?.pendingLicenseKey || "").trim().toUpperCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ ok: false, error: "Zadajte platnú e-mailovú adresu." }, 400, corsHeaders);
      }
      if (!password) {
        return jsonResponse({ ok: false, error: "Zadajte prosím svoje heslo." }, 400, corsHeaders);
      }

      const usersDb = await readOrSeedUsersDb(usersStore);
      const userIdx = (usersDb.users || []).findIndex((u) => normalizeEmail(u.email) === email);
      if (userIdx === -1) {
        return jsonResponse(
          { ok: false, error: "Účet s touto e-mailovou adresou neexistuje." },
          401,
          corsHeaders,
        );
      }

      const targetUser = usersDb.users[userIdx];
      const pwdCheck = await verifyUserPassword(
        password,
        email,
        targetUser.passwordHash,
        targetUser.hashAlg,
      );
      if (!pwdCheck.valid) {
        return jsonResponse(
          { ok: false, error: "Nesprávne heslo. Skúste to znova." },
          401,
          corsHeaders,
        );
      }

      const nowIso = new Date().toISOString();
      let updatedUser = {
        ...targetUser,
        lastLoginAt: nowIso,
        updatedAt: nowIso,
      };
      if (pwdCheck.needsUpgrade) {
        updatedUser.passwordHash = await hashPasswordPbkdf2(password);
        updatedUser.hashAlg = "pbkdf2-sha256-v1";
      }

      const licenseDb = await readOrSeedLicenseDb(licenseStore);
      let licenseExpired = false;
      let expiredKey = "";
      let expiredAtFormatted = "";
      let licenseRevoked = false;
      let revokedKey = "";
      let revokedError = "";
      let pendingKeyActivated = null;
      let pendingKeyError = "";

      if (pendingLicenseKey) {
        const parsedPending = await verifySingleLicenseKey(
          pendingLicenseKey,
          licenseDb,
          licenseHmacSecret,
        );
        if (parsedPending.valid) {
          updatedUser = {
            ...updatedUser,
            tier: parsedPending.tier,
            licenseKey: parsedPending.cleanKey,
            licenseExpiresAt: parsedPending.expiresAt || null,
            licenseProgram: parsedPending.programLabel || "",
            licenseActivatedAt: nowIso,
          };
          pendingKeyActivated = parsedPending;
        } else {
          pendingKeyError =
            parsedPending.error || "Pripravený licenčný kľúč nebolo možné aktivovať.";
        }
      }

      const existingKey = String(updatedUser.licenseKey || "").trim().toUpperCase();
      if (!pendingKeyActivated && existingKey) {
        const parsed = await verifySingleLicenseKey(existingKey, licenseDb, licenseHmacSecret);
        if (parsed.isExpired) {
          licenseExpired = true;
          expiredKey = existingKey;
          expiredAtFormatted = parsed.formattedExpiry || "";
          updatedUser = {
            ...updatedUser,
            tier: "free",
            licenseKey: "",
            licenseExpiresAt: null,
            licenseProgram: "",
            licenseActivatedAt: null,
          };
        } else if (!parsed.valid) {
          licenseRevoked = true;
          revokedKey = existingKey;
          revokedError =
            parsed.error || "Licenčný kľúč bol v databáze zablokovaný alebo sa v nej nenachádza.";
          updatedUser = {
            ...updatedUser,
            tier: "free",
            licenseKey: "",
            licenseExpiresAt: null,
            licenseProgram: "",
            licenseActivatedAt: null,
          };
        } else {
          updatedUser = {
            ...updatedUser,
            tier: parsed.tier,
            licenseKey: parsed.cleanKey,
            licenseExpiresAt: parsed.expiresAt || null,
            licenseProgram: parsed.programLabel || "",
          };
        }
      } else if (
        !pendingKeyActivated &&
        (updatedUser.tier === "edu_pro" || updatedUser.tier === "enterprise_pro") &&
        !existingKey
      ) {
        updatedUser = {
          ...updatedUser,
          tier: "free",
          licenseKey: "",
          licenseExpiresAt: null,
          licenseProgram: "",
          licenseActivatedAt: null,
        };
      }

      const nextUsers = [...usersDb.users];
      nextUsers[userIdx] = normalizeUserRecord(updatedUser, nowIso);
      const nextUsersDb = normalizeUsersDb(
        {
          ...usersDb,
          updatedAt: nowIso,
          users: nextUsers,
        },
        nowIso,
      );
      await usersStore.setJSON(USERS_BLOB_KEY, nextUsersDb);

      const token = await createSessionToken(nextUsers[userIdx], authSecret);
      const publicUser = toPublicUser(nextUsers[userIdx]);

      return jsonResponse(
        {
          ok: true,
          user: publicUser,
          token,
          licenseExpired,
          expiredKey,
          expiredAtFormatted,
          licenseRevoked,
          revokedKey,
          revokedError,
          pendingKeyActivated,
          pendingKeyError,
          message: pendingKeyActivated
            ? `Vitajte späť, ${publicUser.fullName}! Licenčný kľúč ${pendingKeyActivated.cleanKey} bol aktivovaný.`
            : licenseExpired
            ? `Vitajte späť, ${publicUser.fullName}! Platnosť vašej predchádzajúcej licencie vypršala dňa ${expiredAtFormatted}.`
            : licenseRevoked
            ? `Vitajte späť, ${publicUser.fullName}! Predchádzajúci kľúč ${revokedKey} bol zablokovaný alebo odstránený.`
            : `Vitajte späť, ${publicUser.fullName}!`,
        },
        200,
        corsHeaders,
      );
    }

    // Chránené endpointy vyžadujúce Bearer session token
    const bearer = extractBearerToken(request);
    const sessionCheck = await verifySessionToken(bearer, authSecret);
    if (!sessionCheck.valid) {
      return jsonResponse({ ok: false, error: sessionCheck.error }, 401, corsHeaders);
    }

    const sessionEmail = normalizeEmail(sessionCheck.payload.email);
    const usersDb = await readOrSeedUsersDb(usersStore);
    const userIdx = (usersDb.users || []).findIndex(
      (u) => normalizeEmail(u.email) === sessionEmail || (sessionCheck.payload.sub && u.id === sessionCheck.payload.sub),
    );
    if (userIdx === -1) {
      return jsonResponse(
        { ok: false, error: "Účet už v databáze neexistuje. Prihláste sa prosím znova." },
        401,
        corsHeaders,
      );
    }

    let currentUser = usersDb.users[userIdx];
    const nowIso = new Date().toISOString();

    if (pathname === "/api/auth/me") {
      if (method !== "GET" && method !== "HEAD") {
        return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
      }

      const existingKey = String(currentUser.licenseKey || "").trim().toUpperCase();
      let licenseStatus = null;

      if (existingKey) {
        const licenseDb = await readOrSeedLicenseDb(licenseStore);
        const parsed = await verifySingleLicenseKey(existingKey, licenseDb, licenseHmacSecret);
        licenseStatus = buildLicenseStatusResponse(parsed, currentUser, nowIso);

        const needsDowngrade = !parsed.valid;
        const needsTierSync = parsed.valid && (currentUser.tier !== parsed.tier || currentUser.licenseProgram !== parsed.programLabel);

        if (needsDowngrade) {
          currentUser = normalizeUserRecord(
            {
              ...currentUser,
              tier: "free",
              licenseKey: "",
              licenseExpiresAt: null,
              licenseProgram: "",
              licenseActivatedAt: null,
              updatedAt: nowIso,
            },
            nowIso,
          );
          const nextUsers = [...usersDb.users];
          nextUsers[userIdx] = currentUser;
          await usersStore.setJSON(
            USERS_BLOB_KEY,
            normalizeUsersDb({ ...usersDb, updatedAt: nowIso, users: nextUsers }, nowIso),
          );
        } else if (needsTierSync) {
          currentUser = normalizeUserRecord(
            {
              ...currentUser,
              tier: parsed.tier,
              licenseExpiresAt: parsed.expiresAt || null,
              licenseProgram: parsed.programLabel || "",
              updatedAt: nowIso,
            },
            nowIso,
          );
          const nextUsers = [...usersDb.users];
          nextUsers[userIdx] = currentUser;
          await usersStore.setJSON(
            USERS_BLOB_KEY,
            normalizeUsersDb({ ...usersDb, updatedAt: nowIso, users: nextUsers }, nowIso),
          );
        }
      } else {
        if (currentUser.tier === "edu_pro" || currentUser.tier === "enterprise_pro") {
          currentUser = normalizeUserRecord(
            {
              ...currentUser,
              tier: "free",
              licenseKey: "",
              licenseExpiresAt: null,
              licenseProgram: "",
              licenseActivatedAt: null,
              updatedAt: nowIso,
            },
            nowIso,
          );
          const nextUsers = [...usersDb.users];
          nextUsers[userIdx] = currentUser;
          await usersStore.setJSON(
            USERS_BLOB_KEY,
            normalizeUsersDb({ ...usersDb, updatedAt: nowIso, users: nextUsers }, nowIso),
          );
        }
        licenseStatus = buildLicenseStatusResponse(null, currentUser, nowIso);
      }

      if (method === "HEAD") {
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      return jsonResponse(
        {
          ok: true,
          user: toPublicUser(currentUser),
          licenseStatus,
        },
        200,
        corsHeaders,
      );
    }

    if (pathname === "/api/auth/tier") {
      if (method !== "POST") {
        return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: "Neplatný JSON v požiadavke." }, 400, corsHeaders);
      }

      const requestedTier = String(body?.tier || "").trim().toLowerCase();
      if (requestedTier !== "free") {
        return jsonResponse(
          {
            ok: false,
            error: "Pre prechod na balík Pro je povinná aktivácia platného licenčného kľúča cez /api/license/activate.",
          },
          403,
          corsHeaders,
        );
      }

      currentUser = normalizeUserRecord(
        {
          ...currentUser,
          tier: "free",
          licenseKey: "",
          licenseExpiresAt: null,
          licenseProgram: "",
          licenseActivatedAt: null,
          updatedAt: nowIso,
        },
        nowIso,
      );
      const nextUsers = [...usersDb.users];
      nextUsers[userIdx] = currentUser;
      await usersStore.setJSON(
        USERS_BLOB_KEY,
        normalizeUsersDb({ ...usersDb, updatedAt: nowIso, users: nextUsers }, nowIso),
      );

      return jsonResponse(
        {
          ok: true,
          tier: "free",
          user: toPublicUser(currentUser),
          licenseMeta: null,
        },
        200,
        corsHeaders,
      );
    }

    return jsonResponse({ ok: false, error: "Endpoint neexistuje." }, 404, corsHeaders);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err && err.message ? err.message : "Chyba autentifikačného servera." },
      500,
      corsHeaders,
    );
  }
}

export const config = {
  path: [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/me",
    "/api/auth/tier",
    "/api/auth/logout",
  ],
};
