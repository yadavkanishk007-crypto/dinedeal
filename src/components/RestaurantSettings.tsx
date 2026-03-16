import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Camera, 
  X, 
  Upload, 
  Building2, 
  CreditCard, 
  Bell, 
  BellRing, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  FileText, 
  ChevronRight,
  Smartphone,
  Volume2,
  VolumeX,
  Save,
  Mail,
  Sparkles,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  is_active: boolean;
  is_approved: boolean;
  image_url: string | null;
  phone?: string | null;
  email?: string | null;
  open_hours?: string | null;
  upi_id?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_account_holder?: string | null;
  // [STEP 1: Added Interface Fields]
  is_event_organiser?: boolean;
  organiser_type?: "restaurant" | "event_group";
  latitude?: number;
  longitude?: number;
}

interface RestaurantSettingsProps {
  restaurant: Restaurant;
  setRestaurant: (r: Restaurant) => void;
}

const RestaurantSettings = ({ restaurant, setRestaurant }: RestaurantSettingsProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the notification preferences hook
  const { preferences, updatePreferences } = useNotificationPreferences(restaurant?.id);
  const { testSound } = useNotificationSound();
  
  // Basic info state
  const [formData, setFormData] = useState({
    name: restaurant?.name || "",
    cuisine: restaurant?.cuisine || "",
    address: restaurant?.address || "",
    phone: restaurant?.phone || "",
    email: restaurant?.email || "",
    open_hours: restaurant?.open_hours || "",
  });
  
  // Banking info state
  const [bankingData, setBankingData] = useState({
    upi_id: restaurant?.upi_id || "",
    bank_account_number: restaurant?.bank_account_number || "",
    bank_ifsc: restaurant?.bank_ifsc || "",
    bank_account_holder: restaurant?.bank_account_holder || "",
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    hideRevenue: false,
    twoFactorEnabled: false,
  });
  
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(restaurant?.image_url || null);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingBanking, setSavingBanking] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  // [STEP 2: Added Local State]
  const [eventEnabled, setEventEnabled] = useState(
    restaurant?.is_event_organiser ?? false
  );
  useEffect(() => {
  setEventEnabled(restaurant?.is_event_organiser ?? false);
}, [restaurant?.is_event_organiser]);
  // Load notification permission status
  useEffect(() => {
    if ("Notification" in window) {
      setBrowserNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${restaurant.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("restaurant-images")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ image_url: publicUrl })
        .eq("id", restaurant.id);

      if (updateError) throw updateError;

      setImagePreview(publicUrl);
      setRestaurant({ ...restaurant, image_url: publicUrl });
      toast({ title: "Image uploaded", description: "Your restaurant image has been updated" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!restaurant) return;

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ image_url: null })
        .eq("id", restaurant.id);

      if (error) throw error;

      setImagePreview(null);
      setRestaurant({ ...restaurant, image_url: null });
      toast({ title: "Image removed", description: "Your restaurant image has been removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateBasicInfo = async () => {
    if (!restaurant) return;
    setSavingBasic(true);

    try {
      let lat = restaurant.latitude;
      let lng = restaurant.longitude;

      // Try background geocoding if address is provided
      if (formData.address) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'DineDeal App v1'
              }
            }
          );
          const data = await response.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (geocodeError) {
          console.error("Geocoding silently failed:", geocodeError);
          // Non-blocking, continue saving basic info even if geocoding fails
        }
      }

      const updatePayload = {
        ...formData,
        ...(lat && lng ? { latitude: lat, longitude: lng } : {})
      };

      const { error } = await supabase
        .from("restaurants")
        .update(updatePayload)
        .eq("id", restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, ...updatePayload } as Restaurant);
      toast({ title: "Settings Updated", description: "Information and location successfully saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingBasic(false);
    }
  };

  const handleManualGeocode = async () => {
    if (!formData.address) {
      toast({ title: "Address Required", description: "Please enter your address first.", variant: "destructive" });
      return;
    }
    setSavingBasic(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DineDeal App v1'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        toast({ title: "Success", description: "Map pin updated successfully!" });
      } else {
        toast({ title: "Not Found", description: "Could not find coordinates for this address on the map.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch map coordinates.", variant: "destructive" });
    } finally {
      setSavingBasic(false);
    }
  };

  const handleUpdateBankingInfo = async () => {
    if (!restaurant) return;
    setSavingBanking(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update(bankingData)
        .eq("id", restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, ...bankingData });
      toast({ title: "Banking Updated", description: "Your banking information has been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingBanking(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Not Supported", description: "Browser notifications are not supported", variant: "destructive" });
      return;
    }

    const permission = await Notification.requestPermission();
    setBrowserNotificationsEnabled(permission === "granted");
    updatePreferences({ browserNotifications: permission === "granted" });

    if (permission === "granted") {
      toast({ title: "Notifications Enabled", description: "You'll receive alerts for new bookings" });
      // Test notification
      new Notification("DineDeal", {
        body: "粕 Notifications enabled! You'll hear a bell for new bookings.",
        icon: "/favicon.png"
      });
    }
  };

  const playTestSound = () => {
    testSound();
    toast({ title: "粕 Sound Test", description: "This is how notification sounds will play" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
          >
            {/* Image Upload Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Restaurant Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Restaurant"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur flex items-center gap-2 hover:bg-background transition-colors text-sm font-medium"
                        disabled={uploading}
                      >
                        <Camera className="w-4 h-4" />
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                    >
                      {uploading ? (
                        <>
                          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">Upload Image</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Details */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Restaurant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Restaurant Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cuisine Type</label>
                    <Input
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleManualGeocode} 
                      disabled={savingBasic || !formData.address}
                      className="border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Find on Map
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Phone Number</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="restaurant@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Opening Hours</label>
                  <Input
                    value={formData.open_hours}
                    onChange={(e) => setFormData({ ...formData, open_hours: e.target.value })}
                    placeholder="11:00 AM - 11:00 PM"
                  />
                </div>
                <Button variant="gradient" onClick={handleUpdateBasicInfo} disabled={savingBasic}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingBasic ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* [STEP 3: Added Events Settings UI] */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Events & Experiences
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      Host Events at this Venue
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enable this if you host live music, DJ nights, comedy shows, workshops,
                      or any ticketed events.
                    </p>
                  </div>

                  <Switch
                    checked={eventEnabled}
                    onCheckedChange={setEventEnabled}
                  />
                </div>

                <Button
                  variant="gradient"
                  disabled={eventEnabled === restaurant.is_event_organiser || !restaurant.is_approved}
                  onClick={async () => {
                    const { error } = await supabase
                      .from("restaurants")
                      .update({
                        is_event_organiser: eventEnabled,
                        organiser_type: restaurant.organiser_type??"restaurant",
                      })
                      .eq("id", restaurant.id);

                    if (error) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                      return;
                    }

                    setRestaurant({
                      ...restaurant,
                      is_event_organiser: eventEnabled,
                      organiser_type: "restaurant",
                    });

                    toast({
                      title: eventEnabled ? "Events Enabled 🎉" : "Events Disabled",
                      description: eventEnabled
                        ? "You can now create and manage events from your dashboard."
                        : "Event features have been turned off.",
                    });
                  }}
                >
                  Save Event Settings
                </Button>
              </CardContent>
            </Card>

          </motion.div>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                  <p className="text-sm text-muted-foreground">
                    諜 Your payment details are securely encrypted. Settlements are processed weekly to your linked bank account.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">UPI ID</label>
                  <Input
                    value={bankingData.upi_id}
                    onChange={(e) => setBankingData({ ...bankingData, upi_id: e.target.value })}
                    placeholder="yourname@upi"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Bank Account Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Account Holder Name</label>
                      <Input
                        value={bankingData.bank_account_holder}
                        onChange={(e) => setBankingData({ ...bankingData, bank_account_holder: e.target.value })}
                        placeholder="As per bank records"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm text-muted-foreground">Account Number</label>
                        <Input
                          value={bankingData.bank_account_number}
                          onChange={(e) => setBankingData({ ...bankingData, bank_account_number: e.target.value })}
                          placeholder="XXXXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">IFSC Code</label>
                        <Input
                          value={bankingData.bank_ifsc}
                          onChange={(e) => setBankingData({ ...bankingData, bank_ifsc: e.target.value.toUpperCase() })}
                          placeholder="SBIN0001234"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="gradient" onClick={handleUpdateBankingInfo} disabled={savingBanking}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingBanking ? "Saving..." : "Save Banking Details"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sound Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">SOUND ALERTS</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Reservation Sound</p>
                        <p className="text-xs text-muted-foreground">Play bell sound for new table bookings</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.reservationSound} 
                      onCheckedChange={(checked) => updatePreferences({ reservationSound: checked })} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Transaction Sound</p>
                        <p className="text-xs text-muted-foreground">Play sound for new payments</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.transactionSound} 
                      onCheckedChange={(checked) => updatePreferences({ transactionSound: checked })} 
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={playTestSound} className="w-full">
                    <BellRing className="w-4 h-4 mr-2" />
                    Test Notification Sound
                  </Button>
                </div>

                {/* Browser Notifications */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">BROWSER NOTIFICATIONS</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Push Notifications</p>
                        <p className="text-xs text-muted-foreground">Receive alerts even when browser is minimized</p>
                      </div>
                    </div>
                    <Switch 
                      checked={browserNotificationsEnabled} 
                      onCheckedChange={() => {
                        if (!browserNotificationsEnabled) {
                          requestNotificationPermission();
                        } else {
                          toast({ title: "Info", description: "Disable notifications in browser settings" });
                        }
                      }} 
                    />
                  </div>
                </div>

                {/* Email Alerts */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">EMAIL ALERTS</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Reservation Email Alerts</p>
                        <p className="text-xs text-muted-foreground">Receive email for new table bookings</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.emailAlerts} 
                      onCheckedChange={(checked) => updatePreferences({ emailAlerts: checked })} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
          >
            {/* Security Status */}
            <Card className="border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-success/20 to-success/10 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-foreground">Account Protected</h2>
                    <p className="text-sm text-muted-foreground">Your restaurant account is secure</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Privacy Settings */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {privacySettings.hideRevenue ? (
                        <EyeOff className="w-5 h-5 text-primary" />
                      ) : (
                        <Eye className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Hide Revenue Figures</p>
                      <p className="text-xs text-muted-foreground">Mask earnings on dashboard</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.hideRevenue} 
                    onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, hideRevenue: checked }))} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Options */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Security Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    icon: Key,
                    label: "Change Password",
                    description: "Update your account password",
                    action: () => window.location.href = "/reset-password",
                  },
                  {
                    icon: Lock,
                    label: "Two-Factor Authentication",
                    description: "Add an extra layer of security",
                    comingSoon: true,
                  },
                  {
                    icon: FileText,
                    label: "Privacy Policy",
                    description: "Read our privacy policy",
                    action: () => window.open("https://dinedeal-tau.vercel.app/RestaurantPrivacyPolicy", "_blank"),
                  },
                  {
                    icon: FileText,
                    label: "Terms of Service",
                    description: "Read our terms of service",
                    action: () => window.open("https://dinedeal-tau.vercel.app/RestaurantTermsCondition", "_blank"),
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`p-4 rounded-xl bg-secondary flex items-center justify-between ${!item.comingSoon ? "cursor-pointer hover:bg-secondary/80" : "opacity-60"} transition-colors`}
                      onClick={!item.comingSoon ? item.action : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{item.label}</p>
                            {item.comingSoon && (
                              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Data Info */}
            <Card className="border-border/50 bg-secondary/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  白 Your data is encrypted and stored securely. We never share your business information 
                  with third parties without your consent.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantSettings;
