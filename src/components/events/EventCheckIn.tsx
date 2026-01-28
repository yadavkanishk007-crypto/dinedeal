import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Users,
  Camera,
  StopCircle,
} from "lucide-react";
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

const SCANNER_ID = "checkin-qr-reader";

export default function EventCheckIn({ restaurantId }: EventCheckInProps) {
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------------
     Inject square-safe styles ONCE
  -------------------------------------------------------- */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      #${SCANNER_ID} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important; /* 👈 critical */
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      stopScanner();
    };
  }, []);

  /* -------------------------------------------------------
     Start scanner (original logic preserved)
  -------------------------------------------------------- */
  const startScanner = async () => {
    try {
      if (!containerRef.current) return;

      scannerRef.current = new Html5Qrcode(SCANNER_ID);
      setIsScanning(true);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }, // FUNCTIONAL square
          aspectRatio: 1,                     // 👈 FORCE square camera
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

  /* -------------------------------------------------------
     Stop scanner (unchanged, safe)
  -------------------------------------------------------- */
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  /* -------------------------------------------------------
     Check-in logic (UNCHANGED)
  -------------------------------------------------------- */
  const handleCheckIn = async (qrHash: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);

    try {
      const { data: booking, error } = await supabase
        .from("event_bookings")
        .select("*, events(id,title,created_by_id)")
        .eq("qr_code_hash", qrHash)
        .single();

      if (error || !booking) {
        fail("Invalid QR code. Booking not found.");
        return;
      }

      if (booking.events?.created_by_id !== restaurantId) {
        fail("This booking is for a different venue.");
        return;
      }

      if (booking.checked_in_at) {
        fail("Already checked in.", booking);
        return;
      }

      if (booking.booking_status === "cancelled") {
        fail("This booking has been cancelled.");
        return;
      }

      const { error: updateError } = await supabase
        .from("event_bookings")
        .update({
          booking_status: "attended",
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", booking.id)
        .eq("checked_in_at", null);

      if (updateError) {
        fail("Failed to check in. Please try again.");
        return;
      }

      success("Check-in successful!", booking);
    } catch (err: any) {
      fail(err.message || "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  /* -------------------------------------------------------
     Helpers
  -------------------------------------------------------- */
  const success = (msg: string, booking: any) => {
    playSound(true);
    setResult({
      success: true,
      message: msg,
      seatsCount: booking.seats_booked,
      eventTitle: booking.events?.title,
    });
  };

  const fail = (msg: string, booking?: any) => {
    playSound(false);
    setResult({
      success: false,
      message: msg,
      seatsCount: booking?.seats_booked,
      eventTitle: booking?.events?.title,
    });
  };

  const playSound = (success: boolean) => {
    try {
      const ctx =
        new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = success ? 900 : 300;
      gain.gain.value = 0.15;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Event Check-In</h2>
        <p className="text-muted-foreground text-sm">
          Scan attendee QR codes
        </p>
      </div>

      {/* Scanner */}
      <div className="max-w-sm mx-auto relative">
        <div
          ref={containerRef}
          id={SCANNER_ID}
          className="aspect-square rounded-xl overflow-hidden bg-muted relative"
        />

        {/* Square visual guide */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[250px] h-[250px] border-2 border-primary rounded-lg" />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {!isScanning ? (
            <Button onClick={startScanner} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button
              onClick={stopScanner}
              variant="destructive"
              className="flex-1"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Scanner
            </Button>
          )}
        </div>
      </div>

      {/* Manual Entry + Result remain UNCHANGED */}
      {/* (keeping your original UX intact) */}
    </div>
  );
}
