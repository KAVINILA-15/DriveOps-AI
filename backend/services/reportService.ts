import { memoryStore } from '../database/memoryStore';
import { dbClient } from '../database/db';

export const reportService = {
  /**
   * Generate Shift Summary Brief
   */
  async getShiftReport() {
    const metrics = memoryStore.getMetrics();
    const alerts = await dbClient.getAlerts();
    const machines = await dbClient.getMachines();
    const insights = memoryStore.getInsights();
    const lineReadiness = memoryStore.getLineReadiness();

    return {
      shift: 'Shift B',
      shift_window: '14:00 - 22:00',
      facility: 'Northstar Assembly',
      report_id: 'DOP-B-0212',
      generated_at: new Date().toISOString(),
      overall_status: metrics.criticalAlertsCount > 0 ? 'Action Required' : 'On Plan',
      metrics: {
        units_produced: metrics.unitsProduced,
        units_pace: metrics.unitsPace,
        production_health: metrics.productionHealth,
        quality_rate: metrics.qualityRate,
        open_alerts_count: metrics.openAlertsCount,
        critical_alerts_count: metrics.criticalAlertsCount,
      },
      line_readiness: lineReadiness,
      handoff_priorities: alerts.slice(0, 5),
      recommended_actions: insights.slice(0, 3),
      station_count: machines.length,
    };
  },

  /**
   * Export shift report as CSV string
   */
  async exportCsvReport(): Promise<string> {
    const report = await this.getShiftReport();
    const machines = await dbClient.getMachines();

    const lines: string[] = [];
    lines.push(`DriveOps-AI Manufacturing Intelligence Shift Report`);
    lines.push(`Facility: ${report.facility}, Shift: ${report.shift}, Window: ${report.shift_window}`);
    lines.push(`Generated: ${report.generated_at}, Status: ${report.overall_status}`);
    lines.push(``);
    lines.push(`--- PRODUCTION METRICS ---`);
    lines.push(`Units Produced,${report.metrics.units_produced}`);
    lines.push(`Pace,${report.metrics.units_pace}`);
    lines.push(`Health Score,${report.metrics.production_health}%`);
    lines.push(`Quality Rate,${report.metrics.quality_rate}%`);
    lines.push(`Open Alerts,${report.metrics.open_alerts_count}`);
    lines.push(``);
    lines.push(`--- STATION TELEMETRY BREAKDOWN ---`);
    lines.push(`Machine ID,Name,Line,Status,Condition,Utilization (%),Quality (%),Cycle Time (s),Target Cycle Time (s),Last Service`);

    machines.forEach((m) => {
      lines.push(`${m.machine_id},"${m.name}","${m.production_line}",${m.machine_status},${m.overall_status},${m.utilization},${m.quality_rate},${m.cycle_time},${m.target_cycle_time},"${m.last_service}"`);
    });

    return lines.join('\n');
  },
};
