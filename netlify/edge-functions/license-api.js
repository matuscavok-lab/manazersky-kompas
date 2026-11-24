import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";
import {
  LICENSE_STORE_NAME,
  USERS_BLOB_KEY,
  USERS_STORE_NAME,
  buildCorsHeaders,
  extractBearerToken,
  getEnv,
  jsonResponse,
  normalizeEmail,
  normalizeUserRecord,
  normalizeUsersDb,
  readOrSeedLicenseDb,
  readOrSeedUsersDb,
  toPublicUser,
  verifySessionToken,
  verifySingleLicenseKey,
} from "./_shared/security.js";

export default async function handler(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const corsHeaders = buildCorsHeaders(request, { allowAdminOrigin: false });

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== "POST") {
    return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Neplatný JSON v požiadavke." }, 400, corsHeaders);
  }

  const rawKey = String(body?.licenseKey || "").trim().toUpperCase();
  const licenseHmacSecret = getEnv("LICENSE_HMAC_SECRET").trim();

  try {
    const licenseStore = getStore({ name: LICENSE_STORE_NAME, consistency: "strong" });
    const licenseDb = await readOrSeedLicenseDb(licenseStore);

    if (pathname === "/api/license/verify") {
      const parsed = await verifySingleLicenseKey(rawKey, licenseDb, licenseHmacSecret);
      return jsonResponse({ ok: true, parsed }, 200, corsHeaders);
    }

    if (pathname === "/api/license/activate") {
      const authSecret = getEnv("AUTH_TOKEN_SECRET").trim();
      if (!authSecret) {
        return jsonResponse(
          {
            ok: false,
            error:
              "Serverová autentifikácia nie je nakonfigurovaná (chýba env premenná AUTH_TOKEN_SECRET).",
          },
          503,
          corsHeaders,
        );
      }

      const bearer = extractBearerToken(request);
      const sessionCheck = await verifySessionToken(bearer, authSecret);
      if (!sessionCheck.valid) {
        return jsonResponse(
          {
            ok: false,
            requiresAuth: true,
            error: sessionCheck.error || "Pre aktiváciu licenčného kľúča sa musíte prihlásiť.",
          },
          401,
          corsHeaders,
        );
      }

      const parsed = await verifySingleLicenseKey(rawKey, licenseDb, licenseHmacSecret);
      if (!parsed.valid) {
        return jsonResponse(
          {
            ok: false,
            error: parsed.error || "Neplatný licenčný kľúč.",
            parsed,
          },
          400,
          corsHeaders,
        );
      }

      const usersStore = getStore({ name: USERS_STORE_NAME, consistency: "strong" });
      const usersDb = await readOrSeedUsersDb(usersStore);
      const sessionEmail = normalizeEmail(sessionCheck.payload.email);
      const userIdx = (usersDb.users || []).findIndex(
        (u) => normalizeEmail(u.email) === sessionEmail || (sessionCheck.payload.sub && u.id === sessionCheck.payload.sub),
      );

      if (userIdx === -1) {
        return jsonResponse(
          {
            ok: false,
            requiresAuth: true,
            error: "Účet používateľa sa nenašiel. Prihláste sa prosím znova.",
          },
          401,
          corsHeaders,
        );
      }

      const nowIso = new Date().toISOString();
      const targetUser = usersDb.users[userIdx];
      const updatedUser = normalizeUserRecord(
        {
          ...targetUser,
          tier: parsed.tier,
          licenseKey: parsed.cleanKey,
          licenseExpiresAt: parsed.expiresAt || null,
          licenseProgram: parsed.programLabel || "",
          licenseActivatedAt: nowIso,
          updatedAt: nowIso,
        },
        nowIso,
      );

      const nextUsers = [...usersDb.users];
      nextUsers[userIdx] = updatedUser;
      await usersStore.setJSON(
        USERS_BLOB_KEY,
        normalizeUsersDb({ ...usersDb, updatedAt: nowIso, users: nextUsers }, nowIso),
      );

      const licenseMeta = {
        licenseKey: parsed.cleanKey,
        tier: parsed.tier,
        programCode: parsed.programCode,
        programLabel: parsed.programLabel,
        expiresAt: parsed.expiresAt || null,
        isPermanent: Boolean(parsed.isPermanent),
        activatedAt: nowIso,
      };

      return jsonResponse(
        {
          ok: true,
          tier: parsed.tier,
          user: toPublicUser(updatedUser),
          parsed,
          licenseMeta,
        },
        200,
        corsHeaders,
      );
    }

    return jsonResponse({ ok: false, error: "Endpoint neexistuje." }, 404, corsHeaders);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err && err.message ? err.message : "Chyba licenčného servera." },
      500,
      corsHeaders,
    );
  }
}

export const config = {
  path: ["/api/license/activate", "/api/license/verify"],
};
