import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle, XCircle, Users, Camera, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface CheckInResult {
  success: boolean;
  message: string;
  seatsCount?: number;
  eventTitle?: string;
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
  
  // Use a ref to persist the scanner instance and avoid re-initialization crashes
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scanner instance and inject styles on mount
  useEffect(() => {
    // Persistent instance creation
    scannerRef.current = new Html5Qrcode("checkin-qr-reader");

    const style = document.createElement('style');
    style.innerHTML = `
      #checkin-qr-reader video {
        object-fit: cover !important;
        border-radius: 12px;
      }
      #checkin-qr-reader {
        border: none !important;
        position: relative;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Safe cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.warn("Cleanup error:", err));
      }
      document.head.removeChild(style);
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) return;

      // GUARD: Check state to prevent crashes from double-starting
      const state = scannerRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.STARTING) {
        return;
      }

      setIsScanning(true);
      setResult(null);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleCheckIn(decodedText);
          stopScanner(); // Stop immediately on success
        },
        () => {} // Mute frame-by-frame errors for performance
      );
    } catch (error: any) {
      console.error("Scanner Error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // Only stop if it's actually running to avoid internal library crashes
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Scanner stop warning:", e);
      }
    }
    setIsScanning(false);
  };

  const handleCheckIn = async (qrHash: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      const { data: booking, error: fetchError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events ( id, title, created_by_id )
        `)
        .eq('qr_code_hash', qrHash)
        .single();

      if (fetchError || !booking) {
        setResult({ success: false, message: "Booking not found." });
        playSound(false);
        return;
      }

      if (booking.events?.created_by_id !== restaurantId) {
        setResult({ success: false, message: "Wrong venue." });
        playSound(false);
        return;
      }

      if (booking.checked_in_at) {
        setResult({ 
          success: false, 
          message: "Already checked in.",
          eventTitle: booking.events?.title,
          seatsCount: booking.seats_booked 
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
        .eq('id', booking.id)
        .is('checked_in_at', null);

      if (updateError) throw updateError;

      setResult({
        success: true,
        message: "Check-in successful!",
        seatsCount: booking.seats_booked,
        eventTitle: booking.events?.title,
      });
      playSound(true);

    } catch (error: any) {
      setResult({ success: false, message: "System error. Try again." });
      playSound(false);
    } finally {
      setProcessing(false);
    }
  };

  const playSound = (success: boolean) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(success ? 800 : 300, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) { /* Audio context might be blocked by browser */ }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Event Check-In</h2>
        <p className="text-muted-foreground text-sm">Scan QR codes to check-in attendees</p>
      </div>

      <div className="max-w-sm mx-auto relative">
        <div
          ref={containerRef}
          id="checkin-qr-reader"
          className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center relative z-0"
        >
          {!isScanning && !result && (
            <div className="text-center p-4">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
              <p className="text-xs text-muted-foreground">Ready to scan</p>
            </div>
          )}
        </div>

        {/* Square Scan Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-[250px] h-[250px] border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {!isScanning ? (
            <Button onClick={startScanner} className="flex-1" variant="gradient">
              <Camera className="w-4 h-4 mr-2" /> Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive" className="flex-1">
              <StopCircle className="w-4 h-4 mr-2" /> Stop Scanner
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            placeholder="Manual Booking ID"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" disabled={processing || !manualCode.trim()}>Check In</Button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`max-w-sm mx-auto p-6 rounded-xl text-center border ${
              result.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
            }`}
          >
            {result.success ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
            <p className={`text-lg font-bold ${result.success ? "text-green-500" : "text-red-500"}`}>{result.message}</p>
            {result.eventTitle && <p className="text-muted-foreground mt-1">{result.eventTitle}</p>}
            {result.seatsCount && (
              <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" /> <span>{result.seatsCount} seats</span>
              </div>
            )}
            <Button variant="outline" className="mt-6 w-full" onClick={() => { setResult(null); startScanner(); }}>Scan Next</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
