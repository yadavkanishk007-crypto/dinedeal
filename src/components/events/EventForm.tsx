import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, MapPin, Users, IndianRupee, 
  Image as ImageIcon, X, Plus, Trash2, Ticket 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface TicketTier {
  name: string;
  price: number;
  capacity: number;
}

interface EventFormProps {
  restaurantId: string;
  venueName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function EventForm({ 
  restaurantId, 
  venueName = "", 
  onSuccess, 
  onCancel,
  initialData 
}: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.cover_image || "");
  
  // Tiers State: Initializes with existing tiers or a default General pass
  const [tiers, setTiers] = useState<TicketTier[]>(
    initialData?.ticket_tiers || [{ name: "General Admission", price: 0, capacity: 100 }]
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    event_date: initialData?.event_date || "",
    start_time: initialData?.start_time || "",
    end_time: initialData?.end_time || "",
    city: initialData?.city || "Jhansi",
    venue_name: initialData?.venue_name || venueName,
    is_paid: initialData?.is_paid || false,
    booking_deadline: initialData?.booking_deadline || "",
  });

  const addTier = () => setTiers([...tiers, { name: "", price: 0, capacity: 0 }]);
  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
  const updateTier = (index: number, field: keyof TicketTier, value: string | number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const totalCapacity = tiers.reduce((sum, tier) => sum + (Number(tier.capacity) || 0), 0);
  const minPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.price)) : 0;

  const uploadImage = async () => {
    if (!imageFile) return initialData?.cover_image || null;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `event-${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('restaurant-images').upload(filePath, imageFile);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('restaurant-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    if (!formData.title || !formData.event_date || tiers.some(t => !t.name)) {
      toast({ title: "Validation Error", description: "Ensure all tiers have names and required fields are filled.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const coverImage = await uploadImage();
      const eventData = {
        created_by_id: restaurantId,
        title: formData.title,
        description: formData.description,
        cover_image: coverImage,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        city: formData.city,
        venue_name: formData.venue_name,
        is_paid: formData.is_paid,
        ticket_tiers: tiers, // New JSONB field
        ticket_price: minPrice, // Still used for "Starting from" display
        total_seats: totalCapacity,
        remaining_seats: totalCapacity,
        booking_deadline: formData.booking_deadline || null,
        status,
      };

      const { error } = initialData?.id 
        ? await supabase.from('events').update(eventData).eq('id', initialData.id)
        : await supabase.from('events').insert([eventData]);

      if (error) throw error;
      toast({ title: "Success", description: `Event ${status} successfully!` });
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form className="space-y-6 p-6 bg-card rounded-xl border max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{initialData?.id ? "Edit Event" : "Create New Event"}</h2>
      </div>

      <div className="space-y-4">
        <Label>Event Details</Label>
        <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold">Ticket Tiers & Pricing</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTier}><Plus className="w-4 h-4 mr-2" /> Add Tier</Button>
        </div>

        <AnimatePresence>
          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end bg-secondary/10 p-3 rounded-lg border">
              <div className="col-span-5 space-y-1">
                <Label className="text-xs text-muted-foreground">Pass Name (e.g. VIP)</Label>
                <Input value={tier.name} onChange={e => updateTier(index, 'name', e.target.value)} />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                <Input type="number" value={tier.price} onChange={e => updateTier(index, 'price', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Seats</Label>
                <Input type="number" value={tier.capacity} onChange={e => updateTier(index, 'capacity', parseInt(e.target.value) || 0)} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeTier(index)} disabled={tiers.length === 1}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </AnimatePresence>

        <div className="flex justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm font-medium">
          <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Capacity: {totalCapacity}</span>
          <span className="flex items-center gap-2"><Ticket className="w-4 h-4"/> Min Price: ₹{minPrice}</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Input type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
        <Input placeholder="Venue" value={formData.venue_name} onChange={e => setFormData({...formData, venue_name: e.target.value})} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={e => handleSubmit(e, 'draft')} disabled={isSubmitting}>Draft</Button>
        <Button type="button" className="flex-1" onClick={e => handleSubmit(e, 'published')} disabled={isSubmitting}>Publish</Button>
      </div>
    </motion.form>
  );
}
