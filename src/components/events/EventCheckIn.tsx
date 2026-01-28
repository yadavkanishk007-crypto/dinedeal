import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Camera,
  StopCircle,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckInResult {
  success: boolean;
  message: string;
  seatsCount?: number;
  eventTitle?: string;
}

interface Props {
  restaurantId: string;
}

const SCANNER_ID = "checkin-qr-reader";

export default function EventCheckIn({ restaurantId }: Props) {
  const { toast } = useToast();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMounted = useRef(false);

  const [scannerActive, setScannerActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);

  /* -------------------------------------------------------
     Create scanner ONCE (React 18 StrictMode safe)
  -------------------------------------------------------- */
  useEffect(() => {
    if (scannerRef.current) return;

    scannerRef.current = new Html5Qrcode(SCANNER_ID);
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  /* -------------------------------------------------------
     Start scanner (Android + iOS safe)
  -------------------------------------------------------- */
  const startScanner = async () => {
    if (!scannerRef.current || scannerActive) return;

    try {
      setResult(null);
      setScannerActive(true);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          stopScanner();
          handleCheckIn(decodedText);
        },
        () => {
          // REQUIRED by html5-qrcode typings
          // Intentionally ignored to avoid noisy logs
        }
      );
    } catch (err) {
      setScannerActive(false);
      toast({
        title: "Camera Error",
        description:
          "Camera access failed. Use HTTPS and allow permissions.",
        variant: "destructive",
      });
    }
  };

  /* -------------------------------------------------------
     Stop scanner (NO clear() — critical)
  -------------------------------------------------------- */
  const stopScanner = async () => {
    if (!scannerRef.current || !scannerActive) return;

    try {
      await scannerRef.current.stop();
    } catch (_) {
      // ignore
    } finally {
      if (isMounted.current) {
        setScannerActive(false);
      }
    }
  };

  /* -------------------------------------------------------
     Check-in logic (atomic + safe)
  -------------------------------------------------------- */
  const handleCheckIn = async (qrHash: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase
        .from("event_bookings")
        .select("*, events(id,title,created_by_id)")
        .eq("qr_code_hash", qrHash)
        .single();

      if (error || !data) {
        fail("Booking not found");
        return;
      }

      if (data.events?.created_by_id !== restaurantId) {
        fail("Invalid venue");
        return;
      }

      if (data.checked_in_at) {
        fail("Already checked in", data);
        return;
      }

      const { error: updateError } = await supabase
        .from("event_bookings")
        .update({
          booking_status: "attended",
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .is("checked_in_at", null);

      if (updateError) throw updateError;

      success("Check-in successful!", data);
    } catch {
      fail("Database error");
    } finally {
      setProcessing(false);
    }
  };

  /* -------------------------------------------------------
     Helpers
  -------------------------------------------------------- */
  const success = (msg: string, data: any) => {
    beep(true);
    setResult({
      success: true,
      message: msg,
      seatsCount: data.seats_booked,
      eventTitle: data.events?.title,
    });
  };

  const fail = (msg: string, data?: any) => {
    beep(false);
    setResult({
      success: false,
      message: msg,
      seatsCount: data?.seats_booked,
      eventTitle: data?.events?.title,
    });
  };

  const beep = (ok: boolean) => {
    try {
      const ctx =
        new (window.AudioContext ||
          (window as any).webkitAudioContext)();

      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = ok ? 800 : 300;
      gain.gain.value = 0.1;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // audio restrictions – ignore
    }
  };

  const scanNext = () => {
    setResult(null);
    setTimeout(startScanner, 0);
  };

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Event Check-In</h2>
        <p className="text-muted-foreground text-sm">
          Scan QR codes to verify attendees
        </p>
      </div>

      {/* Scanner container NEVER unmounts */}
      <div className="max-w-sm mx-auto relative">
        <div
          id={SCANNER_ID}
          className={`aspect-square rounded-xl bg-muted border overflow-hidden transition-opacity
            ${scannerActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        />

        {!scannerActive && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="w-12 h-12 text-muted-foreground opacity-20" />
          </div>
        )}

        <div className="mt-4 flex gap-3">
          {!scannerActive ? (
            <Button className="flex-1" onClick={startScanner}>
              <Camera className="w-4 h-4 mr-2" /> Start Scanner
            </Button>
          ) : (
            <Button
              className="flex-1"
              variant="destructive"
              onClick={stopScanner}
            >
              <StopCircle className="w-4 h-4 mr-2" /> Stop
            </Button>
          )}
        </div>
      </div>

      {/* Manual check-in */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) handleCheckIn(manualCode.trim());
          setManualCode("");
        }}
        className="max-w-sm mx-auto flex gap-2"
      >
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Manual booking code"
        />
        <Button type="submit" disabled={processing}>
          Check
        </Button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`max-w-sm mx-auto p-6 rounded-xl text-center border
              ${
                result.success
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
          >
            {result.success ? (
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            )}

            <p className="text-lg font-bold">{result.message}</p>

            {result.eventTitle && (
              <p className="text-muted-foreground">
                {result.eventTitle}
              </p>
            )}

            {result.seatsCount && (
              <div className="flex justify-center gap-2 text-sm mt-2">
                <Users className="w-4 h-4" /> {result.seatsCount} seats
              </div>
            )}

            <Button className="w-full mt-4" onClick={scanNext}>
              Scan Next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
