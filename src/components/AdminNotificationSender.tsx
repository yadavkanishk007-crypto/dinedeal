import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Loader2, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  target_type: string;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

const AdminNotificationSender = () => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    url: "",
  });

  useEffect(() => {
    fetchSubscriberCount();
    fetchNotificationLogs();
  }, []);

  const fetchSubscriberCount = async () => {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });
    setSubscriberCount(count || 0);
  };

  const fetchNotificationLogs = async () => {
    const { data } = await supabase
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setLogs((data as NotificationLog[]) || []);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.body.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in the title and message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
     const response = await fetch("https://dinedeal-backend-076n.onrender.com/api/notifications/send",
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
          },
          body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          data: {
            url: formData.url || undefined,
            targetType: "all",
      },
    }),
  }
);

if (!response.ok) {
  throw new Error("Failed to send notification");
}

const data = await response.json();


      toast({
        title: "Notification Sent!",
        description: `Sent to ${data.sent} subscribers`,
      });

      await logAction({
        action: "send_notification",
        entity_type: "push_notification",
        details: { 
          title: formData.title, 
          sent: data.sent,
          failed: data.failed 
        },
      });

      setFormData({ title: "", body: "", url: "" });
      fetchNotificationLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Send Push Notification
              </div>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Users className="w-4 h-4" />
                {subscriberCount} subscribers
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <Input
                placeholder="Notification Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={50}
              />
              <Textarea
                placeholder="Notification Message *"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
                maxLength={200}
                rows={3}
              />
              <Input
                placeholder="Link URL (optional) - e.g., /explore"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />

              <div className="flex gap-2">
                <Button type="submit" variant="gradient" disabled={loading || subscriberCount === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to All Subscribers
                    </>
                  )}
                </Button>
              </div>

              {subscriberCount === 0 && (
                <p className="text-sm text-muted-foreground">
                  No subscribers yet. Users need to enable notifications in their profile.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification History */}
      {logs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{log.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{log.body}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="text-success">{log.total_sent} sent</p>
                      {log.total_failed > 0 && (
                        <p className="text-destructive">{log.total_failed} failed</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminNotificationSender;
