import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, UtensilsCrossed, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
}

interface MenuManagerProps {
  restaurantId: string;
  isActivityProvider?: boolean;
}

const DEFAULT_CATEGORIES = ["Starters", "Main Course", "Desserts", "Beverages", "Specials"];
const ACTIVITY_CATEGORIES = ["Turfs / Slots", "Arcade Games", "Console Gaming", "VR Experience", "Food & Drinks", "Other Services"];

const MenuManager = ({ restaurantId, isActivityProvider = false }: MenuManagerProps) => {
  const categories = isActivityProvider ? ACTIVITY_CATEGORIES : DEFAULT_CATEGORIES;
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: isActivityProvider ? "Turfs / Slots" : "Main Course",
    is_veg: isActivityProvider ? false : true,
    is_available: true,
    start_time: "07:00 AM",
    end_time: "11:00 PM",
    slot_duration: "2",
    custom_duration: "5",
  });

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("category", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let descriptionVal = formData.description || "";
      if (isActivityProvider) {
        const durationVal = formData.slot_duration === "Custom" ? formData.custom_duration : formData.slot_duration;
        descriptionVal = JSON.stringify({
          start_time: formData.start_time,
          end_time: formData.end_time,
          slot_duration: durationVal,
          text: formData.description,
        });
      }

      const menuData = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: descriptionVal || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_veg: isActivityProvider ? false : formData.is_veg,
        is_available: formData.is_available,
      };

      if (editingId) {
        const { error } = await supabase
          .from("menu_items")
          .update(menuData)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Menu item updated!" });
      } else {
        const { error } = await supabase.from("menu_items").insert(menuData);
        if (error) throw error;
        toast({ title: "Menu item added!" });
      }

      resetForm();
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    let startTime = "07:00 AM";
    let endTime = "11:00 PM";
    let slotDuration = "2";
    let customDuration = "5";
    let textDescription = item.description || "";

    try {
      if (item.description) {
        const config = JSON.parse(item.description);
        if (config.start_time && config.end_time && config.slot_duration) {
          startTime = config.start_time;
          endTime = config.end_time;
          
          const standardDurations = ["1", "1.5", "2", "3", "4", "Full Day"];
          if (standardDurations.includes(config.slot_duration)) {
            slotDuration = config.slot_duration;
          } else {
            slotDuration = "Custom";
            customDuration = config.slot_duration;
          }
          
          textDescription = config.text || "";
        }
      }
    } catch (e) {
      // fallback
    }

    setFormData({
      name: item.name,
      description: textDescription,
      price: item.price.toString(),
      category: item.category,
      is_veg: item.is_veg,
      is_available: item.is_available,
      start_time: startTime,
      end_time: endTime,
      slot_duration: slotDuration,
      custom_duration: customDuration,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      setMenuItems(menuItems.filter((m) => m.id !== id));
      toast({ title: "Menu item deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleAvailability = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentValue })
        .eq("id", id);
      if (error) throw error;
      setMenuItems(menuItems.map((m) => (m.id === id ? { ...m, is_available: !currentValue } : m)));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: isActivityProvider ? "Turfs / Slots" : "Main Course",
      is_veg: isActivityProvider ? false : true,
      is_available: true,
      start_time: "07:00 AM",
      end_time: "11:00 PM",
      slot_duration: "2",
      custom_duration: "5",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((m) => m.category === cat);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Slots helper logic
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (isActivityProvider && restaurantId) {
      fetchReservations();
    }
  }, [isActivityProvider, restaurantId, selectedDate]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", selectedDate)
        .neq("status", "cancelled");

      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      console.error("Error fetching reservations in MenuManager:", err);
    }
  };

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  };

  const formatMinutes = (totalMinutes: number) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? "PM" : "AM";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    const hourStr = hours < 10 ? `0${hours}` : hours;
    return `${hourStr}:${minStr} ${modifier}`;
  };

  const generateSlots = (startTimeStr: string, endTimeStr: string, durationStr: string) => {
    const start = parseTime(startTimeStr);
    const end = parseTime(endTimeStr);
    
    if (durationStr === "Full Day") {
      return [`${startTimeStr} - ${endTimeStr} (Full Day)`];
    }
    
    const durationHours = parseFloat(durationStr) || 1;
    const step = durationHours * 60;
    const list = [];
    
    for (let current = start; current + step <= end; current += step) {
      const slotStart = formatMinutes(current);
      const slotEnd = formatMinutes(current + step);
      list.push(`${slotStart} - ${slotEnd}`);
    }
    return list;
  };

  const renderItemDescription = (item: MenuItem) => {
    try {
      if (item.description) {
        const config = JSON.parse(item.description);
        if (config.start_time && config.end_time && config.slot_duration) {
          return (
            <div className="space-y-1 mt-1">
              {config.text && <p className="text-sm text-muted-foreground">{config.text}</p>}
              <p className="text-xs text-primary font-semibold">
                Slots: {config.start_time} - {config.end_time} ({config.slot_duration === "Full Day" ? "Full Day" : `${config.slot_duration} hr slots`})
              </p>
            </div>
          );
        }
      }
    } catch (e) {
      // not JSON
    }
    return item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null;
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">
          {isActivityProvider ? "Activities & Slots" : "Menu Management"}
        </h2>
        {!showForm && (
          <Button variant="gradient" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {isActivityProvider ? "Add Activity / Slot" : "Add Item"}
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editingId 
                  ? (isActivityProvider ? "Edit Activity / Slot" : "Edit Menu Item") 
                  : (isActivityProvider ? "Add New Activity / Slot" : "Add New Item")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder={isActivityProvider ? "Activity / Turf Name *" : "Item Name *"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder={isActivityProvider ? "Price per Slot (₹) *" : "Price (₹) *"}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                {isActivityProvider && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                      <Input
                        placeholder="e.g. 07:00 AM"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                      <Input
                        placeholder="e.g. 11:00 PM"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Slot Duration</label>
                      <select
                        value={formData.slot_duration}
                        onChange={(e) => setFormData({ ...formData, slot_duration: e.target.value })}
                        className="h-10 px-3 rounded-md border border-input bg-background text-sm w-full"
                        required
                      >
                        <option value="1">1 Hour</option>
                        <option value="1.5">1.5 Hours</option>
                        <option value="2">2 Hours</option>
                        <option value="3">3 Hours</option>
                        <option value="4">4 Hours</option>
                        <option value="Custom">Custom</option>
                        <option value="Full Day">Full Day</option>
                      </select>
                      {formData.slot_duration === "Custom" && (
                        <div className="mt-2">
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            placeholder="Custom hours (e.g. 5)"
                            value={formData.custom_duration}
                            onChange={(e) => setFormData({ ...formData, custom_duration: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
                <div className="flex flex-wrap gap-4 items-center">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {!isActivityProvider && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_veg}
                        onCheckedChange={(v) => setFormData({ ...formData, is_veg: v })}
                      />
                      <span className="text-sm text-muted-foreground">Vegetarian</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_available}
                      onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
                    />
                    <span className="text-sm text-muted-foreground">Available</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="gradient" size="sm">
                    <Check className="w-4 h-4 mr-2" />
                    {editingId ? "Update" : (isActivityProvider ? "Add Activity" : "Add Item")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Menu Items List */}
      {menuItems.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            {isActivityProvider ? (
              <>
                <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No activities or slots listed yet</p>
                <p className="text-sm text-muted-foreground">Add turfs, arcades, or packages to help customers book slots</p>
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No menu items yet</p>
                <p className="text-sm text-muted-foreground">Add items to help customers browse your menu</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const items = groupedItems[category];
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        item.is_available ? "bg-secondary border-border/50" : "bg-muted/50 border-border/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {!isActivityProvider && (
                          <div className={`w-4 h-4 mt-1 rounded-sm border-2 flex items-center justify-center ${
                            item.is_veg ? "border-success" : "border-destructive"
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {renderItemDescription(item)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">₹{item.price}</span>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={item.is_available}
                            onCheckedChange={() => toggleAvailability(item.id, item.is_available)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Interactive Slots list for Activity Providers */}
                      {isActivityProvider && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                              Date: 
                              <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)} 
                                className="px-2 py-0.5 border border-border/50 rounded bg-background text-foreground text-xs"
                              />
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setExpandedActivityId(expandedActivityId === item.id ? null : item.id)}
                              className="text-xs text-primary"
                            >
                              {expandedActivityId === item.id ? "Hide Slot Status" : "View Slot Status"}
                            </Button>
                          </div>
                          
                          {expandedActivityId === item.id && (() => {
                            let config = { start_time: "07:00 AM", end_time: "11:00 PM", slot_duration: "2" };
                            try {
                              if (item.description) {
                                const parsed = JSON.parse(item.description);
                                if (parsed.start_time && parsed.end_time && parsed.slot_duration) {
                                  config = parsed;
                                }
                              }
                            } catch(e) {}
                            
                            const slots = generateSlots(config.start_time, config.end_time, config.slot_duration);
                            return (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {slots.map(slot => {
                                  const bookedRes = reservations.find(r => 
                                    r.reservation_time.includes(item.name) && r.reservation_time.includes(slot)
                                  );
                                  return (
                                    <div 
                                      key={slot} 
                                      className={`p-2 rounded-lg border text-xs flex flex-col justify-between gap-1 ${
                                        bookedRes 
                                          ? "bg-red-50/50 dark:bg-red-950/20 border-red-200/50" 
                                          : "bg-green-50/50 dark:bg-green-950/20 border-green-200/50"
                                      }`}
                                    >
                                      <span className="font-semibold">{slot}</span>
                                      {bookedRes ? (
                                        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                                          Booked by: {bookedRes.name} ({bookedRes.phone})
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                          Available
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuManager;
