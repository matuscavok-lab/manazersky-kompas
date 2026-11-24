import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";
import {
  LICENSE_BLOB_KEY,
  LICENSE_PROGRAM_MAP,
  LICENSE_STORE_NAME,
  USERS_BLOB_KEY,
  USERS_STORE_NAME,
  buildCorsHeaders,
  getEnv,
  hmacSha256Hex,
  jsonResponse,
  normalizeEmail,
  normalizeLicenseDb,
  normalizeUserRecord,
  normalizeUsersDb,
  readOrSeedLicenseDb,
  readOrSeedUsersDb,
  sha256Hex,
  timingSafeEqual,
  toPublicUser,
} from "./_shared/security.js";

const SUPPORTED_PAYMENT_EVENTS = new Set([
  "order_created",
  "subscription_created",
  "subscription_payment_success",
  "checkout.session.completed",
  "invoice.paid",
  "payment_intent.succeeded",
]);

const NONCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateNonce4() {
  const rnd = crypto.getRandomValues(new Uint8Array(4));
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += NONCE_ALPHABET[rnd[i] % NONCE_ALPHABET.length];
  }
  return out;
}

function addUtcDays(baseDate, daysToAdd) {
  const utcDate = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate() + daysToAdd,
    ),
  );
  const yyyy = String(utcDate.getUTCFullYear());
  const mm = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utcDate.getUTCDate()).padStart(2, "0");
  return {
    expiryCode: `${yyyy}${mm}${dd}`,
    expiresAtIso: `${yyyy}-${mm}-${dd}T23:59:59.999Z`,
  };
}

async function verifyLemonSqueezySignature(xSignature, rawBody, secret) {
  if (!xSignature) return false;
  const expectedHex = (await hmacSha256Hex(secret, rawBody)).toLowerCase();
  return timingSafeEqual(xSignature.toLowerCase(), expectedHex);
}

async function verifyStripeSignature(headerValue, rawBody, secret) {
  if (!headerValue) return false;

  const parts = headerValue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let timestamp = "";
  const v1Signatures = [];
  let hasKeyValuePairs = false;

  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx > 0) {
      hasKeyValuePairs = true;
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      if (key === "t" && val) {
        timestamp = val;
      } else if (key === "v1" && val) {
        v1Signatures.push(val);
      }
    }
  }

  if (timestamp && v1Signatures.length > 0) {
    const skipTimestampCheck =
      getEnv("WEBHOOK_SKIP_TIMESTAMP_CHECK").trim().toLowerCase() === "true";
    const parsedTimestamp = Number(timestamp);
    if (!skipTimestampCheck) {
      if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
        return false;
      }
      const nowSec = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSec - parsedTimestamp) > 600) {
        return false;
      }
    }
    const expectedHex = (await hmacSha256Hex(secret, `${timestamp}.${rawBody}`)).toLowerCase();
    return v1Signatures.some((v1) => timingSafeEqual(v1.toLowerCase(), expectedHex));
  }

  if (!timestamp && !hasKeyValuePairs) {
    const expectedRawHex = (await hmacSha256Hex(secret, rawBody)).toLowerCase();
    return timingSafeEqual(headerValue.toLowerCase(), expectedRawHex);
  }

  return false;
}

function parseClientReferenceId(rawRef) {
  const cleanRef = String(rawRef || "").trim();
  if (!cleanRef) {
    return { userId: "", tier: "", billingCycle: "" };
  }
  const separator = cleanRef.includes("|") ? "|" : cleanRef.includes("__") ? "__" : "";
  if (!separator) {
    return { userId: cleanRef, tier: "", billingCycle: "" };
  }
  const [userId = "", tier = "", billingCycle = ""] = cleanRef.split(separator);
  return {
    userId: userId.trim(),
    tier: tier.trim(),
    billingCycle: billingCycle.trim(),
  };
}

function extractWebhookDetails(payload) {
  const lsAttrs =
    payload?.data?.attributes && typeof payload.data.attributes === "object"
      ? payload.data.attributes
      : {};
  const lsMetaCustom =
    payload?.meta?.custom_data && typeof payload.meta.custom_data === "object"
      ? payload.meta.custom_data
      : {};
  const lsAttrCustom =
    lsAttrs?.custom_data && typeof lsAttrs.custom_data === "object"
      ? lsAttrs.custom_data
      : {};
  const lsCustomData = { ...lsAttrCustom, ...lsMetaCustom };
  const lsFirstItem =
    lsAttrs?.first_order_item && typeof lsAttrs.first_order_item === "object"
      ? lsAttrs.first_order_item
      : {};

  const stripeObj =
    payload?.data?.object && typeof payload.data.object === "object"
      ? payload.data.object
      : {};
  const stripeMeta =
    stripeObj?.metadata && typeof stripeObj.metadata === "object"
      ? stripeObj.metadata
      : {};
  const clientRef = parseClientReferenceId(stripeObj?.client_reference_id);

  const userId = String(
    lsCustomData.user_id ||
      lsCustomData.userId ||
      stripeMeta.user_id ||
      stripeMeta.userId ||
      clientRef.userId ||
      payload.userId ||
      payload.user_id ||
      "",
  ).trim();

  const email = normalizeEmail(
    lsCustomData.email ||
      lsAttrs.user_email ||
      lsAttrs.customer_email ||
      stripeMeta.email ||
      stripeObj?.customer_details?.email ||
      stripeObj?.customer_email ||
      stripeObj?.receipt_email ||
      payload.email ||
      "",
  );

  const fullName = String(
    lsCustomData.fullName ||
      lsCustomData.full_name ||
      lsCustomData.name ||
      lsAttrs.user_name ||
      lsAttrs.customer_name ||
      stripeMeta.fullName ||
      stripeMeta.full_name ||
      stripeMeta.name ||
      stripeObj?.customer_details?.name ||
      payload.fullName ||
      payload.full_name ||
      payload.name ||
      "",
  ).trim();

  const orderId = String(
    payload?.data?.id || stripeObj?.id || payload?.id || lsAttrs?.order_id || "",
  ).trim();

  const variantName = String(lsFirstItem.variant_name || lsAttrs.variant_name || "").trim();
  const productName = String(lsFirstItem.product_name || lsAttrs.product_name || "").trim();
  const lsItemDescriptor = [variantName, productName].filter(Boolean).join(" ").trim();

  const explicitTier = String(
    lsCustomData.tier ||
      lsCustomData.plan ||
      stripeMeta.tier ||
      stripeMeta.plan ||
      clientRef.tier ||
      payload.tier ||
      payload.plan ||
      "",
  ).trim();

  const rawTier =
    explicitTier ||
    (/enterprise|ent|(^|[^a-z])pro($|[^a-z])|edu/i.test(variantName)
      ? variantName
      : productName || lsItemDescriptor);

  const stripeRecurringInterval =
    stripeObj?.lines?.data?.[0]?.price?.recurring?.interval ||
    stripeObj?.lines?.data?.[0]?.plan?.interval ||
    "";
  const stripeIntervalCount = Number(
    stripeObj?.lines?.data?.[0]?.price?.recurring?.interval_count ||
      stripeObj?.lines?.data?.[0]?.plan?.interval_count ||
      1,
  );
  const stripeDerivedCycle =
    stripeRecurringInterval === "month" && stripeIntervalCount === 6
      ? "semester"
      : stripeRecurringInterval;

  const explicitCycle = String(
    lsCustomData.billing_cycle ||
      lsCustomData.billingCycle ||
      stripeMeta.billing_cycle ||
      stripeMeta.billingCycle ||
      clientRef.billingCycle ||
      payload.billing_cycle ||
      payload.billingCycle ||
      stripeDerivedCycle ||
      "",
  ).trim();

  const normalizedVariant = variantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const rawCycle =
    explicitCycle ||
    (/perm|lifetime|year|annual|roc|12m|1y|semest|6m|month|mes|1m|30d/i.test(normalizedVariant)
      ? variantName
      : productName || lsItemDescriptor);

  const rawDays =
    lsCustomData.days ??
    lsCustomData.validityDays ??
    stripeMeta.days ??
    stripeMeta.validityDays ??
    payload.days ??
    payload.validityDays;

  return {
    userId,
    email,
    fullName,
    orderId,
    rawTier,
    rawCycle,
    rawDays,
  };
}

function resolveTierAndExpiration({ rawTier, rawCycle, rawDays }, now) {
  const isEnterprisePro =
    /enterprise|ent|(^|[^a-z])pro($|[^a-z])/i.test(rawTier) && !/edu/i.test(rawTier);
  const tier = isEnterprisePro ? "enterprise_pro" : "edu_pro";
  const programCode = isEnterprisePro ? "PRO" : "EDU";
  const programLabel = LICENSE_PROGRAM_MAP[programCode].label;

  const normalizedCycleInput = String(rawCycle || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const hasValidCustomDays =
    rawDays !== undefined &&
    rawDays !== null &&
    rawDays !== "" &&
    typeof rawDays !== "boolean" &&
    Number.isFinite(Number(rawDays)) &&
    Math.trunc(Number(rawDays)) > 0;

  let expiryCode = "";
  let expiresAtIso = null;
  let cycleNormalized = "yearly";

  if (hasValidCustomDays) {
    const customDays = Math.trunc(Number(rawDays));
    const resolved = addUtcDays(now, customDays);
    expiryCode = resolved.expiryCode;
    expiresAtIso = resolved.expiresAtIso;
    if (/year|annual|roc|12m|1y/i.test(normalizedCycleInput)) {
      cycleNormalized = "yearly";
    } else if (/semest|6m/i.test(normalizedCycleInput)) {
      cycleNormalized = "semester";
    } else if (/month|mes|1m|30d/i.test(normalizedCycleInput)) {
      cycleNormalized = "monthly";
    } else {
      cycleNormalized = `${customDays}d`;
    }
  } else if (/perm|lifetime/i.test(normalizedCycleInput)) {
    expiryCode = "PERM";
    expiresAtIso = null;
    cycleNormalized = "permanent";
  } else if (/year|annual|roc|12m|1y/i.test(normalizedCycleInput)) {
    const resolved = addUtcDays(now, 365);
    expiryCode = resolved.expiryCode;
    expiresAtIso = resolved.expiresAtIso;
    cycleNormalized = "yearly";
  } else if (/semest|6m/i.test(normalizedCycleInput)) {
    const resolved = addUtcDays(now, 183);
    expiryCode = resolved.expiryCode;
    expiresAtIso = resolved.expiresAtIso;
    cycleNormalized = "semester";
  } else if (/month|mes|1m|30d/i.test(normalizedCycleInput)) {
    const resolved = addUtcDays(now, 31);
    expiryCode = resolved.expiryCode;
    expiresAtIso = resolved.expiresAtIso;
    cycleNormalized = "monthly";
  } else {
    const resolved = addUtcDays(now, 365);
    expiryCode = resolved.expiryCode;
    expiresAtIso = resolved.expiresAtIso;
    cycleNormalized = "yearly";
  }

  return {
    tier,
    programCode,
    programLabel,
    expiryCode,
    expiresAtIso,
    cycleNormalized,
  };
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  const corsHeaders = buildCorsHeaders(request, { allowAdminOrigin: false });

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== "POST") {
    return jsonResponse({ ok: false, error: "Metóda nie je povolená." }, 405, corsHeaders);
  }

  const webhookSecret =
    getEnv("WEBHOOK_SECRET").trim() ||
    getEnv("LEMONSQUEEZY_WEBHOOK_SECRET").trim() ||
    getEnv("STRIPE_WEBHOOK_SECRET").trim();

  if (!webhookSecret) {
    return jsonResponse(
      { ok: false, error: "WEBHOOK_SECRET nie je nakonfigurovaný na serveri." },
      503,
      corsHeaders,
    );
  }

  const lsSecret =
    getEnv("WEBHOOK_SECRET").trim() ||
    getEnv("LEMONSQUEEZY_WEBHOOK_SECRET").trim() ||
    webhookSecret;
  const stripeSecret =
    getEnv("WEBHOOK_SECRET").trim() ||
    getEnv("STRIPE_WEBHOOK_SECRET").trim() ||
    webhookSecret;

  const rawBody = await request.text();
  const xSignature = (request.headers.get("x-signature") || "").trim();
  const stripeSignature = (request.headers.get("stripe-signature") || "").trim();

  let signatureValid = false;
  if (xSignature) {
    signatureValid = await verifyLemonSqueezySignature(xSignature, rawBody, lsSecret);
  }
  if (!signatureValid && stripeSignature) {
    signatureValid = await verifyStripeSignature(stripeSignature, rawBody, stripeSecret);
  }

  if (!signatureValid) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Neplatný alebo chýbajúci kryptografický podpis webhooku (X-Signature / Stripe-Signature).",
      },
      401,
      corsHeaders,
    );
  }

  let payload;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return jsonResponse({ ok: false, error: "Neplatný JSON v požiadavke webhooku." }, 400, corsHeaders);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse({ ok: false, error: "Neplatný formát JSON payloadu." }, 400, corsHeaders);
  }

  const provider =
    xSignature || payload?.meta?.event_name
      ? "lemonsqueezy"
      : stripeSignature || payload?.object === "event"
        ? "stripe"
        : "unknown";

  const eventType = String(
    request.headers.get("x-event-name") ||
      payload?.meta?.event_name ||
      payload?.type ||
      payload?.event ||
      payload?.eventType ||
      "",
  ).trim();

  if (!SUPPORTED_PAYMENT_EVENTS.has(eventType.toLowerCase())) {
    return jsonResponse(
      {
        ok: true,
        ignored: true,
        provider,
        eventType,
        message: "Udalosť bola prijatá, ale nevyžaduje generovanie licencie.",
      },
      200,
      corsHeaders,
    );
  }

  try {
    const details = extractWebhookDetails(payload);
    const now = new Date();
    const nowIso = now.toISOString();
    const {
      tier,
      programCode,
      programLabel,
      expiryCode,
      expiresAtIso,
      cycleNormalized,
    } = resolveTierAndExpiration(details, now);

    const licenseStore = getStore({ name: LICENSE_STORE_NAME, consistency: "strong" });
    const licenseDb = await readOrSeedLicenseDb(licenseStore);
    const existingKeysSet = new Set(
      (licenseDb.keys || []).map((rec) => String(rec?.key || "").trim().toUpperCase()),
    );

    let cleanKey = "";
    let nonce = "";
    let sig = "";
    for (let attempt = 0; attempt < 30; attempt += 1) {
      nonce = generateNonce4();
      sig = (await sha256Hex(`KOMPAS-KEYGEN-V1:${programCode}:${expiryCode}:${nonce}`))
        .slice(0, 6)
        .toUpperCase();
      const candidate = `KOMPAS-${programCode}-${expiryCode}-${nonce}-${sig}`;
      if (!existingKeysSet.has(candidate)) {
        cleanKey = candidate;
        break;
      }
    }

    if (!cleanKey) {
      throw new Error("Nepodarilo sa vygenerovať unikátny licenčný kľúč.");
    }

    const nextDeletedKeysMap = { ...(licenseDb.deletedAtMap || {}) };
    delete nextDeletedKeysMap[cleanKey];

    const newLicenseRecord = {
      id: `db_${cleanKey.replace(/[^A-Z0-9]/g, "_").toLowerCase()}`,
      key: cleanKey,
      programCode,
      expiryCode,
      nonce,
      signature: sig,
      isLegacy: false,
      status: "active",
      note: `Webhook (${provider}${eventType ? `/${eventType}` : ""})${details.orderId ? ` #${details.orderId}` : ""}${details.email ? ` - ${details.email}` : ""}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      revokedAt: null,
      revokedReason: "",
    };

    const nextLicenseDb = normalizeLicenseDb(
      {
        ...licenseDb,
        updatedAt: nowIso,
        deletedAtMap: nextDeletedKeysMap,
        deletedKeys: Object.keys(nextDeletedKeysMap).sort(),
        keys: [newLicenseRecord, ...(licenseDb.keys || [])],
      },
      nowIso,
    );
    await licenseStore.setJSON(LICENSE_BLOB_KEY, nextLicenseDb);

    const usersStore = getStore({ name: USERS_STORE_NAME, consistency: "strong" });
    const usersDb = await readOrSeedUsersDb(usersStore);
    const usersList = Array.isArray(usersDb.users) ? usersDb.users : [];

    let userIdx = -1;
    if (details.userId) {
      userIdx = usersList.findIndex((u) => u.id === details.userId);
    }
    if (userIdx === -1 && details.email) {
      userIdx = usersList.findIndex((u) => normalizeEmail(u.email) === details.email);
    }

    let matchedOrCreatedUser = null;
    if (userIdx !== -1) {
      const targetUser = usersList[userIdx];
      matchedOrCreatedUser = normalizeUserRecord(
        {
          ...targetUser,
          tier,
          licenseKey: cleanKey,
          licenseExpiresAt: expiresAtIso,
          licenseProgram: programLabel,
          licenseActivatedAt: nowIso,
          updatedAt: nowIso,
        },
        nowIso,
      );
      const nextUsers = [...usersList];
      nextUsers[userIdx] = matchedOrCreatedUser;

      const targetEmail = normalizeEmail(matchedOrCreatedUser.email);
      const nextDeletedUsersMap = { ...(usersDb.deletedAtMap || {}) };
      if (targetEmail) {
        delete nextDeletedUsersMap[targetEmail];
      }

      const nextUsersDb = normalizeUsersDb(
        {
          ...usersDb,
          updatedAt: nowIso,
          deletedAtMap: nextDeletedUsersMap,
          deletedEmails: Object.keys(nextDeletedUsersMap).sort(),
          users: nextUsers,
        },
        nowIso,
      );
      await usersStore.setJSON(USERS_BLOB_KEY, nextUsersDb);
    } else if (details.email) {
      matchedOrCreatedUser = normalizeUserRecord(
        {
          id: details.userId || undefined,
          fullName: details.fullName || details.email.split("@")[0],
          email: details.email,
          tier,
          licenseKey: cleanKey,
          licenseExpiresAt: expiresAtIso,
          licenseProgram: programLabel,
          licenseActivatedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        nowIso,
      );

      if (matchedOrCreatedUser) {
        const nextDeletedUsersMap = { ...(usersDb.deletedAtMap || {}) };
        delete nextDeletedUsersMap[details.email];

        const nextUsersDb = normalizeUsersDb(
          {
            ...usersDb,
            updatedAt: nowIso,
            deletedAtMap: nextDeletedUsersMap,
            deletedEmails: Object.keys(nextDeletedUsersMap).sort(),
            users: [matchedOrCreatedUser, ...usersList],
          },
          nowIso,
        );
        await usersStore.setJSON(USERS_BLOB_KEY, nextUsersDb);
      }
    }

    return jsonResponse(
      {
        ok: true,
        provider,
        eventType,
        orderId: details.orderId,
        licenseKey: cleanKey,
        tier,
        programCode,
        programLabel,
        billingCycle: cycleNormalized,
        expiryCode,
        expiresAt: expiresAtIso,
        userUpdated: Boolean(matchedOrCreatedUser),
        user: matchedOrCreatedUser ? toPublicUser(matchedOrCreatedUser) : null,
      },
      200,
      corsHeaders,
    );
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: err && err.message ? err.message : "Chyba spracovania platobného webhooku.",
      },
      500,
      corsHeaders,
    );
  }
}

export const config = {
  path: ["/api/payment-webhook"],
};
