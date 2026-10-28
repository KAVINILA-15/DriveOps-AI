/**
 * DriveOps-AI Telegram Alert Bridge
 * 
 * Standalone notification service that connects DriveOps-AI to your Telegram Chatbot.
 * Does not modify any core project code.
 * 
 * Usage:
 *   node scripts/telegram_alert_bot.mjs          # Start background alert monitor
 *   node scripts/telegram_alert_bot.mjs --test   # Send a test alert to verify connection
 *   node scripts/telegram_alert_bot.mjs --demo   # Simulate a critical machine anomaly alert
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8834530148:AAGaZFC1GCRLXgfR2IcXFxhuB4T54DKyoRQ',
  chatId: process.env.TELEGRAM_CHAT_ID || '7118722423',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  supabaseUrl: process.env.SUPABASE_URL || 'https://csbwlzgmxjdshofhcjkc.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY || 'sb_publishable_1Ri7HFtIGynLCPkAQtVB2Q_FjLVLiCx',
  pollIntervalMs: 5000, // Check for new alerts every 5 seconds
  webhookPort: process.env.TELEGRAM_BRIDGE_PORT || 5005, // Optional local webhook port
  cacheFile: path.join(__dirname, '.sent_alerts_cache.json'),
};

// Track sent alert IDs to prevent duplicate notifications
let sentAlertIds = new Set();
try {
  if (fs.existsSync(CONFIG.cacheFile)) {
    const raw = fs.readFileSync(CONFIG.cacheFile, 'utf8');
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      sentAlertIds = new Set(ids);
    }
  }
} catch (e) {
  // Fresh cache
}

function saveCache() {
  try {
    fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(Array.from(sentAlertIds).slice(-200)), 'utf8');
  } catch (e) {
    // Ignore cache write errors
  }
}

/**
 * Send formatted message to Telegram Bot API
 */
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${CONFIG.botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CONFIG.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API Error: ${data.description || 'Unknown error'}`);
  }
  return data;
}

/**
 * Format a DriveOps-AI alert for Telegram presentation
 */
function formatAlertMessage(alert) {
  const severityEmoji = {
    Critical: '🚨',
    High: '⚠️',
    Warning: '⚡',
    Low: 'ℹ️',
    Info: 'ℹ️',
  }[alert.severity] || '⚠️';

  const machineId = alert.machine_id || alert.machine || 'Unknown Machine';
  const line = alert.production_line || 'Main Assembly Line';
  const severity = (alert.severity || 'WARNING').toUpperCase();
  const alertType = alert.alert_type || alert.title || 'Anomaly Detection';
  const message = alert.message || alert.explanation || 'An abnormal manufacturing condition was detected.';
  const action = alert.recommended_action || 'Inspect machine station immediately.';
  const timestamp = alert.timestamp || new Date().toLocaleTimeString();
  const alertId = alert.alert_id || alert.id || 'N/A';

  return (
    `${severityEmoji} <b>DRIVEOPS-AI ALERT: ${severity}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏭 <b>Station:</b> ${machineId} (${line})\n` +
    `🔍 <b>Type:</b> ${alertType}\n` +
    `📋 <b>Issue:</b> ${message}\n` +
    `🛠️ <b>Action:</b> ${action}\n` +
    `🕒 <b>Time:</b> ${timestamp}\n` +
    `🆔 <code>${alertId}</code>`
  );
}

/**
 * Dispatch an alert to Telegram if not already sent
 */
async function processAlert(alert) {
  const id = alert.alert_id || alert.id || `${alert.machine_id}-${alert.timestamp}`;
  if (sentAlertIds.has(id)) {
    return false;
  }

  const formattedText = formatAlertMessage(alert);
  await sendTelegramMessage(formattedText);
  sentAlertIds.add(id);
  saveCache();
  console.log(`[Telegram Bridge] Alert forwarded: ${id} (${alert.severity} - ${alert.machine_id})`);
  return true;
}

/**
 * Check local backend API for alerts (GET /api/alerts)
 */
async function fetchBackendAlerts() {
  try {
    const res = await fetch(`${CONFIG.backendUrl}/api/alerts`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.alerts)) return data.alerts;
    }
  } catch (e) {
    // Backend may not be running yet
  }
  return [];
}

/**
 * Check Supabase alerts table (if table exists)
 */
async function fetchSupabaseAlerts() {
  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/alerts?select=*&order=timestamp.desc&limit=20`;
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabaseKey,
        Authorization: `Bearer ${CONFIG.supabaseKey}`,
      },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // Supabase table not created or network issue
  }
  return [];
}

/**
 * Main polling routine
 */
async function pollCycle() {
  try {
    // 1. Check local backend
    const backendAlerts = await fetchBackendAlerts();
    for (const alert of backendAlerts) {
      await processAlert(alert);
    }

    // 2. Check Supabase
    const supabaseAlerts = await fetchSupabaseAlerts();
    for (const alert of supabaseAlerts) {
      await processAlert(alert);
    }
  } catch (err) {
    console.error('[Telegram Bridge] Poll error:', err.message);
  }
}

/**
 * Optional local HTTP Webhook Server (Port 5005)
 * Allows any part of the system or external scripts to POST alerts directly
 */
function startWebhookServer() {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/alert') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', async () => {
        try {
          const alert = JSON.parse(body);
          await processAlert(alert);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'Alert dispatched to Telegram' }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'DriveOps Telegram Alert Bridge' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(CONFIG.webhookPort, () => {
    console.log(`[Telegram Bridge] Direct Webhook endpoint active at: http://localhost:${CONFIG.webhookPort}/alert`);
  }).on('error', () => {
    // Port in use, continue with polling only
  });
}

// -------------------------------------------------------------
// CLI Execution Modes
// -------------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes('--test')) {
  console.log('[Telegram Bridge] Sending test verification message...');
  const testAlert = {
    alert_id: `TEST-${Date.now().toString(36).toUpperCase()}`,
    machine_id: 'CNC-STATION-04',
    production_line: 'Engine Block Line A',
    severity: 'Warning',
    alert_type: 'Thermal Anomaly (Verification Test)',
    message: 'Operating temperature reached 84.5°C (+12°C above baseline).',
    recommended_action: 'Verify coolant flow valve CV-12 and spindle load.',
    timestamp: new Date().toLocaleTimeString(),
  };

  try {
    await sendTelegramMessage(formatAlertMessage(testAlert));
    console.log('✅ Success! Test alert delivered to Telegram chat ID:', CONFIG.chatId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
    process.exit(1);
  }
} else if (args.includes('--demo')) {
  console.log('[Telegram Bridge] Simulating critical manufacturing anomaly alert...');
  const demoAlert = {
    alert_id: `ALT-CRIT-${Date.now().toString(36).toUpperCase()}`,
    machine_id: 'ROBOT-WELD-02',
    production_line: 'Body Assembly Line 1',
    severity: 'Critical',
    alert_type: 'High Vibration & Torque Spike',
    message: 'Vibration amplitude exceeded 8.2 mm/s RMS (ISO 10816 Zone D threshold). Risk of bearing seizure.',
    recommended_action: 'Perform emergency halt on Cell 2 and inspect drive motor bearings.',
    timestamp: new Date().toLocaleTimeString(),
  };

  try {
    await sendTelegramMessage(formatAlertMessage(demoAlert));
    console.log('✅ Success! Critical anomaly alert sent to Telegram!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('====================================================');
  console.log('   DriveOps-AI Telegram Alert Bridge (Choice 1)     ');
  console.log('====================================================');
  console.log(`Telegram Chat ID: ${CONFIG.chatId}`);
  console.log(`Target Backend:   ${CONFIG.backendUrl}/api/alerts`);
  console.log(`Polling Interval: ${CONFIG.pollIntervalMs / 1000}s`);
  console.log('----------------------------------------------------');

  startWebhookServer();

  // Run initial poll immediately, then loop
  pollCycle();
  setInterval(pollCycle, CONFIG.pollIntervalMs);
  console.log('[Telegram Bridge] Monitor running. Press Ctrl+C to stop.');
}
