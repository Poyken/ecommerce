/**
 * =====================================================================
 * SIMULATE PAYMENT PAGE - GIẢ LẬP THANH TOÁN (DEMO)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này dùng để demo quy trình thanh toán thành công/thất bại
 * mà không cần tích hợp cổng thanh toán thật (VNPay/Stripe) trong lúc dev.
 * =====================================================================
 */

import { SimulatePaymentClient } from "./client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SimulatePaymentClient orderId={id} />;
}
