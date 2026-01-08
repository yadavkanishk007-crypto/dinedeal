import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({ action, entity_type, entity_id, details }: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user for audit log');
        return;
      }

      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action,
          entity_type,
          entity_id,
          details,
        });

      if (error) {
        console.error('Failed to create audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  };

  return { logAction };
};
