/* eslint-disable @typescript-eslint/no-require-imports */
// Seeds the operator dashboard admin user (scrypt-hashed).
// Run: bun run prisma/seed-admin.js  (idempotent — upserts by username)
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const USERNAME = process.env.ADMIN_USERNAME || "admin";
const PASSWORD = process.env.ADMIN_PASSWORD || "webizzle2025";

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(plain, salt, 64)
    .toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const admin = await db.adminUser.upsert({
    where: { username: USERNAME },
    update: {}, // don't overwrite an existing password on re-run
    create: {
      username: USERNAME,
      passwordHash: hashPassword(PASSWORD),
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin user ready ✓", { id: admin.id, username: admin.username, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
