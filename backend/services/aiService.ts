import { config, hasAiConfig } from '../config';
import type { ManufacturingRecordInput, OverallManufacturingAnalysis } from '../models/types';
import { logger } from '../utils/logger';

/**
 * Modular AI Intelligence Service
 * Provides LLM-powered root-cause reasoning and countermeasures when API key is provided
 * Falls back to deterministic engineering physics without hallucination
 */
// Circuit breaker to avoid spamming network requests when quota/rate limits are hit
let aiCircuitBroken = false;
let lastCircuitBreakTime = 0;
const CIRCUIT_BREAK_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

export const aiService = {
  /**
   * Return AI Service Status and configuration info
   */
  getStatus() {
    return {
      enabled: hasAiConfig(),
      provider: config.geminiApiKey ? 'Google Gemini' : config.openaiApiKey ? 'OpenAI' : 'Deterministic Engineering Engine',
      model: config.geminiApiKey ? 'gemini-1.5-flash' : config.openaiApiKey ? 'gpt-4o-mini' : 'Rule-based Automotive Physics',
      configured: hasAiConfig(),
      circuit_breaker_active: aiCircuitBroken,
      message: hasAiConfig()
        ? 'AI LLM reasoning layer is active and processing manufacturing telemetry.'
        : 'Running in Deterministic Engineering mode. To enable generative AI root-cause synthesis, set GEMINI_API_KEY in your .env file.',
    };
  },

  /**
   * Enhance overall analysis with Generative AI reasoning if configured
   */
  async enhanceAnalysis(
    analysis: OverallManufacturingAnalysis,
    record: ManufacturingRecordInput
  ): Promise<OverallManufacturingAnalysis> {
    // If no anomaly was detected, or if no AI key configured, return deterministic result
    if (!analysis.anomaly_detected || !hasAiConfig()) {
      return {
        ...analysis,
        ai_synthesized: false,
      };
    }

    // Check circuit breaker
    if (aiCircuitBroken) {
      if (Date.now() - lastCircuitBreakTime > CIRCUIT_BREAK_COOLDOWN_MS) {
        aiCircuitBroken = false;
      } else {
        return {
          ...analysis,
          ai_synthesized: false,
        };
      }
    }

    try {
      if (config.geminiApiKey) {
        return await this.synthesizeWithGemini(analysis, record);
      } else if (config.openaiApiKey) {
        return await this.synthesizeWithOpenAi(analysis, record);
      }
    } catch (err: any) {
      if (err?.message?.includes('429') || err?.message?.includes('quota')) {
        aiCircuitBroken = true;
        lastCircuitBreakTime = Date.now();
        logger.warn('AI API quota limit reached (429). Fast fallback enabled: using deterministic engineering analysis.');
      } else {
        logger.warn(`AI reasoning fallback (${err?.message || 'provider offline'}). Using deterministic engineering output.`);
      }
    }

    return {
      ...analysis,
      ai_synthesized: false,
    };
  },

  /**
   * Call Google Gemini API
   */
  async synthesizeWithGemini(
    analysis: OverallManufacturingAnalysis,
    record: ManufacturingRecordInput
  ): Promise<OverallManufacturingAnalysis> {
    const prompt = `You are DriveOps-AI, an expert smart car manufacturing intelligence agent.
A station anomaly was detected during vehicle assembly.
Telemetry Data:
- Machine ID: ${record.machine_id}
- Production Line: ${analysis.production_line}
- Temperature: ${record.temperature}°C (Nominal: <75°C, Critical: >90°C)
- Vibration: ${record.vibration} mm/s (Nominal: <3.0 mm/s, Critical: >6.5 mm/s)
- Pressure: ${record.pressure ?? 'N/A'} psi
- Power Consumption: ${record.power_consumption ?? 'N/A'} kW
- Quality Rate: ${record.quality_rate ?? 'N/A'}%
- Defect Count: ${record.defect_count ?? 0}
- Detected Parameters: ${analysis.abnormal_parameters.join(', ')}

Provide:
1. A concise, professional 1-2 sentence mechanical root-cause diagnosis.
2. A single concise, actionable maintenance engineering command for the plant floor technicians.

Format your response strictly as valid JSON with two fields:
{
  "explanation": "...",
  "recommended_action": "..."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini API');

    const parsed = JSON.parse(text);

    return {
      ...analysis,
      explanation: parsed.explanation || analysis.explanation,
      recommended_action: parsed.recommended_action || analysis.recommended_action,
      ai_synthesized: true,
    };
  },

  /**
   * Call OpenAI API (alternative)
   */
  async synthesizeWithOpenAi(
    analysis: OverallManufacturingAnalysis,
    record: ManufacturingRecordInput
  ): Promise<OverallManufacturingAnalysis> {
    const prompt = `A station anomaly was detected on ${record.machine_id} (${analysis.production_line}).
Temperature: ${record.temperature}°C, Vibration: ${record.vibration} mm/s.
Abnormal parameters: ${analysis.abnormal_parameters.join(', ')}.
Return JSON with 'explanation' (1-2 sentences on mechanical cause) and 'recommended_action' (single concise action).`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);

    return {
      ...analysis,
      explanation: parsed.explanation || analysis.explanation,
      recommended_action: parsed.recommended_action || analysis.recommended_action,
      ai_synthesized: true,
    };
  },
};
