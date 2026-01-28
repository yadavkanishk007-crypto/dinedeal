import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle, XCircle, Users, Camera, StopCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Fixed: Added missing import
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

interface EventCheckInProps {
  restaurantId: string;
}

export default function EventCheckIn({ restaurantId }: EventCheckInProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
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
      // Fixed: Explicitly casting 'as any' to bypass the outdated local TypeScript types
      const { data: booking, error: fetchError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          seats_booked,
          booking_status,
          checked_in_at,
          ticket_tier_name,
          event_id,
          events (
            id,
            title,
            created_by_id
          )
        `)
        .eq('qr_code_hash', qrHash)
        .maybeSingle() as any;

      if (fetchError || !booking) {
        throw new Error("Invalid QR code or booking not found.");
      }

      if (booking.events?.created_by_id !== restaurantId) {
        throw new Error("This ticket is for a different venue.");
      }

      if (booking.checked_in_at) {
        setResult({
          success: false,
          message: `Already checked in at ${new Date(booking.checked_in_at).toLocaleTimeString()}`,
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

      if (updateError) throw new Error("Database update failed.");

      setResult({
        success: true,
        message: "Check-in successful!",
        seatsCount: booking.seats_booked,
        eventTitle: booking.events?.title,
        tierName: booking.ticket_tier_name || "Standard Pass"
      });
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
    } catch (e) { console.error("Audio failed", e); }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Event Entrance</h2>
        <p className="text-muted-foreground text-sm">Scan QR to verify attendee</p>
      </div>

      <div id="checkin-qr-reader" className={`aspect-square rounded-2xl overflow-hidden bg-black border-4 ${isScanning ? 'border-primary' : 'border-transparent'} shadow-xl`} />

      <div className="flex gap-2">
        {!isScanning ? (
          <Button onClick={startScanner} className="flex-1 h-12" variant="gradient">
            <Camera className="mr-2 w-4 h-4" /> Start Scanner
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="destructive" className="flex-1 h-12">
            <StopCircle className="mr-2 w-4 h-4" /> Stop Scanner
          </Button>
        )}
      </div>

      <div className="pt-4 border-t">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            placeholder="Manual QR Code Hash"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={processing}>Verify</Button>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border-2 text-center shadow-lg ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            {result.success ? <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-2" /> : <XCircle className="w-16 h-16 text-red-600 mx-auto mb-2" />}
            
            <h3 className={`text-xl font-bold ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</h3>
            
            <div className="mt-4 p-4 bg-white/50 rounded-lg space-y-2 text-left">
              <p className="font-bold text-gray-800">{result.eventTitle}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm font-medium text-gray-600"><Ticket className="w-4 h-4 mr-1"/> Pass:</span>
                <Badge variant="outline" className="border-primary text-primary font-bold uppercase">{result.tierName}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm font-medium text-gray-600"><Users className="w-4 h-4 mr-1"/> Seats:</span>
                <span className="font-bold">{result.seatsCount}</span>
              </div>
            </div>

            <Button variant="outline" className="mt-6 w-full" onClick={() => { setResult(null); startScanner(); }}>
              Scan Next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
