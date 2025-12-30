import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Download, Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface RestaurantQRCodeProps {
  restaurantId: string;
  restaurantName: string;
  upiId?: string;
}

const RestaurantQRCode = ({ restaurantId, restaurantName, upiId }: RestaurantQRCodeProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate the payment URL that links to the Pay page
  const paymentUrl = `${window.location.origin}/pay?restaurant=${restaurantId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Payment link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("restaurant-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      
      if (ctx) {
        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, 400, 400);
        
        // Download
        const link = document.createElement("a");
        link.download = `${restaurantName.replace(/\s+/g, "-")}-QR.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    
    toast({
      title: "QR Downloaded",
      description: "Print and display at your restaurant",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay at ${restaurantName}`,
          text: `Scan to pay at ${restaurantName} and get exclusive discounts!`,
          url: paymentUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 text-center">
          Payment QR Code
        </h3>
        
        <p className="text-sm text-muted-foreground text-center mb-6">
          Display this QR code at your restaurant. Customers can scan to pay and get discounts.
        </p>

        {/* QR Code */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              id="restaurant-qr-code"
              value={paymentUrl}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/favicon.ico",
                x: undefined,
                y: undefined,
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
        </motion.div>

        {/* Restaurant Name Badge */}
        <div className="text-center mb-6">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
            {restaurantName}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQR}
            className="flex-col h-auto py-3"
          >
            <Download className="w-5 h-5 mb-1" />
            <span className="text-xs">Download</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-col h-auto py-3"
          >
            {copied ? (
              <Check className="w-5 h-5 mb-1 text-success" />
            ) : (
              <Copy className="w-5 h-5 mb-1" />
            )}
            <span className="text-xs">{copied ? "Copied" : "Copy Link"}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-col h-auto py-3"
          >
            <Share2 className="w-5 h-5 mb-1" />
            <span className="text-xs">Share</span>
          </Button>
        </div>

        {/* UPI ID Display */}
        {upiId && (
          <div className="mt-4 p-3 rounded-lg bg-secondary text-center">
            <p className="text-xs text-muted-foreground mb-1">Your UPI ID</p>
            <p className="font-mono text-sm text-foreground">{upiId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantQRCode;