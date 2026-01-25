import { Bell, BellOff, BellRing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const { toast } = useToast();

  const handleToggle = async () => {
    if (isLoading) return;

    // 🚫 Browser-level block
    if (permission === "denied") {
      toast({
        title: "Notifications blocked",
        description:
          "Please enable notifications from your browser settings to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSubscribed) {
        const success = await unsubscribe();
        if (success) {
          toast({
            title: "Notifications turned off",
            description: "You will no longer receive push notifications.",
          });
        }
      } else {
        const success = await subscribe();
        if (success) {
          toast({
            title: "Notifications enabled",
            description:
              "You’ll receive updates about orders, deals, and important activity.",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  // ❌ Not supported
  if (!isSupported) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <BellOff className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              Not supported in this browser
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSubscribed ? "bg-primary/10" : "bg-muted"
          }`}
        >
          {isSubscribed ? (
            <BellRing className="w-5 h-5 text-primary" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <p className="font-medium text-foreground">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            {permission === "denied"
              ? "Blocked in browser settings"
              : isSubscribed
              ? "Enabled for important updates"
              : "Get notified about orders and deals"}
          </p>
        </div>

        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
