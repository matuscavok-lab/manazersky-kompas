import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";

export const LICENSE_STORE_NAME = "kompas-license-db";
export const LICENSE_BLOB_KEY = "license-db-v1";
export const USERS_STORE_NAME = "kompas-users-db";
export const USERS_BLOB_KEY = "users-db-v1";

const LICENSE_SEED_BASELINE_ISO = "2026-01-01T00:00:00.000Z";
const USERS_SEED_BASELINE_ISO = "2026-01-15T09:00:00.000Z";
const LEGACY_PASSWORD_PEPPER = "manazersky-kompas-v07-sha256-salt";
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_DAYS = 30;

export const ACCOUNT_LABELS = {
  student: "🎓 Študent VŠ",
  manager: "💼 Manažér",
  teacher: "🏫 Pedagóg",
};

export const LICENSE_PROGRAM_MAP = {
  EDU: { code: "EDU", tier: "edu_pro", label: "EDU Pro" },
  PRO: { code: "PRO", tier: "enterprise_pro", label: "Enterprise Pro" },
  FREE: { code: "FREE", tier: "free", label: "Free" },
};

export const INITIAL_SEED_LICENSE_DB = {
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
      createdAt: LICENSE_SEED_BASELINE_ISO,
      updatedAt: LICENSE_SEED_BASELINE_ISO,
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
      createdAt: LICENSE_SEED_BASELINE_ISO,
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
      createdAt: LICENSE_SEED_BASELINE_ISO,
      updatedAt: LICENSE_SEED_BASELINE_ISO,
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
      createdAt: LICENSE_SEED_BASELINE_ISO,
      updatedAt: "2026-11-21T21:47:31.371Z",
      revokedAt: "2026-11-21T21:47:31.371Z",
      revokedReason: "",
    },
  ],
};

export const INITIAL_SEED_USERS_DB = {
  schemaVersion: "1.0",
  updatedAt: USERS_SEED_BASELINE_ISO,
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
      createdAt: USERS_SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: USERS_SEED_BASELINE_ISO,
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
      licenseActivatedAt: USERS_SEED_BASELINE_ISO,
      isDemo: true,
      createdAt: USERS_SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: USERS_SEED_BASELINE_ISO,
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
      licenseActivatedAt: USERS_SEED_BASELINE_ISO,
      isDemo: true,
      createdAt: USERS_SEED_BASELINE_ISO,
      lastLoginAt: null,
      updatedAt: USERS_SEED_BASELINE_ISO,
    },
  ],
};

export function getEnv(name) {
  try {
    if (globalThis.Netlify && globalThis.Netlify.env && typeof globalThis.Netlify.env.get === "function") {
      const val = globalThis.Netlify.env.get(name);
      if (val !== undefined && val !== null) return String(val);
    }
  } catch {}
  try {
    if (globalThis.Deno && globalThis.Deno.env && typeof globalThis.Deno.env.get === "function") {
      const val = globalThis.Deno.env.get(name);
      if (val !== undefined && val !== null) return String(val);
    }
  } catch {}
  return "";
}

function normalizeOriginString(val) {
  return String(val || "").trim().replace(/\/+$/, "");
}

function isOriginAllowed(reqOrigin, requestUrl, allowAdminOrigin) {
  if (!reqOrigin) return false;
  if (allowAdminOrigin && reqOrigin === "null") {
    return true;
  }

  const cleanReqOrigin = normalizeOriginString(reqOrigin);
  try {
    const sameOrigin = normalizeOriginString(new URL(requestUrl).origin);
    if (cleanReqOrigin === sameOrigin) return true;
  } catch {}

  if (cleanReqOrigin === "https://kompas.app" || cleanReqOrigin === "https://localhost") {
    return true;
  }

  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanReqOrigin)) {
    return true;
  }
  if (/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanReqOrigin)) {
    return true;
  }

  const extraOrigins = getEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((s) => normalizeOriginString(s))
    .filter(Boolean);

  return extraOrigins.includes(cleanReqOrigin);
}

export function buildCorsHeaders(request, { allowAdminOrigin = false } = {}) {
  const reqOrigin = request.headers.get("origin") || "";
  const allowed = isOriginAllowed(reqOrigin, request.url, allowAdminOrigin);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": allowAdminOrigin
      ? "Content-Type, Authorization, X-Admin-Secret"
      : "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = reqOrigin === "null" ? "null" : normalizeOriginString(reqOrigin);
  }
  return headers;
}

export function jsonResponse(payload, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Vary: "Origin",
      ...corsHeaders,
    },
  });
}

export function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ba = enc.encode(String(a ?? ""));
  const bb = enc.encode(String(b ?? ""));
  const len = Math.max(ba.length, bb.length);
  let diff = ba.length ^ bb.length;
  for (let i = 0; i < len; i += 1) {
    diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    return null;
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64u) {
  const clean = String(b64u || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = clean.length % 4 === 0 ? "" : "=".repeat(4 - (clean.length % 4));
  const binary = atob(clean + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function strToBase64Url(str) {
  return bytesToBase64Url(new TextEncoder().encode(String(str ?? "")));
}

function base64UrlToStr(b64u) {
  return new TextDecoder().decode(base64UrlToBytes(b64u));
}

export async function sha256Hex(message) {
  const data = new TextEncoder().encode(String(message ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret ?? "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function hmacSha256Hex(secret, message) {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(message ?? "")));
  return bytesToHex(new Uint8Array(sig));
}

export async function hmacSha256Base64Url(secret, message) {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(message ?? "")));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function hashPasswordPbkdf2(password, existingSaltHex = null) {
  const saltBytes = existingSaltHex
    ? hexToBytes(existingSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));
  if (!saltBytes || saltBytes.length < 8) {
    throw new Error("Neplatný salt pre PBKDF2.");
  }
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password ?? "")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const saltHex = bytesToHex(saltBytes);
  const hashHex = bytesToHex(new Uint8Array(derived));
  return `pbkdf2-sha256-v1$${saltHex}$${hashHex}`;
}

export async function verifyUserPassword(rawPassword, email, storedHash, hashAlg = "") {
  const pwd = String(rawPassword ?? "");
  const cleanStored = String(storedHash ?? "").trim();
  if (!pwd || !cleanStored) {
    return { valid: false, needsUpgrade: false };
  }

  if (cleanStored.startsWith("pbkdf2-sha256-v1$") || hashAlg === "pbkdf2-sha256-v1") {
    const parts = cleanStored.split("$");
    if (parts.length !== 3 || parts[0] !== "pbkdf2-sha256-v1") {
      return { valid: false, needsUpgrade: false };
    }
    const recomputed = await hashPasswordPbkdf2(pwd, parts[1]);
    return { valid: timingSafeEqual(recomputed, cleanStored), needsUpgrade: false };
  }

  const legacyPayload = `${LEGACY_PASSWORD_PEPPER}:${normalizeEmail(email)}:${pwd}`;
  const legacyDigest = await sha256Hex(legacyPayload);
  const isLegacyMatch = timingSafeEqual(legacyDigest, cleanStored.toLowerCase());
  return { valid: isLegacyMatch, needsUpgrade: isLegacyMatch };
}

export async function createSessionToken(user, secret, ttlDays = SESSION_TTL_DAYS) {
  const nowSec = Math.floor(Date.now() / 1000);
  const headerB64 = strToBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadB64 = strToBase64Url(
    JSON.stringify({
      sub: String(user.id || ""),
      email: normalizeEmail(user.email),
      iat: nowSec,
      exp: nowSec + Math.max(1, Number(ttlDays) || SESSION_TTL_DAYS) * 86400,
    }),
  );
  const sigB64 = await hmacSha256Base64Url(secret, `${headerB64}.${payloadB64}`);
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token, secret) {
  try {
    const raw = String(token || "").trim();
    if (!raw || !secret) {
      return { valid: false, error: "Chýba autentifikačný token." };
    }
    const parts = raw.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Neplatný formát relácie." };
    }
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = await hmacSha256Base64Url(secret, `${headerB64}.${payloadB64}`);
    if (!timingSafeEqual(sigB64, expectedSig)) {
      return { valid: false, error: "Neplatný podpis autentifikačného tokenu." };
    }
    const payload = JSON.parse(base64UrlToStr(payloadB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload || !payload.email || !payload.exp || nowSec >= Number(payload.exp)) {
      return { valid: false, error: "Platnosť relácie vypršala. Prihláste sa prosím znova." };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Neplatný autentifikačný token." };
  }
}

export function extractBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function requireAdminSecret(request, corsHeaders = {}) {
  const expectedSecret = getEnv("ADMIN_API_SECRET").trim();
  if (!expectedSecret) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error:
            "ADMIN_API_SECRET nie je nakonfigurovaný na serveri. Nastavte env premennú ADMIN_API_SECRET v Netlify Dashboarde.",
        },
        503,
        corsHeaders,
      ),
    };
  }
  const providedSecret = (request.headers.get("x-admin-secret") || "").trim();
  if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: "Neautorizovaný prístup: chýba alebo nesedí X-Admin-Secret.",
        },
        401,
        corsHeaders,
      ),
    };
  }
  return { ok: true };
}

export function parseTimeMs(isoValue) {
  if (!isoValue) return 0;
  const ms = Date.parse(isoValue);
  return Number.isFinite(ms) ? ms : 0;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeTier(rawTier) {
  const t = String(rawTier || "").trim().toLowerCase();
  if (t === "enterprise_pro" || t === "edu_pro" || t === "free") return t;
  return "free";
}

export function normalizeAccountType(rawType) {
  const t = String(rawType || "").trim().toLowerCase();
  if (t === "manager" || t === "teacher" || t === "student") return t;
  return "student";
}

export function getUserInitials(fullName) {
  const cleaned = String(fullName || "")
    .replace(/\b(Bc|Mgr|Ing|MUDr|JUDr|PhDr|RNDr|PaedDr|PhD|ThDr|prof|doc)\.?/gi, " ")
    .replace(/,/g, " ")
    .trim();
  if (!cleaned) return "MK";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toPublicUser(rec) {
  if (!rec || typeof rec !== "object") return null;
  const accountType = normalizeAccountType(rec.accountType);
  const tier = normalizeTier(rec.tier);
  return {
    id: String(rec.id || ""),
    fullName: String(rec.fullName || ""),
    initials: getUserInitials(rec.fullName),
    email: normalizeEmail(rec.email),
    accountType,
    accountTypeLabel: String(rec.accountTypeLabel || ACCOUNT_LABELS[accountType] || "🎓 Študent VŠ"),
    organization: String(rec.organization || ""),
    tier,
    licenseKey: String(rec.licenseKey || ""),
    licenseExpiresAt: rec.licenseExpiresAt || null,
    licenseProgram: String(rec.licenseProgram || ""),
    licenseActivatedAt: rec.licenseActivatedAt || null,
    isDemo: Boolean(rec.isDemo),
    createdAt: rec.createdAt || null,
    lastLoginAt: rec.lastLoginAt || null,
    updatedAt: rec.updatedAt || null,
  };
}

function inferProgramCode(cleanKey, rawProg) {
  const prog = String(rawProg || "").trim().toUpperCase();
  if (prog === "PRO" || prog === "EDU" || prog === "FREE") return prog;
  if (
    cleanKey.startsWith("KOMPAS-V2-PRO-") ||
    cleanKey.startsWith("KOMPAS-PRO-") ||
    cleanKey.startsWith("KOMPAS-ENT-") ||
    cleanKey.startsWith("ENT-") ||
    cleanKey.startsWith("PRO-") ||
    cleanKey.startsWith("CORP-")
  ) {
    return "PRO";
  }
  if (cleanKey.startsWith("KOMPAS-V2-FREE-") || cleanKey.startsWith("KOMPAS-FREE-") || cleanKey.startsWith("FREE-")) {
    return "FREE";
  }
  return "EDU";
}

function normalizeLicenseRecord(raw, fallbackIso = LICENSE_SEED_BASELINE_ISO) {
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
    revokedAt: status === "revoked" ? raw.revokedAt || updatedAt : null,
    revokedReason: status === "revoked" ? String(raw.revokedReason || "") : "",
  };
}

export function normalizeLicenseDb(rawDb, fallbackIso = new Date().toISOString()) {
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
      if (!deletedAtMap[k]) deletedAtMap[k] = baseUpdatedAt;
    }
  }

  const keysMap = new Map();
  if (Array.isArray(source.keys)) {
    for (const rawRec of source.keys) {
      const rec = normalizeLicenseRecord(rawRec, baseUpdatedAt);
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

export async function readOrSeedLicenseDb(store = null) {
  const targetStore = store || getStore({ name: LICENSE_STORE_NAME, consistency: "strong" });
  const existing = await targetStore.get(LICENSE_BLOB_KEY, { type: "json" });
  if (existing && typeof existing === "object" && Array.isArray(existing.keys)) {
    return normalizeLicenseDb(existing, existing.updatedAt || INITIAL_SEED_LICENSE_DB.updatedAt);
  }
  const seeded = normalizeLicenseDb(INITIAL_SEED_LICENSE_DB, INITIAL_SEED_LICENSE_DB.updatedAt);
  await targetStore.setJSON(LICENSE_BLOB_KEY, seeded);
  return seeded;
}

export function normalizeUserRecord(raw, fallbackIso = USERS_SEED_BASELINE_ISO) {
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
    accountTypeLabel: String(raw.accountTypeLabel || "").trim() || ACCOUNT_LABELS[accountType] || "🎓 Študent VŠ",
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
  return Math.max(parseTimeMs(rec.updatedAt), parseTimeMs(rec.lastLoginAt), parseTimeMs(rec.createdAt));
}

export function normalizeUsersDb(rawDb, fallbackIso = new Date().toISOString()) {
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

export function mergeUsersDatabases(baseDb, incomingDb) {
  const base = normalizeUsersDb(baseDb || INITIAL_SEED_USERS_DB);
  const inc = normalizeUsersDb(incomingDb || {});
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
        passwordHash: existing.passwordHash || rec.passwordHash || "",
        hashAlg: existing.passwordHash ? existing.hashAlg : rec.hashAlg || "sha256-offline-v1",
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

  const nowIso = parseTimeMs(inc.updatedAt) >= parseTimeMs(base.updatedAt) ? inc.updatedAt : base.updatedAt;

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

export async function readOrSeedUsersDb(store = null) {
  const targetStore = store || getStore({ name: USERS_STORE_NAME, consistency: "strong" });
  const existing = await targetStore.get(USERS_BLOB_KEY, { type: "json" });
  if (existing && typeof existing === "object" && Array.isArray(existing.users)) {
    return normalizeUsersDb(existing, existing.updatedAt || INITIAL_SEED_USERS_DB.updatedAt);
  }
  const seeded = normalizeUsersDb(INITIAL_SEED_USERS_DB, INITIAL_SEED_USERS_DB.updatedAt);
  await targetStore.setJSON(USERS_BLOB_KEY, seeded);
  return seeded;
}

function parseDateCode(expCode) {
  const str = String(expCode || "").trim();
  if (!/^\d{8}$/.test(str)) return null;
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6));
  const day = Number(str.slice(6, 8));
  if (year < 1970 || year > 2199 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (
    Number.isNaN(endOfDay.getTime()) ||
    endOfDay.getFullYear() !== year ||
    endOfDay.getMonth() !== month - 1 ||
    endOfDay.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day, endOfDay };
}

function formatExpiryDateSk(dateInput) {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}. ${mm}. ${yyyy}`;
}

function computeDaysRemaining(expEnd, now = new Date()) {
  if (!expEnd || now.getTime() > expEnd.getTime()) return 0;
  const expUtc = Date.UTC(expEnd.getFullYear(), expEnd.getMonth(), expEnd.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((expUtc - nowUtc) / 86400000));
}

export async function signServerLicenseKeyV2({
  programCode = "EDU",
  expiryCode = "PERM",
  nonce = "",
  hmacSecret = "",
}) {
  const secret = String(hmacSecret || getEnv("LICENSE_HMAC_SECRET")).trim();
  if (!secret) {
    throw new Error("LICENSE_HMAC_SECRET nie je nakonfigurovaný na serveri.");
  }
  const prog = programCode === "PRO" || programCode === "FREE" ? programCode : "EDU";
  const exp = expiryCode === "PERM" || /^\d{8}$/.test(String(expiryCode || "")) ? String(expiryCode) : "PERM";
  const cleanNonce = String(nonce || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let finalNonce = cleanNonce.slice(0, 6);
  if (finalNonce.length < 4) {
    const rnd = crypto.getRandomValues(new Uint8Array(6));
    while (finalNonce.length < 6) {
      finalNonce += alphabet[rnd[finalNonce.length] % alphabet.length];
    }
  }
  const sigHex = (await hmacSha256Hex(secret, `KOMPAS-V2:${prog}:${exp}:${finalNonce}`))
    .slice(0, 12)
    .toUpperCase();
  return {
    key: `KOMPAS-V2-${prog}-${exp}-${finalNonce}-${sigHex}`,
    programCode: prog,
    expiryCode: exp,
    nonce: finalNonce,
    signature: sigHex,
  };
}

export async function verifySingleLicenseKey(rawKey, licenseDb, hmacSecret = "") {
  const cleanKey = String(rawKey || "").trim().toUpperCase();
  if (!cleanKey) {
    return {
      valid: false,
      isSigned: false,
      inDatabase: false,
      dbStatus: "not_found",
      cleanKey: "",
      tier: null,
      programCode: null,
      programLabel: null,
      isPermanent: false,
      expiresAt: null,
      expiryDateCode: null,
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: null,
      error: "Zadajte prosím licenčný kľúč.",
    };
  }

  const db = normalizeLicenseDb(licenseDb || INITIAL_SEED_LICENSE_DB);
  const isDeleted = Boolean(
    (Array.isArray(db.deletedKeys) && db.deletedKeys.includes(cleanKey)) ||
      (db.deletedAtMap && db.deletedAtMap[cleanKey]),
  );
  const record = isDeleted ? null : (db.keys || []).find((k) => k.key === cleanKey) || null;

  const v2Match = cleanKey.match(/^KOMPAS-V2-(EDU|PRO|FREE)-(PERM|\d{8})-([A-Z0-9]{4,8})-([A-F0-9]{6,16})$/);
  const v1Match = cleanKey.match(/^KOMPAS-(EDU|PRO|FREE)-(PERM|\d{8})-([A-Z0-9]{4})-([A-F0-9]{6})$/);

  let progCode = record ? record.programCode : inferProgramCode(cleanKey, "");
  let expCode = record ? record.expiryCode : "PERM";
  let isSigned = Boolean(v2Match || v1Match);

  if (v2Match) {
    const [, mProg, mExp, mNonce, mSig] = v2Match;
    progCode = mProg;
    expCode = mExp;
    const effectiveSecret = String(hmacSecret || getEnv("LICENSE_HMAC_SECRET")).trim();
    if (!effectiveSecret) {
      return {
        valid: false,
        isSigned: true,
        inDatabase: Boolean(record),
        dbStatus: record ? record.status : "not_found",
        cleanKey,
        tier: null,
        programCode: progCode,
        programLabel: LICENSE_PROGRAM_MAP[progCode]?.label || null,
        isPermanent: expCode === "PERM",
        expiresAt: null,
        expiryDateCode: expCode,
        isExpired: false,
        daysRemaining: null,
        formattedExpiry: null,
        error: "Serverová verifikácia HMAC podpisov (LICENSE_HMAC_SECRET) nie je nakonfigurovaná.",
      };
    }
    const expectedHmac = (
      await hmacSha256Hex(effectiveSecret, `KOMPAS-V2:${mProg}:${mExp}:${mNonce}`)
    )
      .slice(0, mSig.length)
      .toUpperCase();
    if (!timingSafeEqual(mSig, expectedHmac)) {
      return {
        valid: false,
        isSigned: true,
        inDatabase: false,
        dbStatus: "invalid",
        cleanKey,
        tier: null,
        programCode: progCode,
        programLabel: LICENSE_PROGRAM_MAP[progCode]?.label || null,
        isPermanent: expCode === "PERM",
        expiresAt: null,
        expiryDateCode: expCode,
        isExpired: false,
        daysRemaining: null,
        formattedExpiry: null,
        error: "Neplatný serverový HMAC podpis licenčného kľúča.",
      };
    }
  } else if (v1Match) {
    const [, mProg, mExp, mNonce, mSig] = v1Match;
    progCode = mProg;
    expCode = mExp;
    const expectedV1 = (await sha256Hex(`KOMPAS-KEYGEN-V1:${mProg}:${mExp}:${mNonce}`))
      .slice(0, 6)
      .toUpperCase();
    if (!timingSafeEqual(mSig, expectedV1) && !(record && record.signature && timingSafeEqual(mSig, record.signature))) {
      return {
        valid: false,
        isSigned: true,
        inDatabase: false,
        dbStatus: "invalid",
        cleanKey,
        tier: null,
        programCode: progCode,
        programLabel: LICENSE_PROGRAM_MAP[progCode]?.label || null,
        isPermanent: expCode === "PERM",
        expiresAt: null,
        expiryDateCode: expCode,
        isExpired: false,
        daysRemaining: null,
        formattedExpiry: null,
        error: "Neplatný kryptografický podpis licenčného kľúča.",
      };
    }
  }

  if (!record) {
    return {
      valid: false,
      isSigned,
      inDatabase: false,
      dbStatus: "not_found",
      cleanKey,
      tier: null,
      programCode: progCode,
      programLabel: LICENSE_PROGRAM_MAP[progCode]?.label || null,
      isPermanent: expCode === "PERM",
      expiresAt: null,
      expiryDateCode: expCode,
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: null,
      error: "Tento licenčný kľúč sa nenachádza v databáze vydaných kľúčov alebo bol odstránený.",
    };
  }

  const effectiveProg = LICENSE_PROGRAM_MAP[record.programCode] || LICENSE_PROGRAM_MAP[progCode] || LICENSE_PROGRAM_MAP.EDU;
  const effectiveExp = record.expiryCode || expCode || "PERM";

  if (record.status === "revoked") {
    return {
      valid: false,
      isSigned,
      inDatabase: true,
      dbStatus: "revoked",
      revokedAt: record.revokedAt || null,
      revokedReason: record.revokedReason || "",
      cleanKey,
      tier: null,
      programCode: effectiveProg.code,
      programLabel: effectiveProg.label,
      isPermanent: effectiveExp === "PERM",
      expiresAt: null,
      expiryDateCode: effectiveExp,
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: effectiveExp === "PERM" ? "Trvalá licencia" : "",
      error: record.revokedReason
        ? `Tento licenčný kľúč bol v databáze zablokovaný / zrušený administrátorom (${record.revokedReason}).`
        : "Tento licenčný kľúč bol v databáze zablokovaný / zrušený administrátorom.",
    };
  }

  if (effectiveExp === "PERM") {
    return {
      valid: true,
      isSigned,
      inDatabase: true,
      dbStatus: "active",
      cleanKey,
      tier: effectiveProg.tier,
      programCode: effectiveProg.code,
      programLabel: effectiveProg.label,
      isPermanent: true,
      expiresAt: null,
      expiryDateCode: "PERM",
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: "Trvalá licencia",
      error: null,
    };
  }

  const parsedDate = parseDateCode(effectiveExp);
  if (!parsedDate) {
    return {
      valid: false,
      isSigned,
      inDatabase: true,
      dbStatus: "invalid",
      cleanKey,
      tier: null,
      programCode: effectiveProg.code,
      programLabel: effectiveProg.label,
      isPermanent: false,
      expiresAt: null,
      expiryDateCode: effectiveExp,
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: null,
      error: `Licenčný kľúč obsahuje neplatný dátum expirácie (${effectiveExp}).`,
    };
  }

  const now = new Date();
  const expEnd = parsedDate.endOfDay;
  const formattedExpiry = formatExpiryDateSk(expEnd);
  const isExpired = now.getTime() > expEnd.getTime();
  const daysRemaining = isExpired ? 0 : computeDaysRemaining(expEnd, now);

  if (isExpired) {
    return {
      valid: false,
      isSigned,
      inDatabase: true,
      dbStatus: "active",
      cleanKey,
      tier: effectiveProg.tier,
      programCode: effectiveProg.code,
      programLabel: effectiveProg.label,
      isPermanent: false,
      expiresAt: expEnd.toISOString(),
      expiryDateCode: effectiveExp,
      isExpired: true,
      daysRemaining: 0,
      formattedExpiry,
      error: `Platnosť tohto licenčného kľúča vypršala dňa ${formattedExpiry}.`,
    };
  }

  return {
    valid: true,
    isSigned,
    inDatabase: true,
    dbStatus: "active",
    cleanKey,
    tier: effectiveProg.tier,
    programCode: effectiveProg.code,
    programLabel: effectiveProg.label,
    isPermanent: false,
    expiresAt: expEnd.toISOString(),
    expiryDateCode: effectiveExp,
    isExpired: false,
    daysRemaining,
    formattedExpiry,
    error: null,
  };
}
