import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    sendLocalNotification,
  } = usePushNotifications();
  const { toast } = useToast();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notifications disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notifications enabled!",
          description: "You'll now receive updates about deals and offers.",
        });
        // Send a test notification
        setTimeout(() => {
          sendLocalNotification("Welcome to DineDeal!", {
            body: "You'll now receive notifications about exclusive deals and offers.",
            tag: "welcome",
          });
        }, 1000);
      } else if (permission === "denied") {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isSubscribed ? "bg-primary/10" : "bg-muted"
        }`}>
          {isSubscribed ? (
            <BellRing className="w-5 h-5 text-primary" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed
              ? "Receiving deal alerts"
              : "Get notified about new deals"}
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
