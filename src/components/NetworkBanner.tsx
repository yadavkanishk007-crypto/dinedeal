import { useEffect, useState } from "react";

export default function NetworkBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOffline = () => setShow(true);
    const handleOnline = () => setShow(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Optional: Force banner manually (for ISP notice)
    const forceBanner = false; // set true if needed temporarily
    if (forceBanner) setShow(true);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black text-center py-2 z-50 text-sm font-medium">
      ⚠️ Some networks may experience temporary connectivity issues. 
      If login fails, try switching network or using 1.1.1.1 DNS.
    </div>
  );
}
