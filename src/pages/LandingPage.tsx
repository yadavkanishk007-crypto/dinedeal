import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { getLandingTheme, loadLandingTheme, type LandingTheme } from "@/data/landingThemes";

const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
};

const LandingHero = ({ theme, isInstallable, promptInstall }: { theme: LandingTheme; isInstallable: boolean; promptInstall: () => void }) => (
  <>
      <main className="container py-12 md:py-24 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} className="text-left">
            {theme.eyebrow && <p className="landing-eyebrow mb-4 font-semibold tracking-wide text-[#626B33]">✦ {theme.eyebrow} ✦</p>}
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#555D28] leading-tight mb-6 tracking-tight">
              {theme.headline} <span className="text-[#E2871A]">{theme.highlight}</span>
            </h1>
            <p className="text-lg text-[#3D3E24] mb-8 max-w-lg font-medium leading-relaxed">
              {theme.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/explore">
                <Button className="bg-[#E2871A] hover:bg-[#C17013] text-white rounded-2xl shadow-lg border-0 transition-all duration-300 font-bold px-8 py-6 text-lg gap-2">
                  {theme.primaryLabel} <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" className="border-[#626B33] text-[#626B33] hover:bg-[#626B33]/10 rounded-2xl transition-all duration-300 font-bold px-8 py-6 text-lg">
                  Explore Restaurants
                </Button>
              </Link>
            </div>
            {isInstallable && (
              <motion.div
                className="mt-8 p-5 rounded-2xl bg-[#F3ECE0] border-2 border-[#D9CDBB]/70 shadow-sm relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Background sun watermark */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none text-[#E2871A]">
                  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                  </svg>
                </div>
                <p className="text-sm font-serif font-bold text-[#555D28] mb-2">📱 Get the best experience</p>
                <Button 
                  onClick={promptInstall} 
                  className="bg-[#626B33] hover:bg-[#4F5429] text-white rounded-xl shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install DineDeal App
                </Button>
              </motion.div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            {theme.festive && <div className="diwali-halo" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>}
            {theme.festive && <div className="diwali-diyas" aria-hidden="true"><span>🪔</span><span>🪔</span></div>}
            <motion.img
              src={theme.heroImage}
              alt={theme.heroAlt}
              className="w-full max-w-lg mx-auto mix-blend-multiply opacity-95"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </main>

  </>
);

const LandingFooter = () => (
  <>
      <footer className="container py-8 border-t border-[#D9CDBB]/70 mt-auto text-center text-sm text-[#4F5425] flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <span>© {new Date().getFullYear()} DineDeal. All rights reserved.</span>
        <div className="flex items-center gap-6 font-medium">
          <Link to="/privacy" className="hover:text-[#E2871A] transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#E2871A] transition-colors">Terms of Service</Link>
          <Link to="/help" className="hover:text-[#E2871A] transition-colors">FAQs</Link>
        </div>
      </footer>

  </>
);

const LandingPage = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [theme, setTheme] = useState(getLandingTheme);

  useEffect(() => {
    let mounted = true;
    loadLandingTheme().then((loaded) => { if (mounted) setTheme(loaded); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`landing-surface min-h-screen bg-[#FCFAF5] relative overflow-hidden flex flex-col ${theme.festive ? "landing-diwali" : ""}`}>
      {/* Decorative top border in Madhubani style */}
      <div className="w-full h-3 bg-[#626B33] relative overflow-hidden flex z-50">
        <svg className="w-full h-full" width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-ethnic-border" width="20" height="12" patternUnits="userSpaceOnUse">
              {/* Grain/wheat stalks symbol in light cream */}
              <line x1="10" y1="2" x2="10" y2="10" stroke="#F6F3EB" strokeWidth="1" />
              <circle cx="10" cy="2" r="1.2" fill="#F6F3EB" />
              <path d="M7 4 C 8 3, 9 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M13 4 C 12 3, 11 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M7 7 C 8 6, 9 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M13 7 C 12 6, 11 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              {/* Orange floral dot */}
              <circle cx="20" cy="6" r="2.2" fill="#E2871A" />
            </pattern>
          </defs>
          <rect width="100%" height="12" fill="url(#landing-ethnic-border)" />
        </svg>
      </div>

      {/* Decorative background watermark sun and mandala */}
      <div className="absolute top-24 -left-12 opacity-[0.03] pointer-events-none text-[#E2871A] z-0">
        <svg className="w-64 h-64" style={{ animation: 'spin 40s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v22M1 12h22M4.22 4.22l15.56 15.56M4.22 19.78L19.78 4.22" />
        </svg>
      </div>
      <div className="absolute bottom-16 -right-12 opacity-[0.03] pointer-events-none text-[#E2871A] z-0">
        <svg className="w-80 h-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      </div>

      <header className="container py-6 flex items-center justify-between relative z-10">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          {isInstallable && (
            <Button 
              variant="outline" 
              onClick={promptInstall} 
              className="gap-2 border-[#626B33] text-[#626B33] hover:bg-[#626B33]/10"
            >
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}
          <Link to="/auth">
            <Button variant="ghost" className="text-[#626B33] hover:text-[#4F5429] hover:bg-[#626B33]/5 font-bold">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-[#E2871A] hover:bg-[#C17013] text-white shadow-md rounded-xl font-bold px-4 py-2">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <LandingHero theme={theme} isInstallable={isInstallable} promptInstall={promptInstall} />

      <LandingFooter />

      {/* Decorative bottom border in Madhubani style */}
      <div className="w-full h-3 bg-[#626B33] relative overflow-hidden flex z-50">
        <svg className="w-full h-full" width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="12" fill="url(#landing-ethnic-border)" />
        </svg>
      </div>
    </div>
  );
};

export default LandingPage;
