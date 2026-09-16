import { supabase, isSupabaseConfigured, type DatabaseAlert } from '@/lib/supabase';
import { alerts as seedAlerts, type Alert, type Severity } from '@/lib/driveops-service';

/**
 * Maps Supabase public.alerts table rows to the frontend Alert model
 */
function mapDatabaseAlertToFrontend(row: DatabaseAlert): Alert {
  return {
    id: row.alert_id || `ALT-${Math.floor(Math.random() * 900 + 100)}`,
    machine_id: row.machine_id || 'M-000',
    machine: row.machine_id ? `Station ${row.machine_id}` : 'Manufacturing Asset',
    production_line: row.production_line || 'Main Line',
    timestamp: row.timestamp || 'Just now',
    severity: (row.severity as Severity) || 'Medium',
    title: row.alert_type || row.message || 'System Warning',
    explanation: row.message || 'Operational threshold exceeded.',
    recommended_action: row.recommended_action || 'Inspect station and verify operating parameters.',
    alert_required: row.severity === 'Critical' || row.severity === 'High',
    acknowledged: row.status === 'acknowledged' || row.status === 'resolved',
  };
}

export const supabaseService = {
  /**
   * Check connection status to the Supabase database
   */
  async checkConnection(): Promise<{ ok: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        message: 'Supabase credentials missing. Running in local fallback mode.',
      };
    }

    try {
      const { error } = await supabase.from('alerts').select('alert_id').limit(1);
      if (error) {
        return {
          ok: false,
          message: `Connected to Supabase URL, but query returned: ${error.message}`,
        };
      }
      return {
        ok: true,
        message: 'Successfully connected to Supabase database (public.alerts available).',
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.message || 'Failed to reach Supabase endpoint.',
      };
    }
  },

  /**
   * Fetch alerts from Supabase public.alerts, falling back to seed alerts if empty or offline
   */
  async getAlerts(): Promise<{ alerts: Alert[]; fromDatabase: boolean }> {
    if (!isSupabaseConfigured()) {
      return { alerts: seedAlerts, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error || !data || data.length === 0) {
        return { alerts: seedAlerts, fromDatabase: false };
      }

      const mapped = data.map((row: any) => mapDatabaseAlertToFrontend(row as DatabaseAlert));
      return { alerts: mapped, fromDatabase: true };
    } catch {
      return { alerts: seedAlerts, fromDatabase: false };
    }
  },

  /**
   * Acknowledge an alert in Supabase public.alerts
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'acknowledged' })
        .eq('alert_id', alertId);

      return !error;
    } catch {
      return false;
    }
  },
};
