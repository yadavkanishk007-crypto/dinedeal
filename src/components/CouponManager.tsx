import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Plus, Copy, Check, X, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  max_discount: number;
  min_order_amount: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  valid_until: string | null;
  city: string | null;
  created_at: string;
}

const CouponManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountPercent: "10",
    maxDiscount: "500",
    minOrderAmount: "0",
    maxUses: "100",
    validUntil: "",
    city: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "DINE";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_percent: parseInt(formData.discountPercent),
        max_discount: parseFloat(formData.maxDiscount),
        min_order_amount: parseFloat(formData.minOrderAmount),
        max_uses: parseInt(formData.maxUses),
        valid_until: formData.validUntil || null,
        city: formData.city || null,
        created_by: user.id,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: "Coupon created!", description: `Code: ${formData.code.toUpperCase()}` });
      setShowForm(false);
      setFormData({
        code: "",
        description: "",
        discountPercent: "10",
        maxDiscount: "500",
        minOrderAmount: "0",
        maxUses: "100",
        validUntil: "",
        city: "",
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message.includes("unique") ? "Coupon code already exists" : error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      setCoupons(coupons.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Copied!", description: code });
  };

  const totalUsage = coupons.reduce((sum, c) => sum + c.current_uses, 0);
  const activeCoupons = coupons.filter((c) => c.is_active).length;

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Coupon Codes</h2>
          <p className="text-sm text-muted-foreground">
            {activeCoupons} active • {totalUsage} total uses
          </p>
        </div>
        {!showForm && (
          <Button variant="gradient" size="sm" onClick={() => { setShowForm(true); generateCode(); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Create New Coupon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      placeholder="COUPON CODE *"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="uppercase font-mono"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                      onClick={generateCode}
                    >
                      Generate
                    </Button>
                  </div>
                  <Input
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Discount %</label>
                    <Input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Discount (₹)</label>
                    <Input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Min Order (₹)</label>
                    <Input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Uses</label>
                    <Input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Valid Until</label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City (leave empty for all)</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">All Cities</option>
                      <option value="Jhansi">Jhansi</option>
                      <option value="Lucknow">Lucknow</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="gradient" size="sm" disabled={creating}>
                    {creating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Create Coupon
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No coupons created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={`border-border/50 ${!coupon.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="font-mono font-bold text-lg text-primary hover:underline flex items-center gap-2"
                        >
                          {coupon.code}
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          coupon.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground">{coupon.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{coupon.discount_percent}% off (max ₹{coupon.max_discount})</span>
                        {coupon.min_order_amount > 0 && (
                          <span>Min order ₹{coupon.min_order_amount}</span>
                        )}
                        {coupon.city && <span>📍 {coupon.city}</span>}
                        {coupon.valid_until && (
                          <span>Expires {new Date(coupon.valid_until).toLocaleDateString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <span className="font-bold">{coupon.current_uses}</span>
                          <span className="text-muted-foreground">/ {coupon.max_uses}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">uses</p>
                      </div>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => toggleCoupon(coupon.id, coupon.is_active)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
