"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DesktopNav,
  MobileHeader,
  BottomNav,
  Footer,
} from "@/components/brand/shell";
import { HomePage } from "@/components/brand/pages/home";
import { BasketPage } from "@/components/brand/pages/basket";
import { CartPage } from "@/components/brand/pages/cart";
import { CheckoutPage, ConfirmationPage } from "@/components/brand/pages/checkout";
import { OrdersPage } from "@/components/brand/pages/orders";
import { SavingsPage } from "@/components/brand/pages/savings";
import { BoostPage } from "@/components/brand/pages/boost";
import { AdminPage } from "@/components/brand/pages/admin";
import { ReferralsPage } from "@/components/brand/pages/referrals";
import { ReceiptsPage } from "@/components/brand/pages/receipts";
import { VendorPortalPage } from "@/components/brand/pages/vendor-portal";
import { RiderPortalPage } from "@/components/brand/pages/rider-portal";
import {
  SupportPage,
  VendorSignupPage,
  RiderSignupPage,
} from "@/components/brand/pages/support-signup";
import type {
  Cart,
  CartItem,
  CompareResult,
  Order,
  PageId,
  Product,
  Vendor,
} from "@/lib/types";

export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Cart | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load catalogue + vendors on mount
  useEffect(() => {
    (async () => {
      try {
        const [pr, vr] = await Promise.all([
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/vendors").then((r) => r.json()),
        ]);
        setProducts(pr.products ?? []);
        setVendors(vr.vendors ?? []);
      } catch {
        // silent — UI shows empty states
      }
    })();
  }, []);

  // Load orders when navigating to orders page
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders").then((r) => r.json());
      setOrders(res.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (p === "orders") loadOrders();
    if (p !== "basket") setActiveCategory(null);
  }, [loadOrders]);

  const navigateCategory = useCallback((p: PageId, category?: string) => {
    if (category) setActiveCategory(category);
    else setActiveCategory(null);
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (p === "orders") loadOrders();
  }, [loadOrders]);

  const addToCompare = useCallback(
    (pid: string) => {
      setSelection((prev) => ({ ...prev, [pid]: prev[pid] ? prev[pid] : 1 }));
      navigate("basket");
    },
    [navigate]
  );

  // Rebuild a Smart Basket from a past order's items ("Buy it again")
  const handleReorder = useCallback(
    (items: CartItem[]) => {
      const next: Record<string, number> = {};
      for (const it of items) {
        next[it.productId] = (next[it.productId] || 0) + it.qty;
      }
      setSelection(next);
      navigate("basket");
    },
    [navigate]
  );

  const cartCount = cart
    ? cart.items.reduce((a, it) => a + it.qty, 0)
    : 0;

  // ---- Compare action ----
  const handleCompare = useCallback(async (): Promise<CompareResult | null> => {
    const items = Object.fromEntries(
      Object.entries(selection).filter(([, q]) => Number(q) > 0)
    );
    if (Object.keys(items).length === 0) return null;
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data as CompareResult;
    } catch {
      return null;
    }
  }, [selection]);

  // ---- Choose a vendor from compare results -> build cart ----
  const handleChooseVendor = useCallback(
    (vendorId: string, items: CartItem[]) => {
      const vendor = vendors.find((v) => v.id === vendorId);
      if (!vendor) return;
      const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
      setCart({
        vendor,
        items,
        subtotal,
        deliveryFee: vendor.deliveryFee,
        total: subtotal + vendor.deliveryFee,
      });
    },
    [vendors]
  );

  // ---- Place order ----
  const handlePlaceOrder = useCallback(
    async (data: {
      customerName: string;
      phone: string;
      location: string;
      lat?: number | null;
      lng?: number | null;
    }): Promise<Order | null> => {
      if (!cart) return null;
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: cart.vendor.id,
            customerName: data.customerName,
            phone: data.phone,
            location: data.location,
            items: cart.items,
            subtotal: cart.subtotal,
            deliveryFee: cart.deliveryFee,
            total: cart.total,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        setLastOrder(json.order);
        // clear cart after successful order
        setCart(null);
        setSelection({});
        return json.order as Order;
      } catch {
        return null;
      }
    },
    [cart]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DesktopNav page={page} onNavigate={navigate} cartCount={cartCount} />
      <MobileHeader onNavigate={navigate} cartCount={cartCount} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-10 lg:px-6">
        {page === "home" && (
          <HomePage
            onNavigate={navigate}
            onNavigateCategory={navigateCategory}
            onAddToCompare={addToCompare}
            products={products}
            vendors={vendors}
            search={search}
            setSearch={setSearch}
          />
        )}

        {page === "basket" && (
          <BasketPage
            products={products}
            vendors={vendors}
            selection={selection}
            setSelection={setSelection}
            onCompare={handleCompare}
            onChooseVendor={handleChooseVendor}
            onNavigate={navigateCategory}
            activeCategory={activeCategory}
            onClearCategory={() => setActiveCategory(null)}
          />
        )}

        {page === "cart" && (
          <CartPage
            cart={cart}
            onNavigate={navigate}
            onClear={() => setCart(null)}
          />
        )}

        {page === "checkout" && (
          <CheckoutPage
            cart={cart}
            onPlaceOrder={handlePlaceOrder}
            onNavigate={navigate}
          />
        )}

        {page === "confirmation" && (
          <ConfirmationPage order={lastOrder} onNavigate={navigate} />
        )}

        {page === "orders" && (
          <OrdersPage
            orders={orders}
            loading={ordersLoading}
            onNavigate={navigate}
            onReorder={handleReorder}
          />
        )}

        {page === "savings" && <SavingsPage onNavigate={navigate} />}

        {page === "boost" && <BoostPage onNavigate={navigate} />}

        {page === "referrals" && <ReferralsPage onNavigate={navigate} />}

        {page === "receipts" && <ReceiptsPage onNavigate={navigate} />}

        {page === "admin" && <AdminPage />}

        {page === "vendor-portal" && <VendorPortalPage onNavigate={navigate} />}

        {page === "rider-portal" && <RiderPortalPage onNavigate={navigate} />}

        {page === "support" && <SupportPage />}

        {page === "vendor-signup" && <VendorSignupPage />}
        {page === "rider-signup" && <RiderSignupPage />}
      </main>

      <Footer onNavigate={navigate} />
      <BottomNav page={page} onNavigate={navigate} cartCount={cartCount} />
    </div>
  );
}
