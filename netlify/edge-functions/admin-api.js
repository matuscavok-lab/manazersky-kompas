import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";
import {
  LICENSE_BLOB_KEY,
  LICENSE_STORE_NAME,
  USERS_BLOB_KEY,
  USERS_STORE_NAME,
  buildCorsHeaders,
  getEnv,
  jsonResponse,
  mergeUsersDatabases,
  normalizeEmail,
  normalizeLicenseDb,
  normalizeUserRecord,
  normalizeUsersDb,
  readOrSeedLicenseDb,
  readOrSeedUsersDb,
  requireAdminSecret,
  signServerLicenseKeyV2,
  toPublicUser,
} from "./_shared/security.js";

function sanitizeUsersDbForAdmin(db) {
  return {
    schemaVersion: db.schemaVersion || "1.0",
    updatedAt: db.updatedAt,
    deletedEmails: db.deletedEmails || [],
    deletedAtMap: db.deletedAtMap || {},
    users: (db.users || []).map((u) => toPublicUser(u)),
  };
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const corsHeaders = buildCorsHeaders(request, { allowAdminOrigin: true });

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const adminCheck = requireAdminSecret(request, corsHeaders);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    if (pathname === "/api/admin/keys") {
      const store = getStore({ name: LICENSE_STORE_NAME, consistency: "strong" });

      if (method === "GET" || method === "HEAD") {
        const db = await readOrSeedLicenseDb(store);
        if (method === "HEAD") {
          return new Response(null, { status: 200, headers: corsHeaders });
        }
        return jsonResponse(
          {
            ok: true,
            storage: "netlify-blobs",
            updatedAt: db.updatedAt,
            total: db.keys.length,
            db,
          },
          200,
          corsHeaders,
        );
      }

      if (method === "POST" || method === "PUT") {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: "Neplatný JSON v tele požiadavky." }, 400, corsHeaders);
        }

        const nowIso = new Date().toISOString();

        if (payload && payload.action === "sign") {
          const signed = await signServerLicenseKeyV2({
            programCode: payload.programCode || "EDU",
            expiryCode: payload.expiryCode || "PERM",
            nonce: payload.nonce || "",
            hmacSecret: getEnv("LICENSE_HMAC_SECRET"),
          });

          const currentDb = await readOrSeedLicenseDb(store);
          if (payload.saveToDb !== false) {
            const newRecord = {
              id: `db_${signed.key.replace(/[^A-Z0-9]/g, "_").toLowerCase()}`,
              key: signed.key,
              programCode: signed.programCode,
              expiryCode: signed.expiryCode,
              nonce: signed.nonce,
              signature: signed.signature,
              isLegacy: false,
              status: "active",
              note: String(payload.note || "Podpísané cez /api/admin/keys"),
              createdAt: nowIso,
              updatedAt: nowIso,
              revokedAt: null,
              revokedReason: "",
            };
            const nextDeletedAtMap = { ...(currentDb.deletedAtMap || {}) };
            delete nextDeletedAtMap[signed.key];
            const nextDb = normalizeLicenseDb(
              {
                ...currentDb,
                updatedAt: nowIso,
                deletedAtMap: nextDeletedAtMap,
                deletedKeys: Object.keys(nextDeletedAtMap).sort(),
                keys: [newRecord, ...(currentDb.keys || [])],
              },
              nowIso,
            );
            await store.setJSON(LICENSE_BLOB_KEY, nextDb);
            return jsonResponse(
              {
                ok: true,
                storage: "netlify-blobs",
                signed,
                updatedAt: nextDb.updatedAt,
                total: nextDb.keys.length,
                db: nextDb,
              },
              200,
              corsHeaders,
            );
          }

          return jsonResponse(
            {
              ok: true,
              storage: "netlify-blobs",
              signed,
              updatedAt: currentDb.updatedAt,
              total: currentDb.keys.length,
              db: currentDb,
            },
            200,
            corsHeaders,
          );
        }

        const candidate =
          payload && typeof payload === "object" && payload.db && typeof payload.db === "object"
            ? payload.db
            : payload;

        if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.keys)) {
          return jsonResponse(
            { ok: false, error: "Neplatná schéma databázy: očakáva sa objekt s poľom keys." },
            400,
            corsHeaders,
          );
        }

        const normalizedDb = normalizeLicenseDb(
          {
            ...candidate,
            updatedAt: candidate.updatedAt || nowIso,
          },
          nowIso,
        );
        await store.setJSON(LICENSE_BLOB_KEY, normalizedDb);

        return jsonResponse(
          {
            ok: true,
            storage: "netlify-blobs",
            updatedAt: normalizedDb.updatedAt,
            total: normalizedDb.keys.length,
            db: normalizedDb,
          },
          200,
          corsHeaders,
        );
      }

      return jsonResponse({ ok: false, error: "Method not allowed" }, 405, corsHeaders);
    }

    if (pathname === "/api/admin/users") {
      const store = getStore({ name: USERS_STORE_NAME, consistency: "strong" });

      if (method === "GET" || method === "HEAD") {
        const db = await readOrSeedUsersDb(store);
        if (method === "HEAD") {
          return new Response(null, { status: 200, headers: corsHeaders });
        }
        return jsonResponse(
          {
            ok: true,
            storage: "netlify-blobs",
            updatedAt: db.updatedAt,
            total: db.users.length,
            db: sanitizeUsersDbForAdmin(db),
          },
          200,
          corsHeaders,
        );
      }

      if (method === "POST" || method === "PUT") {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: "Neplatný JSON v tele požiadavky." }, 400, corsHeaders);
        }

        const nowIso = new Date().toISOString();
        const currentDb = await readOrSeedUsersDb(store);

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
          const nextDb = normalizeUsersDb(
            {
              ...currentDb,
              updatedAt: nowIso,
              deletedAtMap: nextDeleted,
              deletedEmails: Object.keys(nextDeleted).sort(),
              users: filteredUsers,
            },
            nowIso,
          );
          await store.setJSON(USERS_BLOB_KEY, nextDb);
          return jsonResponse(
            {
              ok: true,
              storage: "netlify-blobs",
              updatedAt: nextDb.updatedAt,
              total: nextDb.users.length,
              db: sanitizeUsersDbForAdmin(nextDb),
            },
            200,
            corsHeaders,
          );
        }

        if (payload && payload.action === "upsert" && payload.user) {
          const incomingEmail = normalizeEmail(payload.user.email);
          const existing = (currentDb.users || []).find((u) => u.email === incomingEmail);
          const rec = normalizeUserRecord(
            {
              ...payload.user,
              passwordHash: existing ? existing.passwordHash : payload.user.passwordHash || "",
              hashAlg: existing ? existing.hashAlg : payload.user.hashAlg || "sha256-offline-v1",
              updatedAt: nowIso,
            },
            nowIso,
          );
          if (!rec) {
            return jsonResponse({ ok: false, error: "Neplatný záznam používateľa." }, 400, corsHeaders);
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
          await store.setJSON(USERS_BLOB_KEY, nextDb);
          return jsonResponse(
            {
              ok: true,
              storage: "netlify-blobs",
              updatedAt: nextDb.updatedAt,
              total: nextDb.users.length,
              db: sanitizeUsersDbForAdmin(nextDb),
            },
            200,
            corsHeaders,
          );
        }

        const candidate =
          payload && typeof payload === "object" && payload.db && typeof payload.db === "object"
            ? payload.db
            : payload;

        if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.users)) {
          return jsonResponse(
            { ok: false, error: "Neplatná schéma databázy: očakáva sa objekt s poľom users." },
            400,
            corsHeaders,
          );
        }

        const mergedDb = mergeUsersDatabases(currentDb, {
          ...candidate,
          updatedAt: candidate.updatedAt || nowIso,
        });
        await store.setJSON(USERS_BLOB_KEY, mergedDb);

        return jsonResponse(
          {
            ok: true,
            storage: "netlify-blobs",
            updatedAt: mergedDb.updatedAt,
            total: mergedDb.users.length,
            db: sanitizeUsersDbForAdmin(mergedDb),
          },
          200,
          corsHeaders,
        );
      }

      return jsonResponse({ ok: false, error: "Method not allowed" }, 405, corsHeaders);
    }

    return jsonResponse({ ok: false, error: "Endpoint neexistuje." }, 404, corsHeaders);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err && err.message ? err.message : "Unexpected Admin API error" },
      500,
      corsHeaders,
    );
  }
}

export const config = {
  path: ["/api/admin/keys", "/api/admin/users"],
};
