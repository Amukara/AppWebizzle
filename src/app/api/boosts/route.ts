import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BOOST_PACKAGES } from "@/lib/fees";

// GET /api/boosts — list packages + the caller's active boosts (by phone)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const campaigns = phone
    ? await db.boostCampaign.findMany({
        where: { phone: phone.trim() },
        orderBy: { createdAt: "desc" },
      })
    : [];
  return NextResponse.json({
    packages: BOOST_PACKAGES,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      shopName: c.shopName,
      package: c.package,
      price: c.price,
      status: c.status,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      impressions: c.impressions,
      clicks: c.clicks,
    })),
  });
}

// POST /api/boosts — purchase a boost package (mock M-Pesa)
export async function POST(req: Request) {
  let body: { packageId?: string; shopName?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pkg = BOOST_PACKAGES.find((p) => p.id === body.packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown boost package" }, { status: 400 });
  }
  if (!body.shopName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "Shop name and phone are required" }, { status: 400 });
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + pkg.days * 24 * 60 * 60 * 1000);
  const mpesaCode =
    "BST" +
    Math.random().toString(36).slice(2, 7).toUpperCase() +
    Math.floor(Math.random() * 90 + 10);

  const campaign = await db.boostCampaign.create({
    data: {
      shopName: body.shopName.trim(),
      phone: body.phone.trim(),
      package: pkg.id,
      price: pkg.price,
      startsAt,
      endsAt,
      status: "ACTIVE",
      mpesaCode,
    },
  });

  return NextResponse.json({
    ok: true,
    campaign: {
      id: campaign.id,
      package: campaign.package,
      price: campaign.price,
      endsAt: campaign.endsAt.toISOString(),
      mpesaCode,
    },
    message: `Boost activated! Your ${pkg.name} package runs for ${pkg.days} days.`,
  });
}
