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
}

const CATEGORIES = ["Starters", "Main Course", "Desserts", "Beverages", "Specials"];

const MenuManager = ({ restaurantId }: MenuManagerProps) => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    is_veg: true,
    is_available: true,
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
      const menuData = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_veg: formData.is_veg,
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
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      is_veg: item.is_veg,
      is_available: item.is_available,
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
      category: "Main Course",
      is_veg: true,
      is_available: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((m) => m.category === cat);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Menu Management</h2>
        {!showForm && (
          <Button variant="gradient" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
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
                {editingId ? "Edit Menu Item" : "Add New Item"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Item Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Price (₹) *"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
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
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_veg}
                      onCheckedChange={(v) => setFormData({ ...formData, is_veg: v })}
                    />
                    <span className="text-sm text-muted-foreground">Vegetarian</span>
                  </div>
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
                    {editingId ? "Update" : "Add Item"}
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
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No menu items yet</p>
            <p className="text-sm text-muted-foreground">Add items to help customers browse your menu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
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
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 mt-1 rounded-sm border-2 flex items-center justify-center ${
                          item.is_veg ? "border-success" : "border-destructive"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
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
