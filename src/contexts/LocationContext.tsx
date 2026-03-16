import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationState {
  city: string | null;
  coordinates: Coordinates | null;
  exactAddress: string | null;
  isLoading: boolean;
  detectLocation: () => Promise<void>;
  setLocationManually: (city: string, coords?: Coordinates, address?: string) => void;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [city, setCity] = useState<string | null>(() => localStorage.getItem("user_city"));
  const [coordinates, setCoordinates] = useState<Coordinates | null>(() => {
    const saved = localStorage.getItem("user_coordinates");
    return saved ? JSON.parse(saved) : null;
  });
  const [exactAddress, setExactAddress] = useState<string | null>(() => localStorage.getItem("user_address"));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (city) localStorage.setItem("user_city", city);
    if (coordinates) localStorage.setItem("user_coordinates", JSON.stringify(coordinates));
    if (exactAddress) localStorage.setItem("user_address", exactAddress);
  }, [city, coordinates, exactAddress]);

  const setLocationManually = (newCity: string, newCoords?: Coordinates, newAddress?: string) => {
    setCity(newCity);
    if (newCoords) setCoordinates(newCoords);
    if (newAddress) setExactAddress(newAddress);
  };

  const detectLocation = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        try {
          let detectedCity = "";
          let formattedAddress = "";
          
          try {
            // Primary: Free reverse geocoding using OpenStreetMap Nominatim API via Photon
            const response = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const props = data.features[0].properties;
              detectedCity = props.city || props.town || props.village || props.county || props.state;
              formattedAddress = [props.name, props.street, detectedCity].filter(Boolean).join(", ");
            }
          } catch (e) {
            console.warn("Photon API failed, trying fallback...");
          }

          // Fallback: If Photon failed or returned no city, use regular Nominatim
          if (!detectedCity) {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'DineDeal App v1' // Nominatim requires User-Agent
                }
              });
              const data = await response.json();
              
              if (data && data.address) {
                detectedCity = data.address.city || data.address.town || data.address.village || data.address.district || data.address.state;
                formattedAddress = data.display_name;
              }
            } catch (e) {
              console.warn("Nominatim API fallback failed...");
            }
          }
          
          if (detectedCity) {
            setCity(detectedCity);
            setExactAddress(formattedAddress || detectedCity);
            toast.success(`Location set to ${detectedCity}`);
          } else {
            toast.error("Could not determine your city from coordinates.");
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          toast.error("Failed to determine location details.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get your location. Please check your permissions.");
        setIsLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <LocationContext.Provider value={{ city, coordinates, exactAddress, isLoading, detectLocation, setLocationManually }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
