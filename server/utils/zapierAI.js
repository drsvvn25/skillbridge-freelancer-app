// =========================================================
// SkillBridge — AI Webhook Utility (n8n / Zapier + Gemini fallback)
//
// PRIMARY:  Routes chatbot messages through n8n webhook workflow
//           n8n (free, open-source) calls Gemini or OpenAI and returns reply
//
// FALLBACK: Direct Gemini SDK call if n8n is unavailable/unconfigured
//
// Flow:
//   1. POST to n8n Webhook node  → { message, systemPrompt, history }
//   2. n8n workflow calls Gemini / OpenAI API
//   3. n8n "Respond to Webhook" node returns { reply: "AI response" }
//   4. If n8n fails → direct Gemini SDK call
// =========================================================

const { GoogleGenAI } = require('@google/genai');

// ── Cached Gemini client (fallback) ─────────────────────────────
let _geminiClient = null;
function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes('your-gemini')) return null;
  _geminiClient = new GoogleGenAI({ apiKey: key });
  return _geminiClient;
}

// ─────────────────────────────────────────────────────────────────
// isN8nConfigured — checks if N8N_WEBHOOK_URL is set and valid
// ─────────────────────────────────────────────────────────────────
function isN8nConfigured() {
  const url = process.env.N8N_WEBHOOK_URL || '';
  return (
    url.length > 0 &&
    (url.startsWith('http://') || url.startsWith('https://')) &&
    !url.includes('YOUR_WEBHOOK_ID') &&
    (url.includes('/webhook/') || url.includes('/webhook-test/'))
  );
}

// ─────────────────────────────────────────────────────────────────
// askViaN8n
//   POSTs the user message to your n8n webhook workflow.
//
//   Your n8n workflow must:
//     Node 1 → Webhook (Trigger)      — receives POST from server
//     Node 2 → HTTP Request           — calls Gemini or OpenAI API
//     Node 3 → Code (optional)        — extracts reply text
//     Node 4 → Respond to Webhook     — returns { reply: "..." }
//
//   Returns the AI reply string, or null on failure.
// ─────────────────────────────────────────────────────────────────
async function askViaN8n(systemPrompt, history, userMessage) {
  if (!isN8nConfigured()) return null;

  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  // Build compact conversation history (last 5 exchanges)
  const historyStr = (history || [])
    .slice(-10)
    .map(h => `${h.role === 'user' ? 'User' : 'Bot'}: ${h.parts[0]?.text || ''}`)
    .join('\n');

  const payload = {
    message: userMessage,
    systemPrompt: systemPrompt,
    conversationHistory: historyStr || '',
    platform: 'SkillBridge',
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SkillBridge-Source': 'skillbot-n8n',
      },
      body: JSON.stringify(payload),
      // n8n responds synchronously via "Respond to Webhook" node
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.warn(`[n8n AI] HTTP ${response.status} — falling back to Gemini`);
      return null;
    }

    const data = await response.json();

    // Accept common field names the n8n Code node might output
    const reply =
      data.reply ||
      data.response ||
      data.text ||
      data.output ||
      data.answer ||
      // Handle nested n8n default output format: [{ json: { reply: "..." } }]
      (Array.isArray(data) && data[0]?.json?.reply) ||
      (Array.isArray(data) && data[0]?.reply) ||
      null;

    if (reply && typeof reply === 'string' && reply.trim().length > 0) {
      console.log('[n8n AI] ✅ Response received via n8n');
      return reply.trim();
    }

    console.warn('[n8n AI] ⚠️ Unexpected response format from n8n:', JSON.stringify(data).slice(0, 200));
    return null;

  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.warn('[n8n AI] ⏱️ Webhook timed out (25s) — falling back to Gemini');
    } else {
      console.warn('[n8n AI] ❌ Webhook error:', err.message);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// askViaGeminiDirect (local fallback)
//   Direct Gemini SDK call — used when n8n is unavailable.
// ─────────────────────────────────────────────────────────────────
async function askViaGeminiDirect(systemPrompt, history, userMessage) {
  const client = getGeminiClient();
  if (!client) return null;

  // Primary model from env or latest gemini-2.5-flash, with automatic fallback
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = [preferredModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

  for (const model of modelsToTry) {
    try {
      const chat = client.chats.create({
        model: model,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 300,
          temperature: 0.6,
        },
        history: history || [],
      });

      const response = await chat.sendMessage({ message: userMessage });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`[Gemini SDK ${model} error]`, err.message);
      // continue to next model in list if this one had 503 or quota spike
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// askAI — Main exported function
//
// Priority:
//   1. n8n webhook (N8N_WEBHOOK_URL set) → n8n workflow calls Gemini/OpenAI
//   2. Direct Gemini SDK call            → fallback if n8n unavailable
//   3. Returns null                      → rule-based fallback in chatbot
//
// Usage:
//   const { askAI } = require('../utils/zapierAI');
//   const reply = await askAI(systemPrompt, session.history, userMsg);
// ─────────────────────────────────────────────────────────────────
async function askAI(systemPrompt, history, userMessage) {
  // 1. Try n8n first
  if (isN8nConfigured()) {
    const n8nReply = await askViaN8n(systemPrompt, history, userMessage);
    if (n8nReply) return n8nReply;
    console.log('[SkillBot] n8n unavailable — using Gemini direct fallback');
  }

  // 2. Direct Gemini SDK fallback
  return await askViaGeminiDirect(systemPrompt, history, userMessage);
}

module.exports = { askAI, isN8nConfigured };
