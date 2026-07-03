"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  Smartphone,
  TrendingUp,
  Eye,
  MousePointerClick,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHead } from "./orders";
import { useToast } from "@/hooks/use-toast";
import { KES } from "../logo";
import { cn } from "@/lib/utils";
import type { BoostPackage, PageId } from "@/lib/types";

type Campaign = {
  id: string;
  shopName: string;
  package: string;
  price: number;
  status: string;
  endsAt: string;
  impressions: number;
  clicks: number;
};

export function BoostPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCampaigns = async (p?: string) => {
    const usePhone = p ?? phone;
    if (!usePhone.trim()) return;
    try {
      const res = await fetch(`/api/boosts?phone=${encodeURIComponent(usePhone.trim())}`).then((r) => r.json());
      setCampaigns(res.campaigns ?? []);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boosts").then((r) => r.json());
        setPackages(res.packages ?? []);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBuy = async (pkg: BoostPackage) => {
    if (!shopName.trim() || !phone.trim()) {
      toast({
        title: "Shop details required",
        description: "Enter your shop name and M-Pesa phone to buy a boost.",
        variant: "destructive",
      });
      return;
    }
    setBuying(pkg.id);
    try {
      const res = await fetch("/api/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, shopName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Boost failed", description: data.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Boost activated! 🚀",
        description: `${pkg.name} package · M-Pesa ${data.campaign.mpesaCode} · runs until ${new Date(data.campaign.endsAt).toLocaleDateString("en-KE")}.`,
      });
      await loadCampaigns();
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Loading boost packages…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Rocket className="text-brand" size={24} />}
        title="Boost your shop"
        desc="Get seen first. Pay once with M-Pesa and your shop jumps to the top of category + compare results for the boost period."
      />

      {/* Shop identification */}
      <Card className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shopName" className="flex items-center gap-1.5">
            <Rocket size={14} /> Shop name
          </Label>
          <Input
            id="shopName"
            placeholder="e.g. Baraka General Store"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="boostPhone" className="flex items-center gap-1.5">
            <Smartphone size={14} /> M-Pesa phone
          </Label>
          <Input
            id="boostPhone"
            placeholder="07XXXXXXXX"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (e.target.value.length >= 10) loadCampaigns(e.target.value);
            }}
          />
        </div>
      </Card>

      {/* Packages */}
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => {
          const isPlatinum = pkg.id === "PLATINUM";
          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative flex flex-col p-5",
                isPlatinum && "border-gold ring-1 ring-gold/40"
              )}
            >
              {isPlatinum && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-black">
                  <Crown size={11} /> Best value
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl",
                    isPlatinum ? "bg-gold/15 text-gold-dark" : "bg-brand-light text-brand"
                  )}
                >
                  <Rocket size={18} />
                </span>
                <div>
                  <div className="font-bold">{pkg.name}</div>
                  <div className="text-[11px] text-muted-foreground">{pkg.days} days</div>
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-brand">
                {KES(pkg.price)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{pkg.perk}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 bg-brand text-white hover:bg-brand-dark"
                disabled={buying === pkg.id}
                onClick={() => handleBuy(pkg)}
              >
                {buying === pkg.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Paying…
                  </>
                ) : (
                  <>
                    <Smartphone size={16} /> Pay {KES(pkg.price)}
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* My active boosts */}
      {phone.trim() && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-bold">My boost campaigns</h3>
          </div>
          {campaigns.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No boosts yet — pick a package above to get featured.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((c) => {
                const active = c.status === "ACTIVE" && new Date(c.endsAt) > new Date();
                return (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-lg">🚀</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{c.shopName}</span>
                        <Badge className="bg-gold/15 text-[10px] text-gold-dark">{c.package}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5">
                          <Eye size={10} /> {c.impressions} views
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <MousePointerClick size={10} /> {c.clicks} clicks
                        </span>
                        <span>Ends {new Date(c.endsAt).toLocaleDateString("en-KE")}</span>
                      </div>
                    </div>
                    <Badge className={active ? "bg-brand-light text-brand" : "bg-muted text-muted-foreground"}>
                      {active ? "Active" : c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <TrendingUp size={12} className="text-brand" />
        Boosts are charged separately from the 3% platform levy on orders.
      </div>
    </div>
  );
}
