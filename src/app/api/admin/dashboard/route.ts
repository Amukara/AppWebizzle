import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized, unauthorized } from "@/lib/admin";
import type { AdminDashboard } from "@/lib/types";

// GET /api/admin/dashboard — top-line analytics for the operator dashboard.
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return unauthorized();

  const [orders, vendors, riders, boosts, referrals, receiptsPending, receiptsApproved] =
    await Promise.all([
      db.order.findMany({ include: { vendor: true } }),
      db.vendorApplication.count(),
      db.riderApplication.count(),
      db.boostCampaign.findMany(),
      db.referral.findMany(),
      db.receiptSubmission.count({ where: { status: "PENDING" } }),
      db.receiptSubmission.count({ where: { status: "APPROVED" } }),
    ]);

  const platformRevenue = orders.reduce((s, o) => s + o.platformFee, 0);
  const driverLevyRevenue = orders.reduce((s, o) => s + o.driverLevy, 0);
  const boostRevenue = boosts.reduce((s, b) => s + b.price, 0);
  const gmv = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? Math.round(gmv / totalOrders) : 0;

  const pendingDispatch = orders.filter((o) => o.status === "CONFIRMED").length;
  const inTransit = orders.filter((o) => o.status === "DISPATCHED").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const activeBoosts = boosts.filter(
    (b) => b.status === "ACTIVE" && b.endsAt > new Date()
  ).length;

  const referralSignups = referrals.reduce((s, r) => s + r.signups, 0);
  const referralOrders = referrals.reduce((s, r) => s + r.orders, 0);
  const referralRewardsPaid = referrals.reduce((s, r) => s + r.rewardEarned, 0);

  const tokensIssued = (
    await db.receiptSubmission.aggregate({ _sum: { tokensAwarded: true }, where: { status: "APPROVED" } })
  )._sum.tokensAwarded ?? 0;

  // 7-day trend
  const now = new Date();
  const DAY = 86400000;
  const ordersLast7Days = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date(new Date(now.getTime() - (6 - i) * DAY).setHours(0, 0, 0, 0));
    const dayEnd = new Date(dayStart.getTime() + DAY);
    const dayOrders = orders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
    );
    return {
      day: dayStart.toLocaleDateString("en-KE", { weekday: "short" }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + o.platformFee + o.driverLevy, 0),
    };
  });

  // Top vendors by revenue
  const byVendor = new Map<string, { orders: number; revenue: number; payout: number; name: string; emoji: string }>();
  for (const o of orders) {
    const v = o.vendor;
    const cur = byVendor.get(v.id) ?? { orders: 0, revenue: 0, payout: 0, name: v.name, emoji: v.emoji };
    cur.orders += 1;
    cur.revenue += o.total;
    cur.payout += o.vendorPayout;
    byVendor.set(v.id, cur);
  }
  const topVendors = Array.from(byVendor.entries())
    .map(([vendorId, v]) => ({ vendorId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const payload: AdminDashboard = {
    platformRevenue,
    driverLevyRevenue,
    boostRevenue,
    grossMerchandiseValue: gmv,
    totalOrders,
    pendingDispatch,
    inTransit,
    delivered,
    avgOrderValue,
    vendorApplications: vendors,
    riderApplications: riders,
    activeBoosts,
    referralSignups,
    referralOrders,
    referralRewardsPaid,
    receiptsPending,
    receiptsApproved,
    tokensIssued,
    ordersLast7Days,
    topVendors,
  };

  return NextResponse.json(payload);
}
