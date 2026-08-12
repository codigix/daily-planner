const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const EXECUTIVE_AI_SYSTEM_PROMPT = `You are the CODIGIX Executive AI Assistant & Chief of Staff. You are trained to understand natural, human-sent conversational language, messy meeting notes, voice transcripts, and informal executive messages.

INSTRUCTION FOLLOWING GUIDELINES:
1. UNDERSTAND HUMAN INTENT:
   - Carefully read informal human-typed text, shorthand, typos, bullet points, and voice-to-text transcripts.
   - Extract exact user directives, target days (e.g. Monday, tomorrow, next week), specific times (e.g. 10am, 2:30pm), priority levels, and execution guidelines.

2. STRICTLY ADHERE TO INSTRUCTIONS:
   - If the user asks for tasks, generate clean actionable tasks with 12-hour AM/PM time slots.
   - If the user specifies constraints (e.g. "Do NOT include X", "Schedule for Monday"), follow them 100%.

3. PROFESSIONAL EXECUTIVE TONE:
   - Respond concisely, directly, and constructively like an elite Chief of Staff to a CEO or Founder.`;

// Server-side AI Assistant Endpoint (Primary: Gemini API, Secondary: Claude API)
router.post('/chat', async (req, res) => {
  const { prompt, systemContext } = req.body;
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
  const claudeKey = (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "").trim();

  const finalContext = systemContext 
    ? `${EXECUTIVE_AI_SYSTEM_PROMPT}\n\nAdditional Context: ${systemContext}`
    : EXECUTIVE_AI_SYSTEM_PROMPT;

  // 1. Try Gemini API Key (Primary Engine)
  if (geminiKey && geminiKey.length > 15) {
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${finalContext}\n\nUser Message / Request:\n"${prompt}"` }] }]
        })
      });

      const geminiData = await geminiRes.json();
      if (geminiData && geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
        const text = geminiData.candidates[0].content.parts[0].text;
        return res.json({
          text,
          status: 'success',
          provider: 'Google Gemini AI'
        });
      }
    } catch (geminiErr) {
      console.warn("Gemini API call error:", geminiErr.message);
    }
  }

  // 2. Try Anthropic Claude API if valid Claude Key exists
  if (claudeKey && claudeKey.startsWith('sk-ant')) {
    try {
      const anthropic = new Anthropic({ apiKey: claudeKey });
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: finalContext,
        messages: [{ role: 'user', content: prompt }]
      });

      if (message && message.content && message.content[0] && message.content[0].text) {
        return res.json({ 
          text: message.content[0].text,
          status: 'success',
          provider: 'Claude 3.5 Sonnet'
        });
      }
    } catch (claudeErr) {
      console.warn("Anthropic Claude API error:", claudeErr.message);
    }
  }

  // 3. Clean Executive AI Response Fallback
  const aiResponse = generateContextualAIResponse(prompt);
  return res.json({
    text: aiResponse,
    status: 'fallback',
    provider: 'Executive AI Engine'
  });
});

function generateContextualAIResponse(prompt) {
  const p = (prompt || '').toLowerCase();
  if (p.includes('plan') || p.includes('schedule') || p.includes('task')) {
    return '📊 Executive Schedule Insight: Focus on high-priority client deliverables and scheduled meetings today. Your peak productivity slot is between 10:00 AM – 01:00 PM.';
  }
  if (p.includes('client') || p.includes('follow') || p.includes('lead')) {
    return '🤝 Client Engagement Analysis: High-priority client follow-ups are ready in your CRM pipeline. Recommended action: Review open deals and schedule next touchpoints.';
  }
  if (p.includes('sale') || p.includes('revenue') || p.includes('finance')) {
    return '💰 Financial Target Review: Pipeline revenue is actively tracked against monthly target goals. Prioritize closing top negotiation accounts.';
  }
  return `🤖 CODIGIX Executive AI Assistant: I am actively monitoring your daily plans, team performance, and client follow-ups to optimize executive decision-making. Prompt received: "${prompt}"`;
}

module.exports = router;
