import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeBizzle — Compare. Buy. Deliver. | Kenyan Neighbourhood Shopping",
  description:
    "Compare Mama Mboga, Duka, Pharmacy & more around you. Build one smart basket, pay once with M-Pesa, get it delivered.",
  keywords: [
    "WeBizzle", "Kenya shopping", "M-Pesa", "Mama Mboga", "duka delivery",
    "Nairobi groceries", "price comparison Kenya", "smart basket",
  ],
  authors: [{ name: "WeBizzle" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "WeBizzle — Compare. Buy. Deliver.",
    description: "Shop your neighbourhood. Pay once with M-Pesa.",
    siteName: "WeBizzle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WeBizzle — Compare. Buy. Deliver.",
    description: "Shop your neighbourhood. Pay once with M-Pesa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
