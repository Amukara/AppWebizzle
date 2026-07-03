"use client";

import {
  Home as HomeIcon,
  ShoppingBasket,
  ShoppingCart,
  ClipboardList,
  LifeBuoy,
  MessageCircle,
  Phone,
  Store,
  Bike,
  ShoppingBag,
  PiggyBank,
  Rocket,
  Gift,
  Receipt,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PageId } from "@/lib/types";

const NAV: { id: PageId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "basket", label: "Smart Basket" },
  { id: "orders", label: "Orders" },
  { id: "savings", label: "Savings" },
  { id: "support", label: "Support" },
];

export function DesktopNav({
  page,
  onNavigate,
  cartCount,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  cartCount: number;
}) {
  return (
    <header className="hidden md:block sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <button
          onClick={() => onNavigate("home")}
          className="transition-transform hover:scale-[1.02]"
          aria-label="WeBizzle home"
        >
          <Logo size={36} />
        </button>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                page === n.id
                  ? "bg-brand-light text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("vendor-signup")}
          >
            <Store size={16} /> Vendor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("rider-signup")}
          >
            <Bike size={16} /> Rider
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("boost")}
          >
            <Rocket size={16} /> Boost
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden xl:inline-flex text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("vendor-portal")}
          >
            <LayoutDashboard size={16} /> Vendor portal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden xl:inline-flex text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("rider-portal")}
          >
            <LayoutDashboard size={16} /> Rider portal
          </Button>
          <Button
            size="sm"
            className="relative bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate("cart")}
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-black">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MobileHeader({
  onNavigate,
  cartCount,
}: {
  onNavigate: (p: PageId) => void;
  cartCount: number;
}) {
  return (
    <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <button
          onClick={() => onNavigate("home")}
          aria-label="WeBizzle home"
          className="transition-transform active:scale-95"
        >
          <Logo size={30} />
        </button>
        <button
          onClick={() => onNavigate("cart")}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-brand text-white active:scale-95"
          aria-label="Open cart"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

const TABS: { id: PageId; label: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "basket", label: "Basket", icon: ShoppingBasket },
  { id: "cart", label: "Cart", icon: ShoppingCart },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "savings", label: "Savings", icon: PiggyBank },
];

export function BottomNav({
  page,
  onNavigate,
  cartCount,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  cartCount: number;
}) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-safe"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = page === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                {t.id === "cart" && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
                    {cartCount}
                  </span>
                )}
              </span>
              <span>{t.label}</span>
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo size={32} withTagline />
            <p className="max-w-xs text-sm text-muted-foreground">
              Bei bora, kila wakati — one basket, every vendor, one delivery.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-mpesa/10 px-2.5 py-1 text-xs font-semibold text-mpesa">
                <ShoppingBag size={12} /> M-Pesa ready
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">For partners</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate("vendor-signup")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Store size={14} /> Register your shop
              </button>
              <button
                onClick={() => onNavigate("rider-signup")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Bike size={14} /> Become a rider
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Support</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate("faqs")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <LifeBuoy size={14} /> FAQs
              </button>
              <button
                onClick={() => onNavigate("support")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <MessageCircle size={14} /> Help centre
              </button>
              <Link
                href="https://wa.me/254731371521"
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Phone size={14} /> Chat on WhatsApp
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Grow &amp; earn</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate("boost")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Rocket size={14} /> Boost your shop
              </button>
              <button
                onClick={() => onNavigate("referrals")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Gift size={14} /> Refer &amp; earn
              </button>
              <button
                onClick={() => onNavigate("receipts")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <Receipt size={14} /> Snap receipts → tokens
              </button>
              <button
                onClick={() => onNavigate("vendor-portal")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <LayoutDashboard size={14} /> Vendor portal
              </button>
              <button
                onClick={() => onNavigate("rider-portal")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <LayoutDashboard size={14} /> Rider portal
              </button>
              <button
                onClick={() => onNavigate("admin")}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-brand"
              >
                <ShieldCheck size={14} /> Admin dashboard
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Coverage</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Webuye · Westlands</li>
              <li>Wendani</li>
              <li className="text-brand">More neighbourhoods soon</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/70 pt-5">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <button
              onClick={() => onNavigate("privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => onNavigate("terms")}
              className="hover:text-foreground transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => onNavigate("faqs")}
              className="hover:text-foreground transition-colors"
            >
              FAQs
            </button>
          </div>
          <div className="mt-3 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} WeBizzle. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              Made in Kenya <span aria-hidden>🇰🇪</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
