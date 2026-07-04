import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hashPassword, unauthorized } from "@/lib/admin";
import crypto from "crypto";

// POST /api/admin/change-password
// Body: { currentPassword, newPassword }
export async function POST(req: Request) {
  const session = getAdminSession(req);
  if (!session) return unauthorized();

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (newPassword.length > 128) {
    return NextResponse.json(
      { error: "New password is too long (max 128 characters)." },
      { status: 400 }
    );
  }

  // Fetch the admin user with their password hash
  const admin = await db.adminUser.findUnique({
    where: { id: session.adminId },
  });
  if (!admin) {
    return unauthorized();
  }

  // Verify current password
  const parts = admin.passwordHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return NextResponse.json(
      { error: "Account has an invalid password format. Contact support." },
      { status: 500 }
    );
  }
  const [, salt, hash] = parts;
  const computed = crypto.scryptSync(currentPassword, salt, 64).toString("hex");
  const match =
    hash.length === computed.length &&
    crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));

  if (!match) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 }
    );
  }

  // Hash and save the new password
  const newHash = hashPassword(newPassword);
  await db.adminUser.update({
    where: { id: session.adminId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true, message: "Password changed successfully." });
}