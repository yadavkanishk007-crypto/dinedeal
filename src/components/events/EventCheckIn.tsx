import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle, XCircle, Users, Camera, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!containerRef.current) return;

      scannerRef.current = new Html5Qrcode("checkin-qr-reader");
      setIsScanning(true);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleCheckIn(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (error: any) {
      toast({
        title: "Camera Error",
        description: error.message || "Could not access camera",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCheckIn = async (qrHash: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);

    try {
      // Get the booking by QR hash
      const { data: booking, error: fetchError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events (
            id,
            title,
            created_by_id
          )
        `)
        .eq('qr_code_hash', qrHash)
        .single();

      if (fetchError || !booking) {
        setResult({
          success: false,
          message: "Invalid QR code. Booking not found.",
        });
        playSound(false);
        return;
      }

      // Verify this booking belongs to an event owned by this restaurant
      if (booking.events?.created_by_id !== restaurantId) {
        setResult({
          success: false,
          message: "This booking is for a different venue.",
        });
        playSound(false);
        return;
      }

      // Check if already checked in
      if (booking.checked_in_at) {
        setResult({
          success: false,
          message: `Already checked in at ${new Date(booking.checked_in_at).toLocaleTimeString()}`,
          seatsCount: booking.seats_booked,
          eventTitle: booking.events?.title,
        });
        playSound(false);
        return;
      }

      // Check if booking is cancelled
      if (booking.booking_status === 'cancelled') {
        setResult({
          success: false,
          message: "This booking has been cancelled.",
        });
        playSound(false);
        return;
      }

      // Perform check-in (atomic update)
      const { error: updateError } = await supabase
        .from('event_bookings')
        .update({
          booking_status: 'attended',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('checked_in_at', null); // Ensure still not checked in (atomic)

      if (updateError) {
        setResult({
          success: false,
          message: "Failed to check in. Please try again.",
        });
        playSound(false);
        return;
      }

      setResult({
        success: true,
        message: "Check-in successful!",
        seatsCount: booking.seats_booked,
        eventTitle: booking.events?.title,
      });
      playSound(true);

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred",
      });
      playSound(false);
    } finally {
      setProcessing(false);
    }
  };

  const playSound = (success: boolean) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (success) {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
    }

    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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
        <p className="text-muted-foreground text-sm">
          Scan attendee QR codes to check them in
        </p>
      </div>

      {/* Scanner */}
      <div className="max-w-sm mx-auto">
        <div
          ref={containerRef}
          id="checkin-qr-reader"
          className="aspect-square rounded-xl overflow-hidden bg-muted"
        />

        <div className="flex gap-3 mt-4">
          {!isScanning ? (
            <Button onClick={startScanner} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive" className="flex-1">
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Scanner
            </Button>
          )}
        </div>
      </div>

      {/* Manual Entry */}
      <div className="max-w-sm mx-auto">
        <p className="text-sm text-muted-foreground text-center mb-3">
          Or enter booking code manually
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            placeholder="Enter booking code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button type="submit" disabled={processing || !manualCode.trim()}>
            Check In
          </Button>
        </form>
      </div>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`max-w-sm mx-auto p-6 rounded-xl text-center ${
              result.success
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <p className={`text-lg font-bold ${result.success ? "text-green-500" : "text-red-500"}`}>
              {result.message}
            </p>
            {result.eventTitle && (
              <p className="text-muted-foreground mt-2">{result.eventTitle}</p>
            )}
            {result.seatsCount && (
              <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{result.seatsCount} {result.seatsCount === 1 ? 'seat' : 'seats'}</span>
              </div>
            )}
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setResult(null)}
            >
              Scan Next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Indicator */}
      {processing && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Verifying...
          </div>
        </div>
      )}
    </div>
  );
}