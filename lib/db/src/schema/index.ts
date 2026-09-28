import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Public Alerts Table
 * Matches existing Supabase schema: public.alerts
 */
export const alertsTable = pgTable("alerts", {
  alert_id: text("alert_id").primaryKey(),
  machine_id: text("machine_id").notNull(),
  production_line: text("production_line").notNull(),
  timestamp: text("timestamp").notNull(),
  alert_type: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  recommended_action: text("recommended_action").notNull(),
  status: text("status").default("open"),
});

export const insertAlertSchema = createInsertSchema(alertsTable);
export const selectAlertSchema = createSelectSchema(alertsTable);
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertRow = typeof alertsTable.$inferSelect;

/**
 * Public Machines Table
 * Matches existing Supabase schema: public.machines
 */
export const machinesTable = pgTable("machines", {
  machine_id: text("machine_id").primaryKey(),
  name: text("name").notNull(),
  production_line: text("production_line").notNull(),
  machine_status: text("machine_status").notNull().default("Running"),
  overall_status: text("overall_status").notNull().default("Healthy"),
  utilization: numeric("utilization").default("0.0"),
  quality_rate: numeric("quality_rate").default("100.0"),
  cycle_time: numeric("cycle_time").default("0.0"),
  target_cycle_time: numeric("target_cycle_time").default("0.0"),
  runtime: text("runtime"),
  last_service: text("last_service"),
  next_service: text("next_service"),
});

export const insertMachineSchema = createInsertSchema(machinesTable);
export const selectMachineSchema = createSelectSchema(machinesTable);
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type MachineRow = typeof machinesTable.$inferSelect;

/**
 * Telemetry Records Table
 */
export const telemetryTable = pgTable("telemetry", {
  id: text("id").primaryKey(),
  machine_id: text("machine_id").notNull(),
  production_line: text("production_line"),
  timestamp: text("timestamp").notNull(),
  temperature: numeric("temperature"),
  vibration: numeric("vibration"),
  pressure: numeric("pressure"),
  power_consumption: numeric("power_consumption"),
  production_target: numeric("production_target"),
  production_actual: numeric("production_actual"),
  quality_rate: numeric("quality_rate"),
  defect_count: integer("defect_count"),
  defect_type: text("defect_type"),
  machine_status: text("machine_status"),
});

export const insertTelemetrySchema = createInsertSchema(telemetryTable);
export const selectTelemetrySchema = createSelectSchema(telemetryTable);
export type InsertTelemetry = z.infer<typeof insertTelemetrySchema>;
export type TelemetryRow = typeof telemetryTable.$inferSelect;