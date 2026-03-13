import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Send, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
}
export interface RestaurantSupportTabProps {
  restaurantId: string;
}
const RestaurantSupportTab = ({ restaurantId }: RestaurantSupportTabProps) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Create ticket form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [restaurantId]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as SupportMessage]);
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject: subject.trim(),
          category,
        })
        .select()
        .single();
      
      if (ticketError) throw ticketError;

      // Add initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user?.id,
          message: description.trim(),
          is_from_support: false
        });
      
      if (messageError) throw messageError;

      toast.success("Ticket created successfully");
      setShowCreateDialog(false);
      setSubject("");
      setCategory("general");
      setDescription("");
      fetchTickets();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user?.id,
          message: newMessage.trim(),
          is_from_support: false
        });
      
      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-500';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500';
      case 'resolved': return 'bg-green-500/20 text-green-500';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-500';
      case 'high': return 'bg-orange-500/20 text-orange-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-green-500/20 text-green-500';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Headphones className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Customer Support</h2>
            <p className="text-sm text-muted-foreground">Get help with your restaurant account</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">Active Tickets</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {tickets.filter(t => t.status !== 'closed').length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No active tickets</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Create a new ticket if you need help
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets
                .filter(t => t.status !== 'closed')
                .map(ticket => (
                  <Card 
                    key={ticket.id} 
                    className="bg-card cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {ticket.category.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-3">
          {tickets.filter(t => t.status === 'closed').length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No closed tickets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets
                .filter(t => t.status === 'closed')
                .map(ticket => (
                  <Card 
                    key={ticket.id} 
                    className="bg-card cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {ticket.category.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Closed on {new Date(ticket.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(ticket.status)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Closed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <Input
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="payment">Payment Issue</SelectItem>
                  <SelectItem value="settlement">Settlement Query</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="account">Account Related</SelectItem>
                  <SelectItem value="menu">Menu Management</SelectItem>
                  <SelectItem value="offers">Offers & Promotions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description *</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button 
              onClick={handleCreateTicket} 
              disabled={creating || !subject.trim() || !description.trim()}
              className="w-full"
            >
              {creating ? "Creating..." : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Chat Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-8">
              <div className="flex items-center gap-2">
                {selectedTicket && getStatusIcon(selectedTicket.status)}
                <span className="truncate">{selectedTicket?.subject}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4">
            <div className="space-y-3 py-2">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.is_from_support ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.is_from_support 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      {msg.is_from_support ? 'Support Team' : 'You'}
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.is_from_support ? 'text-muted-foreground' : 'text-primary-foreground/70'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet
                </p>
              )}
            </div>
          </ScrollArea>

          {selectedTicket?.status !== 'closed' && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendingMessage}
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedTicket?.status === 'closed' && (
            <p className="text-center text-muted-foreground text-sm py-4 border-t mt-4">
              This ticket has been closed
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantSupportTab;
