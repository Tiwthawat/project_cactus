// src/app/lib/status.ts

export type OrderBadgeMode = "admin" | "customer";

export type BadgeTone =
  | "gray"
  | "blue"
  | "amber"
  | "green"
  | "greenStrong"
  | "red"
  | "purple";

export type StatusMeta = {
  label: string;
  tone: BadgeTone;
};

const TONE_CLS: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-800 ring-1 ring-gray-200",
  blue: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  amber: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  green: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",

  // ✅ เขียวเข้มสำหรับ “จัดส่งแล้ว”
  greenStrong: "bg-emerald-700 text-white ring-1 ring-emerald-800",

  red: "bg-red-100 text-red-900 ring-1 ring-red-200",
  purple: "bg-purple-100 text-purple-900 ring-1 ring-purple-200",
};

/** =========================
 *  1) ORDER (orders.Ostatus)
 *  ========================= */
export type OrderStatusKey =
  | "waiting"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "refunded";

export const ORDER_STATUS: Record<OrderStatusKey, StatusMeta> = {
  waiting: { label: "รอชำระเงิน", tone: "amber" },
  pending_payment: { label: "รอชำระเงิน", tone: "amber" },
  payment_review: { label: "รอตรวจสลิป", tone: "blue" },

  // ✅ ชำระแล้ว = เขียวอ่อน
  paid: { label: "ชำระแล้ว", tone: "green" },

  shipping: { label: "กำลังจัดส่ง", tone: "purple" },

  // ✅ จัดส่งแล้ว = เขียวเข้ม
  delivered: { label: "จัดส่งแล้ว", tone: "greenStrong" },

  cancelled: { label: "ยกเลิก", tone: "red" },
  refunded: { label: "คืนเงินแล้ว", tone: "gray" },
};

/** =========================
 *  2) PAYMENT (payments.Paystatus)
 *  ========================= */
export type PayStatusKey = "waiting" | "pending";

export const PAY_STATUS: Record<PayStatusKey, StatusMeta> = {
  waiting: { label: "รอชำระเงิน", tone: "amber" },
  pending: { label: "รอตรวจสลิป", tone: "blue" },
};

/** =========================
 *  3) AUCTION (auctions.status / payment_status)
 *  ========================= */
export type AuctionStatusKey = "open" | "closed";
export const AUCTION_STATUS: Record<AuctionStatusKey, StatusMeta> = {
  open: { label: "กำลังประมูล", tone: "green" },
  closed: { label: "ปิดประมูล", tone: "gray" },
};

export type AuctionPayStatusKey =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "expired";

export const AUCTION_PAY_STATUS: Record<AuctionPayStatusKey, StatusMeta> = {
  pending_payment: { label: "ผู้ชนะรอชำระ", tone: "amber" },
  payment_review: { label: "รอตรวจสลิป", tone: "blue" },

  // ✅ ชำระแล้ว = เขียวอ่อน
  paid: { label: "ชำระแล้ว", tone: "green" },

  expired: { label: "หมดเวลา/สิทธิ์สิ้นสุด", tone: "red" },
};

/** =========================
 *  4) AUCTION PRODUCT (auction_products.PROstatus / shipping_status)
 *  ========================= */
export type AuctionProductStatusKey =
  | "ready"
  | "auction"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "unsold";

export const AUCTION_PRODUCT_STATUS: Record<AuctionProductStatusKey, StatusMeta> =
  {
    ready: { label: "พร้อมลงประมูล", tone: "gray" },
    auction: { label: "กำลังประมูล", tone: "green" },
    pending_payment: { label: "รอผู้ชนะชำระ", tone: "amber" },
    payment_review: { label: "รอตรวจสลิป", tone: "blue" },

    // ✅ ชำระแล้ว = เขียวอ่อน
    paid: { label: "ชำระแล้ว", tone: "green" },

    unsold: { label: "ขายไม่ออก", tone: "red" },
  };

export type AuctionShipStatusKey = "pending" | "shipping" | "delivered";

export const AUCTION_SHIP_STATUS: Record<AuctionShipStatusKey, StatusMeta> = {
  pending: { label: "รอจัดส่ง", tone: "amber" },
  shipping: { label: "กำลังจัดส่ง", tone: "purple" },

  // ✅ จัดส่งแล้ว = เขียวเข้ม
  delivered: { label: "จัดส่งแล้ว", tone: "greenStrong" },
};

/** =========================
 *  5) PRODUCT (products.Pstatus)
 *  ========================= */
export type ProductStatusKey = "In stock" | "Out of stock";

export const PRODUCT_STATUS: Record<ProductStatusKey, StatusMeta> = {
  "In stock": { label: "มีสินค้า", tone: "green" },
  "Out of stock": { label: "หมด", tone: "red" },
};

/** ---------------- helpers ---------------- */
const FALLBACK: StatusMeta = { label: "ไม่ทราบสถานะ", tone: "gray" };

function toKey(raw: unknown): string {
  return raw == null ? "" : String(raw).trim();
}

export function getMeta(
  map: Record<string, StatusMeta>,
  raw: unknown
): StatusMeta {
  const key = toKey(raw);
  return map[key] ?? FALLBACK;
}

export function badgeClass(tone: BadgeTone): string {
  return TONE_CLS[tone] ?? TONE_CLS.gray;
}

/** =========================
 *  ✅ ORDER badge (status + payment)
 *  - ใช้เป็น “ตัวกลาง” สำหรับ order ทุกหน้า
 *  ========================= */

function normalizePay(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function isCodPay(raw: unknown): boolean {
  const p = normalizePay(raw);
  return p === "cod" || p === "cash_on_delivery" || p === "cashondelivery";
}

/**
 * ✅ ตัวกลางที่ถูกต้อง:
 * - โอน: pending_payment/waiting = รอชำระเงิน
 * - COD: pending_payment/waiting = รอจัดส่ง
 */
export function getOrderBadge(
  statusRaw: unknown,
  paymentRaw?: unknown,
  mode: OrderBadgeMode = "admin"
): StatusMeta {
  const s = toKey(statusRaw);
  const isCod = isCodPay(paymentRaw);

  // ✅ COD: ไม่ควรขึ้นรอชำระเงิน
  if (isCod && (s === "pending_payment" || s === "waiting")) {
    return { label: "รอจัดส่ง", tone: "amber" };
  }

  // ✅ customer wording
  if (mode === "customer") {
    const customerMap: Record<string, StatusMeta> = {
      pending_payment: { label: "รอชำระเงิน", tone: "amber" },
      waiting: { label: "รอชำระเงิน", tone: "amber" },
      payment_review: { label: "รอตรวจสลิป", tone: "blue" },

      // ✅ ลูกค้าเข้าใจง่ายกว่า
      paid: { label: "รอจัดส่ง", tone: "purple" },
      shipping: { label: "รอรับสินค้า", tone: "purple" },
      delivered: { label: "ได้รับแล้ว", tone: "greenStrong" },

      cancelled: { label: "ยกเลิก", tone: "red" },
      refunded: { label: "คืนเงินแล้ว", tone: "gray" },
    };

    // ถ้าไม่เจอใน map ก็ fallback ไป ORDER_STATUS
    return customerMap[s] ?? getMeta(ORDER_STATUS, s);
  }

  // ✅ admin wording (เดิม)
  return getMeta(ORDER_STATUS, s);
}

/** payment badge for auction orders */
export function getPaymentBadge(raw: unknown): StatusMeta {
  return getMeta(AUCTION_PAY_STATUS, raw);
}

/** ship badge for auction orders */
export type ShippingBadgeInput = Readonly<{
  payment_status?: unknown;
  shipping_status?: unknown;
  tracking_number?: unknown;
}>;

function isPaidStatus(v: unknown): boolean {
  return toKey(v) === "paid";
}

function hasTracking(v: unknown): boolean {
  return toKey(v).length > 0;
}

export type AnyStatus = string;

export function statusLabel(s: AnyStatus) {
  const map: Record<string, string> = {
    pending_payment: "รอชำระเงิน",
    payment_review: "รอตรวจสอบสลิป",
    paid: "ชำระแล้ว",
    shipping: "กำลังจัดส่ง",
    delivered: "จัดส่งแล้ว",
    cancelled: "ยกเลิก",
    failed: "ล้มเหลว",

    // ✅ ถ้าบางหน้าอยากใช้ key กลางของ COD ก็รองรับไว้
    cod_pending: "รอจัดส่ง",

    // เดิม ๆ
    waiting: "รอตรวจสอบ",
    to_ship: "รอจัดส่ง",

    ready: "พร้อมเปิดรอบ",
    unsold: "ไม่ถูกขาย",
    auction: "กำลังประมูล",

    open: "เปิดประมูล",
    closed: "ปิดแล้ว",

    pending: "รอจัดส่ง",
  };

  return map[String(s || "").trim()] || String(s || "—");
}

export function statusPillClass(s: AnyStatus) {
  const v = String(s || "").trim();

  if (v === "payment_review" || v === "waiting")
    return "bg-amber-100 text-amber-800 border-amber-200";

  // ✅ paid = เขียวอ่อน
  if (v === "paid")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";

  if (v === "shipping")
    return "bg-blue-100 text-blue-800 border-blue-200";

  // ✅ delivered = เขียวเข้ม
  if (v === "delivered")
    return "bg-emerald-700 text-white border-emerald-800";

  if (v === "cancelled" || v === "failed")
    return "bg-red-100 text-red-800 border-red-200";

  if (v === "pending_payment")
    return "bg-orange-100 text-orange-800 border-orange-200";

  // ✅ ถ้าบางหน้าใช้ cod_pending
  if (v === "cod_pending")
    return "bg-amber-100 text-amber-900 border-amber-200";

  if (v === "ready" || v === "open")
    return "bg-green-100 text-green-800 border-green-200";

  if (v === "closed" || v === "unsold")
    return "bg-gray-100 text-gray-800 border-gray-200";

  if (v === "auction")
    return "bg-blue-100 text-blue-800 border-blue-200";

  return "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * Normalize ship status for auction orders:
 * - only meaningful when paid
 * - delivered -> delivered
 * - shipping OR has tracking -> shipping
 * - else -> pending
 */
export function getShippingBadge(input: ShippingBadgeInput): StatusMeta {
  if (!isPaidStatus(input.payment_status)) {
    return { label: "—", tone: "gray" };
  }

  const s = toKey(input.shipping_status);

  if (s === "delivered") return AUCTION_SHIP_STATUS.delivered;
  if (s === "shipping" || hasTracking(input.tracking_number))
    return AUCTION_SHIP_STATUS.shipping;

  return AUCTION_SHIP_STATUS.pending;
}
