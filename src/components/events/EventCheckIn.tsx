import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle, XCircle, Users, Camera, StopCircle, Ticket, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface CheckInResult {
  success: boolean;
  message: string;
  seatsCount?: number;
  eventTitle?: string;
  tierName?: string;
}

interface HistoryItem {
  id: string;
  eventTitle: string;
  tierName: string;
  seatsCount: number;
  timestamp: string;
}

interface EventCheckInProps {
  restaurantId: string;
}

export default function EventCheckIn({ restaurantId }: EventCheckInProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    try {
      scannerRef.current = new Html5Qrcode("checkin-qr-reader");
      setIsScanning(true);
      setResult(null);

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleCheckIn(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (error: any) {
      toast({ title: "Camera Error", description: "Please allow camera access", variant: "destructive" });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleCheckIn = async (qrHash: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);

    try {
      // Explicitly fetching seats_booked and ticket_tier_name
      const { data: booking, error: fetchError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          seats_booked,
          booking_status,
          checked_in_at,
          ticket_tier_name,
          events ( title, created_by_id )
        `)
        .eq('qr_code_hash', qrHash)
        .maybeSingle() as any;

      if (fetchError || !booking) throw new Error("Invalid QR code.");
      if (booking.events?.created_by_id !== restaurantId) throw new Error("Wrong venue.");

      if (booking.checked_in_at) {
        setResult({
          success: false,
          message: "Already Checked In",
          seatsCount: booking.seats_booked,
          eventTitle: booking.events?.title,
          tierName: booking.ticket_tier_name
        });
        playSound(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('event_bookings')
        .update({
          booking_status: 'attended',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) throw new Error("Update failed.");

      const successResult = {
        success: true,
        message: "Check-in successful!",
        seatsCount: booking.seats_booked,
        eventTitle: booking.events?.title,
        tierName: booking.ticket_tier_name || "Standard Pass"
      };

      setResult(successResult);
      
      // Add to history (keep last 5)
      setHistory(prev => [{
        id: booking.id,
        eventTitle: booking.events?.title,
        tierName: successResult.tierName,
        seatsCount: booking.seats_booked,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 5));

      playSound(true);
    } catch (error: any) {
      setResult({ success: false, message: error.message });
      playSound(false);
    } finally {
      setProcessing(false);
    }
  };

  const playSound = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(success ? 880 : 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div id="checkin-qr-reader" className="aspect-square rounded-2xl overflow-hidden bg-black border-4 border-transparent shadow-xl" />

      {!isScanning && !result && (
        <Button onClick={startScanner} className="w-full h-14 text-lg" variant="gradient">
          <Camera className="mr-2 h-5 w-5" /> Start Scanner
        </Button>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-2xl border-2 shadow-lg ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            {result.success ? <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" /> : <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />}
            <h3 className={`text-xl font-bold mb-4 ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</h3>
            
            <div className="bg-white/60 p-4 rounded-xl space-y-3 text-left">
              <p className="font-bold text-gray-800 border-b pb-2">{result.eventTitle}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1"><Ticket className="h-4 w-4"/> Pass:</span>
                <Badge className="bg-primary uppercase font-bold">{result.tierName}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1"><Users className="h-4 w-4"/> Seats:</span>
                <span className="text-lg font-black text-gray-900">{result.seatsCount} Person(s)</span>
              </div>
            </div>

            <Button className="mt-6 w-full h-12" onClick={() => { setResult(null); startScanner(); }}>Scan Next</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY TAB */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground px-1">
          <History className="h-4 w-4" />
          <h4 className="text-sm font-bold uppercase tracking-wider">Recent Check-ins</h4>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-2xl text-muted-foreground text-xs">No scans in this session</div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500">{item.timestamp}</span>
                  <span className="font-bold text-sm truncate max-w-[150px]">{item.eventTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5">{item.tierName}</Badge>
                  <div className="bg-secondary px-2 py-1 rounded text-xs font-bold">x{item.seatsCount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(manualCode); setManualCode(""); }} className="flex gap-2">
          <Input placeholder="Enter hash manually" value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
          <Button type="submit" variant="secondary">Verify</Button>
        </form>
      </div>
    </div>
  );
}
