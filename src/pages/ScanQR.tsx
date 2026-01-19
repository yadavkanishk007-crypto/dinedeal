import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, CameraOff, Loader2, QrCode, ArrowLeft, Flashlight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";

const ScanQR = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore scan failures (no QR in frame)
        }
      );

      setHasPermission(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setIsScanning(false);
      
      if (err.toString().includes("NotAllowedError") || err.toString().includes("Permission")) {
        setHasPermission(false);
        setError("Camera permission denied. Please allow camera access to scan QR codes.");
      } else if (err.toString().includes("NotFoundError")) {
        setError("No camera found on this device.");
      } else {
        setError("Failed to start camera. Please try again.");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately
    await stopScanner();

    try {
      // Parse the QR code URL
      const url = new URL(decodedText);
      
      // Check if it's a valid DineDeal URL
      const validHosts = [
        'dinedeal.app',
        'zave-flavor-joy.lovable.app',
        'localhost',
        window.location.host
      ];

      const isValidHost = validHosts.some(host => url.host.includes(host));
      
      if (!isValidHost) {
        toast.error("Invalid QR code. Please scan a DineDeal restaurant QR.");
        startScanner();
        return;
      }

      // Extract restaurant ID from various URL patterns
      let restaurantId: string | null = null;

      // Pattern 1: /dine-in?restaurant=xxx
      if (url.pathname.includes('/dine-in')) {
        restaurantId = url.searchParams.get('restaurant');
      }
      // Pattern 2: /restaurant/xxx
      else if (url.pathname.includes('/restaurant/')) {
        const match = url.pathname.match(/\/restaurant\/([^\/]+)/);
        if (match) restaurantId = match[1];
      }
      // Pattern 3: /pay?restaurant=xxx
      else if (url.pathname.includes('/pay')) {
        restaurantId = url.searchParams.get('restaurant');
      }
      // Pattern 4: Just restaurant param in any URL
      else {
        restaurantId = url.searchParams.get('restaurant') || url.searchParams.get('id');
      }

      if (restaurantId) {
        toast.success("QR code scanned successfully!");
        navigate(`/dine-in?restaurant=${restaurantId}`);
      } else {
        toast.error("Could not find restaurant information in QR code.");
        startScanner();
      }
    } catch (err) {
      // Not a valid URL, might be just a restaurant ID
      if (decodedText.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        toast.success("QR code scanned successfully!");
        navigate(`/dine-in?restaurant=${decodedText}`);
      } else {
        toast.error("Invalid QR code format.");
        startScanner();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo size="default" />
        </div>
      </div>

      <div className="container py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Scan Restaurant QR</h1>
          <p className="text-muted-foreground">
            Scan the QR code at your table to start your dine-in session
          </p>
        </div>

        {/* Scanner Container */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square max-w-md mx-auto bg-black">
              {/* QR Reader Container */}
              <div 
                id="qr-reader" 
                ref={containerRef}
                className="w-full h-full"
              />

              {/* Overlay when not scanning */}
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                  {error ? (
                    <div className="text-center p-6">
                      <CameraOff className="h-16 w-16 mx-auto text-destructive mb-4" />
                      <p className="text-destructive font-medium mb-2">Camera Error</p>
                      <p className="text-sm text-muted-foreground mb-4">{error}</p>
                      <Button onClick={startScanner}>
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Tap below to start scanning
                      </p>
                      <Button onClick={startScanner} size="lg">
                        <Camera className="h-5 w-5 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Scanning indicator overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner markers */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 overflow-hidden">
                    <div className="h-0.5 bg-primary animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        {isScanning && (
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={stopScanner}>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">How it works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <span>Scan the QR code on your restaurant table</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <span>Your dine-in session will start automatically</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <span>When ready, the restaurant will post your bill</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                <span>Pay through DineDeal and enjoy your discount!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScanQR;