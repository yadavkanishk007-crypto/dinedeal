import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Receipt,
  Users,
  TrendingUp,
  Percent,
  Star,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  open_hours: string | null;
  image_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  rating: number | null;
  upi_id: string | null;
  created_at: string;
  owner_id: string;
}

interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  min_order_amount: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  terms: string | null;
}

interface Transaction {
  id: string;
  bill_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  user_id: string | null;
}

interface Stats {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  avgOrderValue: number;
  totalDiscounts: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  is_available: boolean | null;
  is_veg: boolean | null;
}

interface AdminRestaurantDetailProps {
  restaurantId: string;
  onBack: () => void;
  onApprovalChange?: () => void;
}

const AdminRestaurantDetail = ({ restaurantId, onBack, onApprovalChange }: AdminRestaurantDetailProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    totalDiscounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [restaurantId]);

  const fetchAllData = async () => {
    try {
      // Fetch restaurant details
      const { data: restaurantData, error: restError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (restError) throw restError;
      setRestaurant(restaurantData);

      // Fetch offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      setOffers(offersData || []);

      // Fetch transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      setTransactions(txData || []);

      // Calculate stats
      if (txData) {
        const completedTx = txData.filter(t => t.payment_status === "completed");
        const uniqueCustomers = new Set(completedTx.map(t => t.user_id)).size;
        const totalRevenue = completedTx.reduce((sum, t) => sum + Number(t.final_amount), 0);
        const totalDiscounts = completedTx.reduce((sum, t) => sum + Number(t.discount_amount), 0);

        setStats({
          totalRevenue,
          totalTransactions: completedTx.length,
          totalCustomers: uniqueCustomers,
          avgOrderValue: completedTx.length > 0 ? totalRevenue / completedTx.length : 0,
          totalDiscounts,
        });
      }

      // Fetch menu items
      const { data: menuData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("category", { ascending: true });

      setMenuItems(menuData || []);
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approve: boolean) => {
    if (!restaurant) return;
    setApproving(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ 
          is_approved: approve,
          is_active: approve ? restaurant.is_active : false 
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, is_approved: approve, is_active: approve ? restaurant.is_active : false });
      
      await logAction({
        action: approve ? "APPROVE_RESTAURANT" : "REJECT_RESTAURANT",
        entity_type: "restaurant",
        entity_id: restaurant.id,
        details: { restaurant_name: restaurant.name },
      });

      toast({
        title: approve ? "Restaurant Approved" : "Restaurant Rejected",
        description: approve 
          ? `${restaurant.name} is now approved and can go live.`
          : `${restaurant.name} has been rejected.`,
      });

      onApprovalChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const exportToPDF = () => {
    if (!restaurant) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(41, 98, 255);
    doc.text(restaurant.name, pageWidth / 2, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Restaurant Insights Report`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}`, pageWidth / 2, 34, { align: "center" });

    // Restaurant Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Restaurant Information", 14, 48);

    autoTable(doc, {
      startY: 52,
      head: [["Field", "Value"]],
      body: [
        ["Name", restaurant.name],
        ["Cuisine", restaurant.cuisine],
        ["Address", `${restaurant.address}, ${restaurant.city}`],
        ["Phone", restaurant.phone || "N/A"],
        ["Email", restaurant.email || "N/A"],
        ["Open Hours", restaurant.open_hours || "N/A"],
        ["Status", restaurant.is_approved ? (restaurant.is_active ? "Active" : "Inactive") : "Pending Approval"],
        ["Rating", restaurant.rating?.toString() || "N/A"],
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 98, 255] },
      margin: { left: 14, right: 14 },
    });

    // Stats
    let yPos = (doc as any).lastAutoTable?.finalY + 12 || 120;
    doc.setFontSize(14);
    doc.text("Performance Metrics", 14, yPos);

    autoTable(doc, {
      startY: yPos + 4,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", `₹${stats.totalRevenue.toLocaleString()}`],
        ["Total Transactions", stats.totalTransactions.toString()],
        ["Unique Customers", stats.totalCustomers.toString()],
        ["Average Order Value", `₹${Math.round(stats.avgOrderValue)}`],
        ["Total Discounts Given", `₹${stats.totalDiscounts.toLocaleString()}`],
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 98, 255] },
      margin: { left: 14, right: 14 },
    });

    // Offers
    yPos = (doc as any).lastAutoTable?.finalY + 12 || yPos + 60;
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Offers", 14, yPos);

    if (offers.length > 0) {
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Title", "Discount", "Max Discount", "Status"]],
        body: offers.map(o => [
          o.title,
          `${o.discount_percent}%`,
          `₹${o.max_discount}`,
          o.is_active ? "Active" : "Inactive",
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 98, 255] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("No offers configured", 14, yPos + 8);
    }

    // Menu Items
    yPos = (doc as any).lastAutoTable?.finalY + 12 || yPos + 20;
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Menu Items", 14, yPos);

    if (menuItems.length > 0) {
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Name", "Category", "Price", "Type", "Available"]],
        body: menuItems.map(m => [
          m.name,
          m.category || "Uncategorized",
          `₹${m.price}`,
          m.is_veg ? "Veg" : "Non-Veg",
          m.is_available ? "Yes" : "No",
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 98, 255] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("No menu items configured", 14, yPos + 8);
    }

    // Recent Transactions
    yPos = (doc as any).lastAutoTable?.finalY + 12 || yPos + 20;
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Recent Transactions (Last 20)", 14, yPos);

    const recentTx = transactions.slice(0, 20);
    if (recentTx.length > 0) {
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Date", "Bill Amount", "Discount", "Final Amount", "Status"]],
        body: recentTx.map(t => [
          new Date(t.created_at).toLocaleDateString("en-IN"),
          `₹${t.bill_amount}`,
          `₹${t.discount_amount}`,
          `₹${t.final_amount}`,
          t.payment_status || "pending",
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 98, 255] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("No transactions yet", 14, yPos + 8);
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | ${restaurant.name} - Restaurant Report`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`${restaurant.name.replace(/\s+/g, "-")}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "Restaurant report has been downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Restaurant not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.cuisine} • {restaurant.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Status & Approval */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={restaurant.is_approved ? "default" : "secondary"}>
                {restaurant.is_approved ? "Approved" : "Pending Approval"}
              </Badge>
              {restaurant.is_approved && (
                <Badge variant={restaurant.is_active ? "default" : "outline"}>
                  {restaurant.is_active ? "Active" : "Inactive"}
                </Badge>
              )}
              {restaurant.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{restaurant.rating}</span>
                </div>
              )}
            </div>
            {!restaurant.is_approved && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApproval(false)}
                  disabled={approving}
                  className="gap-2 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApproval(true)}
                  disabled={approving}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            )}
            {restaurant.is_approved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApproval(false)}
                disabled={approving}
                className="gap-2 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4" />
                Revoke Approval
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" />
            Restaurant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{restaurant.address}, {restaurant.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{restaurant.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{restaurant.email || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Open Hours</p>
                <p className="font-medium">{restaurant.open_hours || "Not specified"}</p>
              </div>
            </div>
          </div>
          {restaurant.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p>{restaurant.description}</p>
              </div>
            </>
          )}
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Payment Info</p>
            <p className="font-medium">UPI: {restaurant.upi_id || "Not configured"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="text-xl font-bold">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Order</p>
                <p className="text-xl font-bold">₹{Math.round(stats.avgOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Percent className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discounts</p>
                <p className="text-xl font-bold">₹{stats.totalDiscounts.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Offers ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {offer.discount_percent}% off, max ₹{offer.max_discount}
                      {offer.min_order_amount ? ` • Min order ₹${offer.min_order_amount}` : ""}
                    </p>
                    {offer.terms && (
                      <p className="text-xs text-muted-foreground mt-1">{offer.terms}</p>
                    )}
                  </div>
                  <Badge variant={offer.is_active ? "default" : "secondary"}>
                    {offer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No offers configured</p>
          )}
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Menu Items ({menuItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.price}</p>
                    {!item.is_available && (
                      <span className="text-xs text-destructive">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No menu items configured</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Recent Transactions ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">₹{tx.bill_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        tx.payment_status === "completed"
                          ? "default"
                          : tx.payment_status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {tx.payment_status || "pending"}
                    </Badge>
                    {tx.discount_amount > 0 && (
                      <p className="text-sm text-green-500 mt-1">-₹{tx.discount_amount} discount</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminRestaurantDetail;
