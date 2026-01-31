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
  Sparkles,
  Link2,
  Instagram,
  Twitter,
  Wallet,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
  is_event_organiser?: boolean;
  organiser_type?: string;
  rating: number | null;
  upi_id: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_account_holder?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  website?: string | null;
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

  // Search States
  const [menuSearch, setMenuSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");

  useEffect(() => {
    fetchAllData();
  }, [restaurantId]);

  const fetchAllData = async () => {
    try {
      const { data: restaurantData, error: restError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (restError) throw restError;
      setRestaurant(restaurantData);

      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      setOffers(offersData || []);

      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      setTransactions(txData || []);

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

      // Only fetch menu if NOT an event organiser
      if (!restaurantData.is_event_organiser) {
        const { data: menuData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("category", { ascending: true });
        setMenuItems(menuData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
      await onApprovalChange?.();
      toast({ title: approve ? "Profile Approved" : "Profile Rejected" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const exportToPDF = () => {
    if (!restaurant) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(20);
    doc.setTextColor(41, 98, 255);
    doc.text(restaurant.name, pageWidth / 2, 20, { align: "center" });

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Name", restaurant.name],
        ["Type", restaurant.is_event_organiser ? "Event Organiser" : "Restaurant"],
        ["Address", `${restaurant.address}, ${restaurant.city}`],
        ["UPI ID", restaurant.upi_id || "N/A"],
      ],
    });
    doc.save(`${restaurant.name}-report.pdf`);
  };

  // Filter Logic
  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
    item.category?.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const filteredTx = transactions.filter(tx => 
    tx.final_amount.toString().includes(txSearch) || 
    tx.payment_status?.toLowerCase().includes(txSearch.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!restaurant) return <div className="text-center py-12"><p>Not found</p><Button onClick={onBack}>Go Back</Button></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {restaurant.name}
              {restaurant.is_event_organiser && <Sparkles className="w-5 h-5 text-purple-500" />}
            </h1>
            <p className="text-muted-foreground">{restaurant.cuisine} • {restaurant.city}</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportToPDF} className="gap-2"><Download className="w-4 h-4" />Export PDF</Button>
      </div>

      {/* Approval Section */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={restaurant.is_approved ? "default" : "secondary"}>
                {restaurant.is_approved ? "Approved" : "Pending Approval"}
            </Badge>
            <Badge variant="outline">{restaurant.is_event_organiser ? "Event Group" : "Dining"}</Badge>
          </div>
          <div className="flex gap-2">
            {!restaurant.is_approved ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApproval(false)} 
                  disabled={approving} 
                  className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
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
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleApproval(false)} 
                disabled={approving} 
                className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4" />
                Revoke Approval (Reject)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">{restaurant.is_event_organiser ? <Sparkles className="w-5 h-5 text-purple-500" /> : <Store className="w-5 h-5 text-orange-500" />}Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-1 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{restaurant.address}, {restaurant.city}</p></div></div>
            <div className="flex items-start gap-3"><Phone className="w-4 h-4 mt-1 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{restaurant.phone || "N/A"}</p></div></div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />Payout Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-xl">
              <div><p className="text-xs text-muted-foreground">Holder</p><p className="font-medium">{restaurant.bank_account_holder || "N/A"}</p></div>
              <div><p className="text-xs text-muted-foreground">UPI ID</p><p className="font-medium text-primary">{restaurant.upi_id || "N/A"}</p></div>
              <div><p className="text-xs text-muted-foreground">Account</p><p className="font-medium">{restaurant.bank_account_number || "N/A"}</p></div>
              <div><p className="text-xs text-muted-foreground">IFSC</p><p className="font-medium uppercase">{restaurant.bank_ifsc || "N/A"}</p></div>
            </div>
          </div>

          {restaurant.is_event_organiser && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />Social Handles</h4>
                <div className="flex flex-wrap gap-3">
                  {restaurant.instagram && <Badge variant="secondary" className="gap-2"><Instagram className="w-3 h-3" /> @{restaurant.instagram}</Badge>}
                  {restaurant.twitter && <Badge variant="secondary" className="gap-2"><Twitter className="w-3 h-3" /> @{restaurant.twitter}</Badge>}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<DollarSign className="text-green-500" />} label="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} bgColor="bg-green-500/10" />
        <StatCard icon={<Users className="text-purple-500" />} label="Customers" value={stats.totalCustomers.toString()} bgColor="bg-purple-500/10" />
      </div>

      {/* MENU SECTION - Only shown for non-event groups */}
      {!restaurant.is_event_organiser && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" />Menu Items</CardTitle>
              <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="Search menu..." className="pl-7 h-7 text-xs" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
              </div>
          </CardHeader>
          <CardContent>
            {filteredMenu.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMenu.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                      <p className="text-sm">{item.name}</p>
                    </div>
                    <p className="text-sm font-bold">₹{item.price}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-xs py-4">No items found</p>}
          </CardContent>
        </Card>
      )}

      {/* TRANSACTIONS SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Receipt className="w-5 h-5" />Transactions</CardTitle>
            <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input placeholder="Search transactions..." className="pl-7 h-7 text-xs" value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
          {filteredTx.length > 0 ? (
            <div className="space-y-2">
              {filteredTx.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div><p className="text-sm font-bold">₹{tx.bill_amount}</p><p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p></div>
                  <Badge className="text-[10px]">{tx.payment_status}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-xs py-4">No transactions found</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, bgColor }: any) => (
  <Card><CardContent className="p-4 flex items-center gap-3"><div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div></CardContent></Card>
);

export default AdminRestaurantDetail;
