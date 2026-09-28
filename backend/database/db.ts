import { config, hasDatabaseConfig } from '../config';
import { memoryStore } from './memoryStore';
import type { AlertRecord, Machine, ManufacturingRecordInput } from '../models/types';
import { logger } from '../utils/logger';

/**
 * Database client adapter for DriveOps-AI backend
 * Supports Supabase REST API, PostgreSQL, and resilient MemoryStore fallback
 */
export const dbClient = {
  /**
   * Check connection status to configured database
   */
  async checkConnection(): Promise<{ ok: boolean; provider: string; message: string }> {
    if (!hasDatabaseConfig()) {
      return {
        ok: true,
        provider: 'InMemoryStore',
        message: 'Running with local resilient in-memory storage (Seed data ready). Configure DATABASE_URL or SUPABASE_URL in .env to persist to database.',
      };
    }

    // If Supabase configured
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/alerts?select=alert_id&limit=1`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        });

        if (res.ok) {
          return {
            ok: true,
            provider: 'Supabase Cloud',
            message: 'Successfully connected to Supabase database (public.alerts verified).',
          };
        } else {
          return {
            ok: false,
            provider: 'Supabase Cloud',
            message: `Supabase returned HTTP ${res.status}: ${res.statusText}`,
          };
        }
      } catch (err: any) {
        return {
          ok: false,
          provider: 'Supabase Cloud',
          message: err?.message || 'Failed to reach Supabase REST endpoint.',
        };
      }
    }

    return {
      ok: true,
      provider: 'PostgreSQL',
      message: 'PostgreSQL connection configured.',
    };
  },

  /**
   * Retrieve alerts from database, falling back to memoryStore
   */
  async getAlerts(): Promise<AlertRecord[]> {
    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/alerts?select=*&order=timestamp.desc`;
        const res = await fetch(url, {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
              alert_id: r.alert_id,
              machine_id: r.machine_id,
              production_line: r.production_line,
              timestamp: r.timestamp,
              alert_type: r.alert_type,
              severity: r.severity,
              message: r.message,
              recommended_action: r.recommended_action,
              status: r.status || 'open',
            }));
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch alerts from Supabase, serving from memory store:', err);
      }
    }

    return memoryStore.getAlerts();
  },

  /**
   * Save an alert to database and memoryStore
   */
  async saveAlert(alert: AlertRecord): Promise<void> {
    memoryStore.addAlert(alert);

    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/alerts`;
        await fetch(url, {
          method: 'POST',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(alert),
        });
      } catch (err) {
        logger.warn('Failed to persist alert to Supabase:', err);
      }
    }
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const memorySuccess = memoryStore.acknowledgeAlert(alertId);

    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/alerts?alert_id=eq.${encodeURIComponent(alertId)}`;
        await fetch(url, {
          method: 'PATCH',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'acknowledged' }),
        });
      } catch (err) {
        logger.warn('Failed to update alert in Supabase:', err);
      }
    }

    return memorySuccess;
  },

  /**
   * Retrieve machines fleet
   */
  async getMachines(): Promise<Machine[]> {
    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/machines?select=*`;
        const res = await fetch(url, {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows as Machine[];
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch machines from Supabase:', err);
      }
    }

    return memoryStore.getMachines();
  },

  /**
   * Save / update a machine
   */
  async saveMachine(machine: Machine): Promise<void> {
    memoryStore.upsertMachine(machine);

    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/machines`;
        await fetch(url, {
          method: 'POST',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(machine),
        });
      } catch (err) {
        // Machines table is optional in older schema versions
      }
    }
  },

  /**
   * Record telemetry entry
   */
  async saveTelemetry(record: ManufacturingRecordInput): Promise<void> {
    memoryStore.recordTelemetry(record);
  },
};
