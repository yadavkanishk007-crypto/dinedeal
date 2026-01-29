import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

interface AdminPermissions {
  canViewRevenue: boolean;
  canManageRestaurants: boolean;
  canManageUsers: boolean;
  canManageCoupons: boolean;
  canSendNotifications: boolean;
  canViewAudit: boolean;
}

const AdminCreator = () => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    city: "Jhansi",
  });

  const [permissions, setPermissions] = useState<AdminPermissions>({
    canViewRevenue: true,
    canManageRestaurants: true,
    canManageUsers: false,
    canManageCoupons: true,
    canSendNotifications: true,
    canViewAudit: true,
  });

  const [createdAdmins, setCreatedAdmins] = useState<
    { email: string; created_at: string; permissions?: AdminPermissions }[]
  >([]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Create auth user directly (NO EDGE FUNCTION)
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              city: formData.city,
            },
          },
        });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("User creation failed");

      // 2️⃣ Insert admin record
      const { error: adminError } = await supabase.from("admins").insert({
        user_id: userId,
        email: formData.email,
        role: "admin",
        city: formData.city,
      });

      if (adminError) throw adminError;

      // 3️⃣ Insert permissions
      const { error: permError } = await supabase
        .from("admin_permissions")
        .insert({
          admin_id: userId,
          ...permissions,
        });

      if (permError) throw permError;

      toast({
        title: "Admin Created!",
        description: `Admin account for ${formData.email} has been created.`,
      });

      // 4️⃣ Audit log (UNCHANGED)
      await logAction({
        action: "create",
        entity_type: "admin",
        details: {
          email: formData.email,
          city: formData.city,
          permissions,
        },
      });

      setCreatedAdmins([
        {
          email: formData.email,
          created_at: new Date().toISOString(),
          permissions,
        },
        ...createdAdmins,
      ]);

      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        city: "Jhansi",
      });

      setPermissions({
        canViewRevenue: true,
        canManageRestaurants: true,
        canManageUsers: false,
        canManageCoupons: true,
        canSendNotifications: true,
        canViewAudit: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Create New Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pr-20"
                    required
                    minLength={8}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                >
                  Generate Strong Password
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <select
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="Jhansi">Jhansi</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="All">All Cities</option>
                </select>
              </div>

              {/* Role-Based Permissions */}
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="w-full p-3 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium text-sm">
                    Admin Permissions
                  </span>
                  {showPermissions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showPermissions && (
                  <div className="p-4 space-y-4 bg-background">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">
                          View Revenue & Analytics
                        </Label>
                        <Switch
                          checked={permissions.canViewRevenue}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canViewRevenue: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Manage Restaurants</Label>
                        <Switch
                          checked={permissions.canManageRestaurants}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canManageRestaurants: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Manage Users</Label>
                        <Switch
                          checked={permissions.canManageUsers}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canManageUsers: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Manage Coupons</Label>
                        <Switch
                          checked={permissions.canManageCoupons}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canManageCoupons: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Send Notifications</Label>
                        <Switch
                          checked={permissions.canSendNotifications}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canSendNotifications: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">View Audit Logs</Label>
                        <Switch
                          checked={permissions.canViewAudit}
                          onCheckedChange={(checked) =>
                            setPermissions({
                              ...permissions,
                              canViewAudit: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These permissions control what the new admin can access in
                      the dashboard.
                    </p>
                  </div>
                )}
              </div>

              <Button type="submit" variant="gradient" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recently Created Admins */}
      {createdAdmins.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Recently Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdAdmins.map((admin, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-success" />
                    <div className="flex-1">
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(admin.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {admin.permissions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {admin.permissions.canViewRevenue && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Revenue
                        </span>
                      )}
                      {admin.permissions.canManageRestaurants && (
                        <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full">
                          Restaurants
                        </span>
                      )}
                      {admin.permissions.canManageUsers && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full">
                          Users
                        </span>
                      )}
                      {admin.permissions.canManageCoupons && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                          Coupons
                        </span>
                      )}
                      {admin.permissions.canSendNotifications && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full">
                          Notifications
                        </span>
                      )}
                      {admin.permissions.canViewAudit && (
                        <span className="text-xs px-2 py-0.5 bg-gray-500/10 text-gray-600 rounded-full">
                          Audit
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCreator;
