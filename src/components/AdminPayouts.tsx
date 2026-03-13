import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Wallet, 
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ArrowRight,
  Edit,
  CreditCard,
  Banknote,
  Lock,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Settlement {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  net_payable: number;
  status: string;
  payout_reference: string | null;
  payout_method: 'manual' | 'razorpay' | null;
  razorpay_payout_id?: string;
  razorpay_status?: string;
  payout_date: string | null;
  created_at: string;
}

const AdminPayouts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Update payout dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [payoutReference, setPayoutReference] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    pendingAmount: 0,
    processingAmount: 0,
    completedAmount: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all settlements for stats
      const { data: allSettlements } = await supabase
        .from("settlements")
        .select(`
          *,
          restaurants!inner(name)
        `);

      // Calculate stats
      const pending = allSettlements?.filter(s => s.status === "pending") || [];
      const processing = allSettlements?.filter(s => s.status === "processing") || [];
      const completed = allSettlements?.filter(s => s.status === "completed") || [];

      setStats({
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
        pendingAmount: pending.reduce((sum, s) => sum + Number(s.net_payable), 0),
        processingAmount: processing.reduce((sum, s) => sum + Number(s.net_payable), 0),
        completedAmount: completed.reduce((sum, s) => sum + Number(s.net_payable), 0),
      });

      // Fetch filtered settlements
      let query = supabase
        .from("settlements")
        .select(`
          *,
          restaurants!inner(name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: settlementsData, error } = await query;

      if (error) throw error;

      const mappedSettlements = settlementsData?.map((s: any) => ({
        ...s,
        restaurant_name: s.restaurants?.name || "Unknown",
      })) || [];

      // Apply search filter
      const filteredSettlements = searchQuery 
        ? mappedSettlements.filter(s => 
            s.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.payout_reference?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mappedSettlements;

      setSettlements(filteredSettlements);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchQuery]);

  const openUpdateDialog = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    // If manual, allow flow. If razorpay, mostly read-only unless status override needed (but prevented by constraints)
    setNewStatus(settlement.status === "pending" ? "processing" : "completed");
    setPayoutReference(settlement.payout_reference || "");
    setIsUpdateDialogOpen(true);
  };

  const updatePayoutStatus = async () => {
    if (!selectedSettlement) return;

    // Razorpay is strictly read-only in UI. Updates happen via webhooks.
    if (selectedSettlement.payout_method === 'razorpay') {
      toast({ title: "Restricted", description: "Razorpay payouts are updated automatically.", variant: "destructive" });
      return;
    }

    // Strict validation for manual payouts
    if (selectedSettlement.payout_method === 'manual') {
      if (newStatus === "completed" && !payoutReference.trim()) {
        toast({ title: "Error", description: "Payout reference (UTR) is required to mark as completed", variant: "destructive" });
        return;
      }
    }

    setIsUpdating(true);
    try {
      // Use API for completion to handle any backend logic triggers (finalizing transaction settlement status)
      if (newStatus === "completed") {
        const response = await fetch(
          `${import.meta.env.PROD
           ? "https://dinedeal-backend-076n.onrender.com"
           : "http://localhost:5000"
         }/api/admin/settlements/${selectedSettlement.id}/complete`,
         {
           method: 'POST',
           headers: {
          'Content-Type': 'application/json',
         },
          credentials: 'include',
          body: JSON.stringify({
          payout_reference: payoutReference.trim(),
      }),
     }
      );

        
        if (!response.ok) {
           throw new Error("Failed to complete payout via API");
        }
      } else {
        // Fallback for simple status updates (e.g. pending -> processing)
        const { error } = await supabase
          .from("settlements")
          .update({ status: newStatus })
          .eq("id", selectedSettlement.id);
        
        if (error) throw error;
      }
      // Log action
      await logAction({
        action: "update_payout_status",
        entity_type: "settlement",
        entity_id: selectedSettlement.id,
        details: { 
          previous_status: selectedSettlement.status, 
          new_status: newStatus,
          payout_reference: payoutReference || null,
          method: selectedSettlement.payout_method
        },
      });

      toast({ 
        title: "Success", 
        description: `Payout marked as ${newStatus}` 
      });
      setIsUpdateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error updating payout:", error);
      toast({ title: "Error", description: error.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-white"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextAction = (status: string, method: string | null) => {
    if (method === 'razorpay') return { label: "View Details", nextStatus: null };
    
    switch (status) {
      case "pending":
        return { label: "Mark Processing", nextStatus: "processing" };
      case "processing":
        return { label: "Mark Completed", nextStatus: "completed" };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "pending" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                <p className="text-sm text-yellow-600 mt-1">₹{stats.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "processing" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setStatusFilter("processing")}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold mt-1">{stats.processing}</p>
                <p className="text-sm text-blue-600 mt-1">₹{stats.processingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "completed" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter("completed")}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1">{stats.completed}</p>
                <p className="text-sm text-green-600 mt-1">₹{stats.completedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Payout Management
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by restaurant, ID, or UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No payouts found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement ID</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>UTR/Reference</TableHead>
                    <TableHead>Payout Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => {
                    const action = getNextAction(settlement.status, settlement.payout_method);
                    return (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-mono text-sm">
                          #{settlement.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">{settlement.restaurant_name}</TableCell>
                        <TableCell>
                          {settlement.payout_method === 'razorpay' ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Razorpay</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ₹{Number(settlement.net_payable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {settlement.payout_reference || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {settlement.payout_date 
                            ? format(new Date(settlement.payout_date), "dd MMM yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {action && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openUpdateDialog(settlement)}
                            >
                              {settlement.payout_method === 'razorpay' ? <Eye className="w-3 h-3 mr-1" /> : <Edit className="w-3 h-3 mr-1" />}
                              {action.label}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSettlement?.payout_method === 'razorpay' ? "Payout Details" : "Update Payout Status"}
            </DialogTitle>
            <DialogDescription>
              {selectedSettlement && (
                <>
                  Settlement #{selectedSettlement.id.slice(0, 8).toUpperCase()} for {selectedSettlement.restaurant_name}
                  <br />
                  Amount: ₹{Number(selectedSettlement.net_payable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  <br />
                  Method: <span className="capitalize font-medium">{selectedSettlement.payout_method || 'manual'}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement?.payout_method === 'razorpay' ? (
            // Razorpay Read-Only View
            <div className="space-y-4 py-4">
               <div className="bg-slate-50 p-4 rounded-lg space-y-3 border">
                 <div className="flex items-center gap-2 text-blue-700 font-medium pb-2 border-b">
                   <CreditCard className="w-4 h-4" /> Razorpay Automated Payout
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-sm">
                   <span className="text-muted-foreground">Payout Status:</span>
                   <span className="font-medium">{selectedSettlement.razorpay_status || selectedSettlement.status}</span>
                   
                   <span className="text-muted-foreground">Payout ID:</span>
                   <span className="font-mono">{selectedSettlement.razorpay_payout_id || "Generating..."}</span>
                   
                   <span className="text-muted-foreground">UTR:</span>
                   <span className="font-mono">{selectedSettlement.payout_reference || "Pending Bank"}</span>
                 </div>
               </div>
               <p className="text-xs text-muted-foreground text-center">
                 <Lock className="w-3 h-3 inline mr-1" />
                 This payout is managed automatically. No manual overrides allowed.
               </p>
            </div>
          ) : (
            // Manual Update View
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSettlement?.status === "pending" && (
                      <SelectItem value="processing">Processing</SelectItem>
                    )}
                    {(selectedSettlement?.status === "pending" || selectedSettlement?.status === "processing") && (
                      <SelectItem value="completed">Completed</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {newStatus === "completed" && (
                <div className="space-y-2">
                  <Label>Payout Reference (UTR/Bank Ref) *</Label>
                  <Input
                    placeholder="Enter UTR or bank reference number"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Close
            </Button>
            {selectedSettlement?.payout_method !== 'razorpay' && (
              <Button onClick={updatePayoutStatus} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Status"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayouts;
