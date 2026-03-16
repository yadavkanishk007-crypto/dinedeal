import React, { useState, useEffect } from "react";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LocationSelector() {
  const { city, detectLocation, setLocationManually, isLoading } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Switching to Nominatim API directly as Photon struggles with Indian cities
        // countrycodes=in heavily restricts search to India
        // featuretype=city restricts to cities/towns
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&countrycodes=in&limit=5`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DineDeal App v1' // Nominatim requires User-Agent
            }
          }
        );
        const data = await response.json();
        
        // Filter and format results
        const formattedResults = data.map((item: any) => ({
          name: item.name || item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name
        })).filter((item: any) => item.name); // only keep if name exists

        setSearchResults(formattedResults);
      } catch (error) {
        console.error("Error searching cities:", error);
      } finally {
        setIsSearching(false);
      }
    }, 800); // 800ms debounce to respect Nominatim limits

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectCity = (feature: any) => {
    const coords = {
      lat: feature.lat,
      lng: feature.lng,
    };
    
    // Fallback if state is missing
    const formattedAddress = [feature.name, feature.state].filter(Boolean).join(", ");
    
    setLocationManually(feature.name, coords, formattedAddress);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleDetectLocation = async () => {
    await detectLocation();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-orange-50 text-orange-600">
          <MapPin className="h-4 w-4" />
          <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
            {city || "Select Location"}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle>Select your location</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-3 h-12 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            onClick={handleDetectLocation}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
            <span className="font-medium text-base">Detect my current location</span>
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for your city..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="max-h-[300px] overflow-y-auto w-full">
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-1">
                {searchResults.map((feature, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors flex flex-col items-start focus:outline-none focus:bg-gray-100"
                    onClick={() => handleSelectCity(feature)}
                  >
                    <span className="font-semibold text-gray-900">{feature.name}</span>
                    <span className="text-sm text-gray-500">
                      {[feature.state, feature.country].filter(Boolean).join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 3 && !isSearching ? (
              <div className="text-center p-4 text-gray-500">
                No cities found. Try a different search.
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
