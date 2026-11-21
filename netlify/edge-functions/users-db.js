import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";

const STORE_NAME = "kompas-users-db";
const BLOB_KEY = "users-db-v1";
const SEED_BASELINE_ISO = "2026-01-15T09:00:00.000Z";

const ACCOUNT_LABELS = {
  student: "🎓 Študent VŠ",
  manager: "💼 Manažér",
  teacher: "🏫 Pedagóg",
};

const INITIAL_SEED_USERS_DB = {
  schemaVersion: "1.0",
  updatedAt: SEED_BASELINE_ISO,
  deletedEmails: [],
  deletedAtMap: {},
  users: [
    {
      id: "demo_student_free",
      fullName: "Bc. Adam Kováč",
      email: "student@kompas.sk",
      passwordHash: "ba9f2792b52889f2f8407d965767e7231a25bd7dc27adef19be042eccbf472ed",
      hashAlg: "sha256-offline-v1",
      accountType: "student",
      accountTypeLabel: "🎓 Študent VŠ",
      organization: "Ekonomická univerzita v Bratislave",
      tier: "free",
      licenseKey: "",
      licenseExpiresAt: null,
      licenseProgram: "",
      licenseActivatedAt: null,
      isDemo: true,
      createdAt: SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: SEED_BASELINE_ISO,
    },
    {
      id: "demo_edu_pro",
      fullName: "Ing. Lucia Horváthová",
      email: "edu@kompas.sk",
      passwordHash: "7204a11f81b3924da4c35d19ebb7f2920b62111a680804512f90e71ac327ee70",
      hashAlg: "sha256-offline-v1",
      accountType: "student",
      accountTypeLabel: "🎓 Študent VŠ",
      organization: "STU Bratislava – MTF",
      tier: "edu_pro",
      licenseKey: "EDU-UNIV-2026",
      licenseExpiresAt: null,
      licenseProgram: "EDU Pro",
      licenseActivatedAt: SEED_BASELINE_ISO,
      isDemo: true,
      createdAt: SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: SEED_BASELINE_ISO,
    },
    {
      id: "demo_enterprise_pro",
      fullName: "Mgr. Marek Novák",
      email: "firma@kompas.sk",
      passwordHash: "67b623260e5e8d25fce3f644caa92e8859de3c5f75b78fd11a3aa54dd05a59b2",
      hashAlg: "sha256-offline-v1",
      accountType: "manager",
      accountTypeLabel: "💼 Manažér",
      organization: "Kompas Advisory s.r.o.",
      tier: "enterprise_pro",
      licenseKey: "ENT-PRO-2026",
      licenseExpiresAt: null,
      licenseProgram: "Enterprise Pro",
      licenseActivatedAt: SEED_BASELINE_ISO,
      isDemo: true,
      createdAt: SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: SEED_BASELINE_ISO,
    },
  ],
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  ...CORS_HEADERS,
};

function parseTimeMs(isoValue) {
  if (!isoValue) return 0;
  const ms = Date.parse(isoValue);
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeTier(rawTier) {
  const t = String(rawTier || "").trim().toLowerCase();
  if (t === "enterprise_pro" || t === "edu_pro" || t === "free") return t;
  return "free";
}

function normalizeAccountType(rawType) {
  const t = String(rawType || "").trim().toLowerCase();
  if (t === "manager" || t === "teacher" || t === "student") return t;
  return "student";
}

function normalizeUserRecord(raw, fallbackIso = SEED_BASELINE_ISO) {
  if (!raw || typeof raw !== "object") return null;
  const email = normalizeEmail(raw.email);
  if (!email) return null;

  const accountType = normalizeAccountType(raw.accountType);
  const tier = normalizeTier(raw.tier);
  const createdAt = String(raw.createdAt || fallbackIso);
  const lastLoginAt = raw.lastLoginAt || null;
  const updatedAt = String(raw.updatedAt || lastLoginAt || createdAt || fallbackIso);

  return {
    id: String(raw.id || "").trim() || `usr_${email.replace(/[^a-z0-9]/g, "_")}`,
    fullName: String(raw.fullName || email.split("@")[0] || "Používateľ").trim(),
    email,
    passwordHash: String(raw.passwordHash || ""),
    hashAlg: String(raw.hashAlg || "sha256-offline-v1"),
    accountType,
    accountTypeLabel:
      String(raw.accountTypeLabel || "").trim() || ACCOUNT_LABELS[accountType] || "🎓 Študent VŠ",
    organization: String(raw.organization || "").trim(),
    tier,
    licenseKey: String(raw.licenseKey || "").trim().toUpperCase(),
    licenseExpiresAt: raw.licenseExpiresAt || null,
    licenseProgram: String(raw.licenseProgram || "").trim(),
    licenseActivatedAt: raw.licenseActivatedAt || null,
    isDemo: Boolean(raw.isDemo),
    createdAt,
    lastLoginAt,
    updatedAt,
  };
}

function recordFreshnessMs(rec) {
  if (!rec) return 0;
  return Math.max(
    parseTimeMs(rec.updatedAt),
    parseTimeMs(rec.lastLoginAt),
    parseTimeMs(rec.createdAt),
  );
}

function normalizeUsersDatabase(rawDb, fallbackIso = new Date().toISOString()) {
  const source = rawDb && typeof rawDb === "object" ? rawDb : {};
  const baseUpdatedAt = String(source.updatedAt || fallbackIso);
  const deletedAtMap = {};

  if (source.deletedAtMap && typeof source.deletedAtMap === "object") {
    for (const rawEm of Object.keys(source.deletedAtMap)) {
      const em = normalizeEmail(rawEm);
      if (!em) continue;
      const iso = String(source.deletedAtMap[rawEm] || baseUpdatedAt);
      if (!deletedAtMap[em] || parseTimeMs(iso) >= parseTimeMs(deletedAtMap[em])) {
        deletedAtMap[em] = iso;
      }
    }
  }

  if (Array.isArray(source.deletedEmails)) {
    for (const rawEm of source.deletedEmails) {
      const em = normalizeEmail(rawEm);
      if (!em) continue;
      if (!deletedAtMap[em]) deletedAtMap[em] = baseUpdatedAt;
    }
  }

  const usersMap = new Map();
  if (Array.isArray(source.users)) {
    for (const rawRec of source.users) {
      const rec = normalizeUserRecord(rawRec, baseUpdatedAt);
      if (!rec) continue;
      const existing = usersMap.get(rec.email);
      if (!existing || recordFreshnessMs(rec) >= recordFreshnessMs(existing)) {
        usersMap.set(rec.email, rec);
      }
    }
  }

  for (const [email, rec] of usersMap.entries()) {
    const delIso = deletedAtMap[email];
    if (delIso) {
      if (parseTimeMs(delIso) >= recordFreshnessMs(rec)) {
        usersMap.delete(email);
      } else {
        delete deletedAtMap[email];
      }
    }
  }

  const users = Array.from(usersMap.values()).sort(
    (a, b) => parseTimeMs(b.createdAt) - parseTimeMs(a.createdAt),
  );

  return {
    schemaVersion: String(source.schemaVersion || "1.0"),
    updatedAt: baseUpdatedAt,
    deletedEmails: Object.keys(deletedAtMap).sort(),
    deletedAtMap,
    users,
  };
}

function mergeUsersDatabases(baseDb, incomingDb) {
  const base = normalizeUsersDatabase(baseDb || INITIAL_SEED_USERS_DB);
  const inc = normalizeUsersDatabase(incomingDb || {});
  const mergedDeleted = { ...(base.deletedAtMap || {}) };

  for (const [em, iso] of Object.entries(inc.deletedAtMap || {})) {
    if (!mergedDeleted[em] || parseTimeMs(iso) >= parseTimeMs(mergedDeleted[em])) {
      mergedDeleted[em] = iso;
    }
  }

  const usersMap = new Map();
  for (const rec of base.users) usersMap.set(rec.email, rec);
  for (const rec of inc.users) {
    const existing = usersMap.get(rec.email);
    if (!existing) {
      usersMap.set(rec.email, rec);
    } else if (recordFreshnessMs(rec) >= recordFreshnessMs(existing)) {
      usersMap.set(rec.email, {
        ...existing,
        ...rec,
        passwordHash: rec.passwordHash || existing.passwordHash || "",
      });
    }
  }

  for (const [em, rec] of usersMap.entries()) {
    const delIso = mergedDeleted[em];
    if (delIso) {
      if (parseTimeMs(delIso) >= recordFreshnessMs(rec)) {
        usersMap.delete(em);
      } else {
        delete mergedDeleted[em];
      }
    }
  }

  const nowIso =
    parseTimeMs(inc.updatedAt) >= parseTimeMs(base.updatedAt) ? inc.updatedAt : base.updatedAt;

  return {
    schemaVersion: inc.schemaVersion || base.schemaVersion || "1.0",
    updatedAt: nowIso || new Date().toISOString(),
    deletedEmails: Object.keys(mergedDeleted).sort(),
    deletedAtMap: mergedDeleted,
    users: Array.from(usersMap.values()).sort(
      (a, b) => parseTimeMs(b.createdAt) - parseTimeMs(a.createdAt),
    ),
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...NO_CACHE_HEADERS,
    },
  });
}

async function readOrSeedUsersDb(store) {
  const existing = await store.get(BLOB_KEY, { type: "json" });
  if (existing && typeof existing === "object" && Array.isArray(existing.users)) {
    return normalizeUsersDatabase(existing, existing.updatedAt || INITIAL_SEED_USERS_DB.updatedAt);
  }
  const seeded = normalizeUsersDatabase(INITIAL_SEED_USERS_DB, INITIAL_SEED_USERS_DB.updatedAt);
  await store.setJSON(BLOB_KEY, seeded);
  return seeded;
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: NO_CACHE_HEADERS });
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });

    if (pathname === "/databaza-uzivatelov.js") {
      if (method !== "GET" && method !== "HEAD") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
      }
      const db = await readOrSeedUsersDb(store);
      const jsBody =
        "/* Manažérsky Kompas — Netlify Cloud Databáza registrovaných používateľov */\n" +
        `window.__KOMPAS_USERS_DB__ = ${JSON.stringify(db, null, 2)};\n` +
        "window.__KOMPAS_USERS_CLOUD_ACTIVE__ = true;\n";
      return new Response(method === "HEAD" ? null : jsBody, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          ...NO_CACHE_HEADERS,
        },
      });
    }

    if (pathname === "/databaza-uzivatelov.json") {
      if (method !== "GET" && method !== "HEAD") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
      }
      const db = await readOrSeedUsersDb(store);
      return new Response(method === "HEAD" ? null : JSON.stringify(db, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...NO_CACHE_HEADERS,
        },
      });
    }

    if (pathname === "/api/users-db") {
      if (method === "GET" || method === "HEAD") {
        const db = await readOrSeedUsersDb(store);
        if (method === "HEAD") {
          return new Response(null, {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...NO_CACHE_HEADERS,
            },
          });
        }
        return jsonResponse({
          ok: true,
          storage: "netlify-blobs",
          updatedAt: db.updatedAt,
          total: db.users.length,
          db,
        });
      }

      if (method === "POST" || method === "PUT") {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: "Neplatný JSON v tele požiadavky." }, 400);
        }

        const nowIso = new Date().toISOString();
        const currentDb = await readOrSeedUsersDb(store);

        if (payload && payload.action === "upsert" && payload.user) {
          const rec = normalizeUserRecord({ ...payload.user, updatedAt: nowIso }, nowIso);
          if (!rec) {
            return jsonResponse({ ok: false, error: "Neplatný záznam používateľa." }, 400);
          }
          const nextDeleted = { ...(currentDb.deletedAtMap || {}) };
          delete nextDeleted[rec.email];
          const nextDb = mergeUsersDatabases(currentDb, {
            schemaVersion: currentDb.schemaVersion || "1.0",
            updatedAt: nowIso,
            deletedAtMap: nextDeleted,
            deletedEmails: Object.keys(nextDeleted).sort(),
            users: [rec],
          });
          await store.setJSON(BLOB_KEY, nextDb);
          return jsonResponse({
            ok: true,
            storage: "netlify-blobs",
            updatedAt: nextDb.updatedAt,
            total: nextDb.users.length,
            db: nextDb,
          });
        }

        if (payload && payload.action === "delete" && payload.email) {
          const em = normalizeEmail(payload.email);
          const nextDeleted = {
            ...(currentDb.deletedAtMap || {}),
            [em]: nowIso,
          };
          const filteredUsers = (currentDb.users || []).filter(
            (u) => u.email !== em || u.isDemo,
          );
          if (filteredUsers.some((u) => u.email === em && u.isDemo)) {
            delete nextDeleted[em];
          }
          const nextDb = normalizeUsersDatabase(
            {
              ...currentDb,
              updatedAt: nowIso,
              deletedAtMap: nextDeleted,
              deletedEmails: Object.keys(nextDeleted).sort(),
              users: filteredUsers,
            },
            nowIso,
          );
          await store.setJSON(BLOB_KEY, nextDb);
          return jsonResponse({
            ok: true,
            storage: "netlify-blobs",
            updatedAt: nextDb.updatedAt,
            total: nextDb.users.length,
            db: nextDb,
          });
        }

        const candidate =
          payload && typeof payload === "object" && payload.db && typeof payload.db === "object"
            ? payload.db
            : payload;

        if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.users)) {
          return jsonResponse(
            { ok: false, error: "Neplatná schéma databázy: očakáva sa objekt s poľom users." },
            400,
          );
        }

        const mergedDb = mergeUsersDatabases(currentDb, {
          ...candidate,
          updatedAt: candidate.updatedAt || nowIso,
        });
        await store.setJSON(BLOB_KEY, mergedDb);

        return jsonResponse({
          ok: true,
          storage: "netlify-blobs",
          updatedAt: mergedDb.updatedAt,
          total: mergedDb.users.length,
          db: mergedDb,
        });
      }

      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    return jsonResponse({ ok: false, error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err && err.message ? err.message : "Unexpected Netlify Blobs error" },
      500,
    );
  }
}

export const config = {
  path: ["/api/users-db", "/databaza-uzivatelov.js", "/databaza-uzivatelov.json"],
};
