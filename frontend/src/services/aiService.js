import { sendAIChatAPI } from './api';

export const getStoredApiKey = () => {
  return localStorage.getItem('claude_api_key') || import.meta.env.VITE_CLAUDE_API_KEY || '';
};

export const saveApiKey = (key) => {
  localStorage.setItem('claude_api_key', key);
};

export const callClaudeAPI = async (prompt, systemContext = "You are the CODIGIX Executive AI Assistant helping CEOs manage daily plans, meetings, and sales targets.") => {
  const apiKey = getStoredApiKey();

  // Try backend proxy API first
  const serverResult = await sendAIChatAPI(prompt, systemContext);
  if (serverResult && serverResult.text) {
    return serverResult.text;
  }

  // Direct client fetch if backend proxy is offline and API key is stored
  if (apiKey && apiKey.startsWith('sk-ant')) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: systemContext,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text;
        }
      }
    } catch (err) {
      console.warn("Client-side Anthropic API fetch fallback:", err.message);
    }
  }

  // Smart Executive Simulation Fallback
  return generateSimulatedExecutiveResponse(prompt);
};

function generateSimulatedExecutiveResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("plan") || p.includes("schedule")) {
    return "Based on your 12 scheduled tasks today, I recommend prioritizing your 10:00 AM Client Meeting with ABC Pvt Ltd (₹2.5Cr value). Peak focus time is 10:00 AM - 12:30 PM.";
  }
  if (p.includes("follow") || p.includes("client")) {
    return "Client Analysis: Follow-up with LMN Corp is overdue by 1 day (₹15L value). ABC Pvt Ltd has an 80% win probability.";
  }
  if (p.includes("sale") || p.includes("revenue")) {
    return "Sales Insight: Revenue MTD is ₹24,50,000 against a target of ₹30,00,000 (60.8% achieved). Focus on closing 11 negotiation deals.";
  }
  return "CODIGIX Executive AI: Task execution rate is 91%, revenue achievement is 60.8%, and project delivery is 87.5%.";
}
