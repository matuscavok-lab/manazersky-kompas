import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";

const STORE_NAME = "kompas-license-db";
const BLOB_KEY = "license-db-v1";
const SEED_BASELINE_ISO = "2026-01-01T00:00:00.000Z";

const INITIAL_SEED_DB = {
  schemaVersion: "1.0",
  updatedAt: "2026-11-21T21:48:11.450Z",
  enforceDatabase: true,
  deletedKeys: [
    "KOMPAS-PRO-20271231-A1B2-586CAD",
    "KOMPAS-EDU-PERM-UNIV-4F2ABC",
  ],
  deletedAtMap: {
    "KOMPAS-PRO-20271231-A1B2-586CAD": "2026-11-21T21:44:03.550Z",
    "KOMPAS-EDU-PERM-UNIV-4F2ABC": "2026-11-21T21:45:08.914Z",
  },
  keys: [
    {
      id: "db_seed_edu_univ_2026",
      key: "EDU-UNIV-2026",
      programCode: "EDU",
      expiryCode: "PERM",
      nonce: "LEGACY",
      signature: "",
      isLegacy: true,
      status: "active",
      note: "Demo / Univerzitný účet EDU Pro (legacy)",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      revokedAt: null,
      revokedReason: "",
    },
    {
      id: "db_seed_ent_pro_2026",
      key: "ENT-PRO-2026",
      programCode: "PRO",
      expiryCode: "PERM",
      nonce: "LEGACY",
      signature: "",
      isLegacy: true,
      status: "revoked",
      note: "Demo účet Enterprise Pro (legacy)",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-11-21T21:48:11.450Z",
      revokedAt: "2026-11-21T21:48:11.450Z",
      revokedReason: "Zneužitie / zdieľanie kľúča",
    },
    {
      id: "db_seed_kompas_edu_2026",
      key: "KOMPAS-EDU-2026",
      programCode: "EDU",
      expiryCode: "PERM",
      nonce: "LEGACY",
      signature: "",
      isLegacy: true,
      status: "active",
      note: "Ukážkový kľúč EDU Pro (legacy)",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      revokedAt: null,
      revokedReason: "",
    },
    {
      id: "db_seed_kompas_pro_2026",
      key: "KOMPAS-PRO-2026",
      programCode: "PRO",
      expiryCode: "PERM",
      nonce: "LEGACY",
      signature: "",
      isLegacy: true,
      status: "revoked",
      note: "Ukážkový kľúč Enterprise Pro (legacy)",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-11-21T21:47:31.371Z",
      revokedAt: "2026-11-21T21:47:31.371Z",
      revokedReason: "",
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

function inferProgramCode(cleanKey, rawProg) {
  const prog = String(rawProg || "").trim().toUpperCase();
  if (prog === "PRO" || prog === "EDU" || prog === "FREE") return prog;
  if (
    cleanKey.startsWith("KOMPAS-PRO-") ||
    cleanKey.startsWith("KOMPAS-ENT-") ||
    cleanKey.startsWith("ENT-") ||
    cleanKey.startsWith("PRO-") ||
    cleanKey.startsWith("CORP-")
  ) {
    return "PRO";
  }
  if (cleanKey.startsWith("KOMPAS-FREE-") || cleanKey.startsWith("FREE-")) {
    return "FREE";
  }
  return "EDU";
}

function normalizeRecord(raw, fallbackIso = SEED_BASELINE_ISO) {
  if (!raw || typeof raw !== "object") return null;
  const cleanKey = String(raw.key || "").trim().toUpperCase();
  if (!cleanKey) return null;

  const programCode = inferProgramCode(cleanKey, raw.programCode);
  const expRaw = String(raw.expiryCode || "PERM").trim().toUpperCase();
  const expiryCode = expRaw === "PERM" || /^\d{8}$/.test(expRaw) ? expRaw : "PERM";
  const status = String(raw.status || "").trim().toLowerCase() === "revoked" ? "revoked" : "active";
  const createdAt = String(raw.createdAt || raw.updatedAt || fallbackIso);
  const updatedAt = String(raw.updatedAt || raw.createdAt || fallbackIso);

  return {
    id: String(raw.id || `db_${cleanKey.replace(/[^A-Z0-9]/g, "_").toLowerCase()}`),
    key: cleanKey,
    programCode,
    expiryCode,
    nonce: String(raw.nonce || (raw.isLegacy ? "LEGACY" : "")).trim().toUpperCase(),
    signature: String(raw.signature || "").trim().toUpperCase(),
    isLegacy: Boolean(raw.isLegacy),
    status,
    note: String(raw.note || ""),
    createdAt,
    updatedAt,
    revokedAt: status === "revoked" ? (raw.revokedAt || updatedAt) : null,
    revokedReason: status === "revoked" ? String(raw.revokedReason || "") : "",
  };
}

function normalizeDatabase(rawDb, fallbackIso = new Date().toISOString()) {
  const source = rawDb && typeof rawDb === "object" ? rawDb : {};
  const baseUpdatedAt = String(source.updatedAt || fallbackIso);
  const deletedAtMap = {};

  if (source.deletedAtMap && typeof source.deletedAtMap === "object") {
    for (const rawKey of Object.keys(source.deletedAtMap)) {
      const k = String(rawKey || "").trim().toUpperCase();
      if (!k) continue;
      const iso = String(source.deletedAtMap[rawKey] || baseUpdatedAt);
      if (!deletedAtMap[k] || parseTimeMs(iso) >= parseTimeMs(deletedAtMap[k])) {
        deletedAtMap[k] = iso;
      }
    }
  }

  if (Array.isArray(source.deletedKeys)) {
    for (const rawKey of source.deletedKeys) {
      const k = String(rawKey || "").trim().toUpperCase();
      if (!k) continue;
      if (!deletedAtMap[k]) {
        deletedAtMap[k] = baseUpdatedAt;
      }
    }
  }

  const keysMap = new Map();
  if (Array.isArray(source.keys)) {
    for (const rawRec of source.keys) {
      const rec = normalizeRecord(rawRec, baseUpdatedAt);
      if (!rec) continue;
      const existing = keysMap.get(rec.key);
      if (!existing || parseTimeMs(rec.updatedAt) >= parseTimeMs(existing.updatedAt)) {
        keysMap.set(rec.key, rec);
      }
    }
  }

  for (const [key, rec] of keysMap.entries()) {
    const delIso = deletedAtMap[key];
    if (delIso) {
      if (parseTimeMs(delIso) >= parseTimeMs(rec.updatedAt)) {
        keysMap.delete(key);
      } else {
        delete deletedAtMap[key];
      }
    }
  }

  const keys = Array.from(keysMap.values()).sort(
    (a, b) => parseTimeMs(b.createdAt) - parseTimeMs(a.createdAt),
  );

  return {
    schemaVersion: String(source.schemaVersion || "1.0"),
    updatedAt: baseUpdatedAt,
    enforceDatabase: true,
    deletedKeys: Object.keys(deletedAtMap).sort(),
    deletedAtMap,
    keys,
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

async function readOrSeedDb(store) {
  const existing = await store.get(BLOB_KEY, { type: "json" });
  if (existing && typeof existing === "object" && Array.isArray(existing.keys)) {
    return normalizeDatabase(existing, existing.updatedAt || INITIAL_SEED_DB.updatedAt);
  }
  const seeded = normalizeDatabase(INITIAL_SEED_DB, INITIAL_SEED_DB.updatedAt);
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

    if (pathname === "/databaza-klucov.js") {
      if (method !== "GET" && method !== "HEAD") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
      }
      const db = await readOrSeedDb(store);
      const jsBody =
        "/* Manažérsky Kompas — Netlify Cloud Databáza licenčných kľúčov */\n" +
        `window.__KOMPAS_LICENSE_DB__ = ${JSON.stringify(db, null, 2)};\n` +
        "window.__KOMPAS_NETLIFY_CLOUD_ACTIVE__ = true;\n";
      return new Response(method === "HEAD" ? null : jsBody, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          ...NO_CACHE_HEADERS,
        },
      });
    }

    if (pathname === "/databaza-klucov.json") {
      if (method !== "GET" && method !== "HEAD") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
      }
      const db = await readOrSeedDb(store);
      return new Response(method === "HEAD" ? null : JSON.stringify(db, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...NO_CACHE_HEADERS,
        },
      });
    }

    if (pathname === "/api/license-db") {
      if (method === "GET" || method === "HEAD") {
        const db = await readOrSeedDb(store);
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
          total: db.keys.length,
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

        const candidate =
          payload && typeof payload === "object" && payload.db && typeof payload.db === "object"
            ? payload.db
            : payload;

        if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.keys)) {
          return jsonResponse(
            { ok: false, error: "Neplatná schéma databázy: očakáva sa objekt s poľom keys." },
            400,
          );
        }

        const nowIso = new Date().toISOString();
        const normalizedDb = normalizeDatabase(
          {
            ...candidate,
            updatedAt: candidate.updatedAt || nowIso,
          },
          nowIso,
        );

        await store.setJSON(BLOB_KEY, normalizedDb);

        return jsonResponse({
          ok: true,
          storage: "netlify-blobs",
          updatedAt: normalizedDb.updatedAt,
          total: normalizedDb.keys.length,
          db: normalizedDb,
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
  path: ["/api/license-db", "/databaza-klucov.js", "/databaza-klucov.json"],
};
