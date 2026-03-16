import React, { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const quirkyMessages = [
  "Oops! The internet left the chat. 🥲",
  "Did someone trip over the Wi-Fi cable? You're offline.",
  "No Wi-Fi, No Cry. Just kidding, please reconnect. 🦖",
  "Are you hiding in a cave? We can't reach the internet. 🦇",
  "Houston, we have a connection problem. 🚀",
  "Your internet connection is playing hide and seek. 🙈",
  "Connecting to the internet... using telepathy. Not working. 🧠"
];

export default function NetworkBanner() {
  const isOnline = useOnlineStatus();
  const [showIspWarning, setShowIspWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState(quirkyMessages[0]);

  // Handle generic ISP warnings (can be forced true temporarily if needed)
  useEffect(() => {
    const forceBanner = false; 
    if (forceBanner && isOnline) setShowIspWarning(true);
  }, [isOnline]);

  // Pick a random message when going offline
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
      setMessage(quirkyMessages[Math.floor(Math.random() * quirkyMessages.length)]);
    }
  }, [isOnline]);

  if (isOnline && !showIspWarning) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-[100] ${
            !isOnline ? "bg-orange-500" : "bg-yellow-500"
          } text-white shadow-md p-3 px-4 flex items-center justify-center sm:justify-between`}
        >
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3 max-w-4xl mx-auto">
            {!isOnline ? (
              <>
                <WifiOff className="h-5 w-5 animate-pulse shrink-0" />
                <p className="font-medium text-sm sm:text-base">{message}</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 shrink-0 text-black" />
                <p className="font-medium text-sm sm:text-base text-black">
                  ⚠️ Some networks may experience temporary connectivity issues. If login fails, try switching network or using 1.1.1.1 DNS.
                </p>
              </>
            )}
          </div>
          <button 
            onClick={() => setDismissed(true)} 
            className={`p-1 rounded-full transition-colors absolute right-2 sm:static ${
              !isOnline ? "hover:bg-orange-600" : "hover:bg-yellow-600 text-black"
            }`}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
