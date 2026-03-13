import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageCircle, Clock, CheckCircle, AlertCircle, Send, Search, User, RefreshCw } from "lucide-react";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; phone: string | null } | null;
  user_roles?: { role: string } | null;
}

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
}

const AdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      const channel = supabase
        .channel(`admin-ticket-${selectedTicket.id}`)
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
    setLoading(true);
    try {
      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      
      // Fetch profiles and roles for each ticket
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', ticket.user_id)
            .single();
          
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', ticket.user_id)
            .single();
          
          return {
            ...ticket,
            profiles: profile,
            user_roles: userRole
          };
        })
      );
      
      setTickets(ticketsWithProfiles as SupportTicket[]);
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
          is_from_support: true
        });
      
      if (error) throw error;
      setNewMessage("");
      
      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'in_progress');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status } : t
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
      
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error("Failed to update ticket");
    }
  };

  const updateTicketPriority = async (ticketId: string, priority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, priority } : t
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, priority } : null);
      }
      
      toast.success(`Priority updated to ${priority}`);
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast.error("Failed to update priority");
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{openTickets}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{inProgressTickets}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedTickets}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{urgentTickets}</p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by subject or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTickets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Support Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{ticket.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {ticket.user_roles?.role || 'customer'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {ticket.category.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSelectedTicket(ticket)}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Chat Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-8">
              <div className="flex items-center gap-2">
                {selectedTicket && getStatusIcon(selectedTicket.status)}
                <span className="truncate">{selectedTicket?.subject}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Ticket Info & Actions */}
          <div className="flex flex-wrap gap-3 pb-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">User:</span>
              <span className="text-sm font-medium">
                {selectedTicket?.profiles?.full_name || 'Unknown'}
              </span>
              <Badge variant="outline" className="capitalize text-xs">
                {selectedTicket?.user_roles?.role || 'customer'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select 
                value={selectedTicket?.status} 
                onValueChange={(value) => selectedTicket && updateTicketStatus(selectedTicket.id, value as TicketStatus)}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <Select 
                value={selectedTicket?.priority} 
                onValueChange={(value) => selectedTicket && updateTicketPriority(selectedTicket.id, value as TicketPriority)}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <ScrollArea className="flex-1 min-h-[250px] max-h-[350px] pr-4">
            <div className="space-y-3 py-2">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.is_from_support ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.is_from_support 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      {msg.is_from_support ? 'Support' : selectedTicket?.profiles?.full_name || 'User'}
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.is_from_support ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendingMessage}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          )}

          {selectedTicket?.status === 'closed' && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-muted-foreground text-sm">
                This ticket has been closed
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectedTicket && updateTicketStatus(selectedTicket.id, 'open')}
              >
                Reopen Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
