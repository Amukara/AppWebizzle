/* eslint-disable @typescript-eslint/no-require-imports */
// WeBizzle seed — realistic Kenyan neighbourhood vendors & prices (KES)
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const PRODUCTS = [
  // Duka (Household essentials)
  { id: "sugar",    name: "Sugar",         unit: "2kg",     emoji: "🧂", category: "Duka",      basePrice: 255 },
  { id: "milk",     name: "Milk",          unit: "500ml",   emoji: "🥛", category: "Duka",      basePrice: 60 },
  { id: "blueband", name: "Blue Band",     unit: "250g",    emoji: "🧈", category: "Duka",      basePrice: 118 },
  { id: "rice",     name: "Rice",          unit: "2kg",     emoji: "🍚", category: "Duka",      basePrice: 310 },
  { id: "oil",      name: "Cooking Oil",   unit: "2L",      emoji: "🍶", category: "Duka",      basePrice: 480 },
  { id: "flour",    name: "Maize Flour",   unit: "2kg",     emoji: "🌽", category: "Duka",      basePrice: 205 },
  { id: "soap",     name: "Soap",          unit: "bar",     emoji: "🧼", category: "Duka",      basePrice: 65 },
  { id: "salt",     name: "Salt",          unit: "500g",    emoji: "🧂", category: "Duka",      basePrice: 35 },
  // Mama Mboga (Fresh produce)
  { id: "eggs",     name: "Eggs",          unit: "tray 30", emoji: "🥚", category: "Mama Mboga",basePrice: 420 },
  { id: "tomato",   name: "Tomatoes",      unit: "1kg",     emoji: "🍅", category: "Mama Mboga",basePrice: 90 },
  { id: "onion",    name: "Onions",        unit: "1kg",     emoji: "🧅", category: "Mama Mboga",basePrice: 110 },
  { id: "kale",     name: "Sukuma Wiki",   unit: "bunch",   emoji: "🥬", category: "Mama Mboga",basePrice: 25 },
  { id: "banana",   name: "Bananas",       unit: "1kg",     emoji: "🍌", category: "Mama Mboga",basePrice: 80 },
  { id: "potato",   name: "Potatoes",      unit: "1kg",     emoji: "🥔", category: "Mama Mboga",basePrice: 95 },
  { id: "avocado",  name: "Avocado",       unit: "piece",   emoji: "🥑", category: "Mama Mboga",basePrice: 30 },
  // Pharmacy (Medicine & care)
  { id: "panadol",  name: "Panadol",       unit: "24 tabs", emoji: "💊", category: "Pharmacy",  basePrice: 150 },
  { id: "antacid",  name: "Antacid",       unit: "100ml",   emoji: "🧴", category: "Pharmacy",  basePrice: 220 },
  { id: "malaria",  name: "Anti-malarial", unit: "24 tabs", emoji: "💊", category: "Pharmacy",  basePrice: 350 },
  { id: "bandage",  name: "Bandage",       unit: "roll",    emoji: "🩹", category: "Pharmacy",  basePrice: 80 },
  { id: "vitamins", name: "Vitamin C",     unit: "30 tabs", emoji: "🍊", category: "Pharmacy",  basePrice: 280 },
  // Bakery (Bread & pastries)
  { id: "bread",    name: "Bread",         unit: "400g",    emoji: "🍞", category: "Bakery",    basePrice: 58 },
  { id: "pancake",  name: "Pancake Mix",   unit: "500g",    emoji: "🥞", category: "Bakery",    basePrice: 340 },
  { id: "mandazi",  name: "Mandazi",       unit: "5 pcs",   emoji: "🍩", category: "Bakery",    basePrice: 50 },
  // Hardware (Tools & supplies)
  { id: "nails",    name: "Nails 2-inch",  unit: "1kg",     emoji: "🔩", category: "Hardware",  basePrice: 180 },
  { id: "hinges",   name: "Door Hinges",   unit: "pair",    emoji: "🔧", category: "Hardware",  basePrice: 250 },
  { id: "padlock",  name: "Padlock",       unit: "piece",   emoji: "🔒", category: "Hardware",  basePrice: 350 },
  { id: "paint",    name: "Paint 5L",      unit: "bucket",   emoji: "🪣", category: "Hardware",  basePrice: 2800 },
  { id: "cement",   name: "Cement 50kg",   unit: "bag",     emoji: "🧱", category: "Hardware",  basePrice: 780 },
  { id: "tape",     name: "Masking Tape",  unit: "roll",    emoji: "🎞️", category: "Hardware",  basePrice: 120 },
  // Butchery (Fresh meat)
  { id: "beef",     name: "Beef",          unit: "1kg",     emoji: "🥩", category: "Butchery",  basePrice: 650 },
  { id: "chicken",  name: "Chicken",       unit: "1kg",     emoji: "🍗", category: "Butchery",  basePrice: 550 },
  { id: "sausage",  name: "Smokies",       unit: "10 pcs",  emoji: "🌭", category: "Butchery",  basePrice: 100 },
  // Electronics (Gadgets & airtime)
  { id: "airtime",  name: "Safaricom Airtime", unit: "KES 100", emoji: "📱", category: "Electronics", basePrice: 100 },
  { id: "cable",    name: "USB Cable",     unit: "piece",   emoji: "🔌", category: "Electronics", basePrice: 250 },
  { id: "earphones",name: "Earphones",     unit: "piece",   emoji: "🎧", category: "Electronics", basePrice: 350 },
  // Agrovet (Seeds & feeds)
  { id: "seedmaize", name: "Maize Seeds",  unit: "1kg",     emoji: "🌱", category: "Agrovet",  basePrice: 320 },
  { id: "chickenfeed", name: "Chicken Feed", unit: "10kg",  emoji: "🌾", category: "Agrovet",  basePrice: 450 },
];

// Neighbourhood vendors with varied types, ratings, and speeds
const VENDORS = [
  { id: "v1", name: "Baraka General Store", emoji: "🏪", type: "Duka",       location: "Kileleshwa, Njiwa Rd",  rating: 4.6, deliveryFee: 100, etaMinutes: 22 },
  { id: "v2", name: "Mama Wanjiru Mboga",   emoji: "🥬", type: "Mama Mboga", location: "Kileleshwa, Market",    rating: 4.8, deliveryFee: 60,  etaMinutes: 15 },
  { id: "v3", name: "Quickmart Duka",       emoji: "🛒", type: "Duka",       location: "Westlands, Ring Rd",    rating: 4.5, deliveryFee: 120, etaMinutes: 30 },
  { id: "v4", name: "City Pharmacy",        emoji: "💊", type: "Pharmacy",   location: "Kileleshwa, Makini Rd", rating: 4.7, deliveryFee: 80,  etaMinutes: 25 },
  { id: "v5", name: "Hotspot Bakery",       emoji: "🍞", type: "Bakery",     location: "Kilimani, Argwings Rd", rating: 4.4, deliveryFee: 90,  etaMinutes: 28 },
  { id: "v6", name: "Tuskys Express",       emoji: "🏪", type: "Duka",       location: "Kilimani, Yaya Ct",     rating: 4.3, deliveryFee: 110, etaMinutes: 35 },
  { id: "v7", name: "Wanjohi Hardware",     emoji: "🔧", type: "Hardware",   location: "Westlands, Waiyaki Way",rating: 4.6, deliveryFee: 150, etaMinutes: 40 },
  { id: "v8", name: "Boma Butchery",        emoji: "🥩", type: "Butchery",   location: "Kileleshwa, Gitathuru Rd",rating: 4.9, deliveryFee: 70,  etaMinutes: 18 },
  { id: "v9", name: "Greenlife Agrovet",   emoji: "🌱", type: "Agrovet",    location: "Webuye, Bungoma Rd",    rating: 4.5, deliveryFee: 200, etaMinutes: 45 },
  { id: "v10",name: "Safaricom Express",    emoji: "📱", type: "Electronics", location: "Westlands, Sarit Ctr",  rating: 4.8, deliveryFee: 50,  etaMinutes: 10 },
];

// price deltas per vendor (relative to base). Negative = cheaper.
// Vendors outside their speciality charge more; specialists charge less.
const DELTAS = {
  v1:  { sugar: -5,  milk: 0,   blueband: -3, rice: -10, oil: -15, flour: -4, soap: -5,  salt: 0,  eggs: 10,  bread: 0,   tomato: 15, onion: 10, kale: 5,   banana: 0,   potato: 12, avocado: 5,  panadol: 20, antacid: 15, malaria: 30, bandage: 10, vitamins: 20, pancake: 10, mandazi: 15, nails: 40,  hinges: 50,  padlock: 60, paint: 200,  cement: 100, tape: 30,  beef: 80,  chicken: 70, sausage: 20, airtime: 10, cable: 40,  earphones: 50, seedmaize: 60, chickenfeed: 50 },
  v2:  { sugar: 10,  milk: 5,   blueband: 8,  rice: 20,  oil: 30,  flour: 5,  soap: 15,  salt: 5,  eggs: -20, bread: 10,  tomato: -15,onion: -10,kale: -5,  banana: -10,potato: -8, avocado: -10,panadol: 40, antacid: 50, malaria: 60, bandage: 30, vitamins: 40, pancake: 30, mandazi: 20, nails: 80,  hinges: 100, padlock: 120,paint: 400,  cement: 200, tape: 60,  beef: 50,  chicken: 40, sausage: 30, airtime: 20, cable: 60,  earphones: 70, seedmaize: 80, chickenfeed: 70 },
  v3:  { sugar: -10, milk: -3,  blueband: 0,  rice: -5,  oil: -20, flour: -8, soap: -8,  salt: -3, eggs: 5,   bread: -3,  tomato: 5,  onion: 0,   kale: 10,  banana: 5,   potato: 8,  avocado: 5,  panadol: 10, antacid: 0,  malaria: 15, bandage: 5,  vitamins: 10, pancake: -5, mandazi: -5, nails: 30,  hinges: 35,  padlock: 40, paint: 150,  cement: 80,  tape: 25,  beef: 60,  chicken: 50, sausage: 15, airtime: 5,  cable: 30,  earphones: 40, seedmaize: 50, chickenfeed: 40 },
  v4:  { sugar: 30,  milk: 20,  blueband: 25, rice: 40,  oil: 50,  flour: 30, soap: 25,  salt: 15, eggs: 60,  bread: 20,  tomato: 40, onion: 35,  kale: 30,  banana: 25,  potato: 35, avocado: 30, panadol: -20,antacid: -30,malaria: -25,bandage: -15,vitamins: -20,pancake: 40, mandazi: 35, nails: 100, hinges: 120, padlock: 140,paint: 500,  cement: 300, tape: 80,  beef: 100, chicken: 90, sausage: 40, airtime: 15, cable: 80,  earphones: 90, seedmaize: 100,chickenfeed: 90 },
  v5:  { sugar: 15,  milk: 10,  blueband: 12, rice: 18,  oil: 25,  flour: 12, soap: 10,  salt: 8,  eggs: 15,  bread: -8,  tomato: 12, onion: 14,  kale: 8,   banana: 6,   potato: 10, avocado: 8,  panadol: 35, antacid: 25, malaria: 40, bandage: 20, vitamins: 30, pancake: -15,mandazi: -20,nails: 60,  hinges: 70,  padlock: 80, paint: 300,  cement: 150, tape: 40,  beef: 40,  chicken: 35, sausage: 10, airtime: 8,  cable: 50,  earphones: 60, seedmaize: 70, chickenfeed: 60 },
  v6:  { sugar: -8,  milk: -5,  blueband: -5, rice: -12, oil: -25, flour: -6, soap: -3,  salt: -2, eggs: 0,   bread: -2,  tomato: 8,   onion: 5,   kale: 12,  banana: 3,   potato: 6,  avocado: 4,  panadol: 15, antacid: 10, malaria: 20, bandage: 8,  vitamins: 15, pancake: 5,  mandazi: 3,  nails: 25,  hinges: 30,  padlock: 35, paint: 120,  cement: 60,  tape: 20,  beef: 30,  chicken: 25, sausage: 8,  airtime: 0,  cable: 25,  earphones: 30, seedmaize: 40, chickenfeed: 35 },
  v7:  { sugar: 50,  milk: 40,  blueband: 45, rice: 60,  oil: 70,  flour: 55, soap: 40,  salt: 30, eggs: 80,  bread: 50,  tomato: 70, onion: 65,  kale: 60,  banana: 55,  potato: 60, avocado: 50, panadol: 60, antacid: 55, malaria: 70, bandage: 50, vitamins: 60, pancake: 55, mandazi: 50, nails: -25, hinges: -30, padlock: -40,paint: -200, cement: -50, tape: -20, beef: 120, chicken: 100,sausage: 60, airtime: 30, cable: 20,  earphones: 30, seedmaize: 40, chickenfeed: 35 },
  v8:  { sugar: 20,  milk: 15,  blueband: 18, rice: 25,  oil: 30,  flour: 20, soap: 18,  salt: 10, eggs: 10,  bread: 15,  tomato: 20, onion: 18,  kale: 15,  banana: 12,  potato: 10, avocado: 15, panadol: 30, antacid: 25, malaria: 35, bandage: 20, vitamins: 25, pancake: 20, mandazi: 15, nails: 70,  hinges: 80,  padlock: 90, paint: 350,  cement: 180, tape: 50,  beef: -30, chicken: -25,sausage: -15,airtime: 12, cable: 50,  earphones: 55, seedmaize: 60, chickenfeed: 50 },
  v9:  { sugar: 35,  milk: 25,  blueband: 30, rice: 45,  oil: 50,  flour: 35, soap: 30,  salt: 20, eggs: 70,  bread: 35,  tomato: 50, onion: 45,  kale: 40,  banana: 35,  potato: 40, avocado: 35, panadol: 45, antacid: 40, malaria: 50, bandage: 35, vitamins: 45, pancake: 40, mandazi: 35, nails: 20,  hinges: 25,  padlock: 30, paint: 100,  cement: -40, tape: 15,  beef: 90,  chicken: 80, sausage: 50, airtime: 20, cable: 55,  earphones: 65, seedmaize: -30,chickenfeed: -25},
  v10: { sugar: 25,  milk: 20,  blueband: 22, rice: 30,  oil: 35,  flour: 25, soap: 20,  salt: 15, eggs: 55,  bread: 25,  tomato: 35, onion: 30,  kale: 25,  banana: 20,  potato: 28,  avocado: 22, panadol: 25, antacid: 20, malaria: 30, bandage: 18, vitamins: 22, pancake: 25, mandazi: 20, nails: 55,  hinges: 65,  padlock: 75, paint: 250,  cement: 130, tape: 35,  beef: 70,  chicken: 60, sausage: 35, airtime: -5, cable: -30, earphones: -40,seedmaize: 55, chickenfeed: 45 },
};

async function main() {
  console.log("Resetting DB...");
  await db.vendorProduct.deleteMany();
  await db.order.deleteMany();
  await db.vendorApplication.deleteMany();
  await db.riderApplication.deleteMany();
  await db.vendor.deleteMany();
  await db.product.deleteMany();

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    await db.product.create({ data: p });
  }

  console.log("Seeding vendors & listings...");
  for (const v of VENDORS) {
    await db.vendor.create({
      data: {
        ...v,
        listings: {
          create: PRODUCTS.map((p) => ({
            productId: p.id,
            price: Math.max(10, p.basePrice + (DELTAS[v.id]?.[p.id] ?? Math.round(p.basePrice * 0.15))),
            inStock: true,
          })),
        },
      },
    });
  }

  const counts = {
    products: await db.product.count(),
    vendors: await db.vendor.count(),
    listings: await db.vendorProduct.count(),
  };
  console.log("Seed complete", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());