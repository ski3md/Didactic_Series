// ES module optional AI enrichment helper
import { fileURLToPath } from 'url';
import path from 'path';
import { info, warn, error } from './utils/logger.js';

export async function enrichWithAI(metadata, config) {
  // metadata: object
  // config: { model, maxTokens, temperature }
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    warn('OPENAI_API_KEY not set; skipping AI enrichment', { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiNote = 'No OPENAI_API_KEY';
    return metadata;
  }

  let OpenAI;
  try {
    ({ OpenAI } = await import('openai'));
  } catch (err) {
    warn('openai SDK not installed; skip AI enrichment', { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiNote = 'OpenAI SDK missing';
    return metadata;
  }

  try {
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    const prompt = `Enhance the following pathology image metadata JSON. Add a concise 2-sentence teaching point, 3 short diagnostic tags, key histologic features (3), and 2 differential considerations. Return valid JSON only.\n\n${JSON.stringify(metadata, null, 2)}`;
    const resp = await client.chat.completions.create({
      model: config.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.2,
      max_tokens: config.maxTokens ?? 400
    });
    const txt = resp.choices?.[0]?.message?.content;
    if (!txt) throw new Error('Empty response from AI');
    // try parse
    try {
      const enriched = JSON.parse(txt);
      enriched.aiEnhanced = true;
      enriched.aiEnrichmentAt = new Date().toISOString();
      return enriched;
    } catch (parseErr) {
      // fallback: attach raw text
      metadata.aiEnhanced = true;
      metadata.aiRaw = txt;
      return metadata;
    }
  } catch (err) {
    error(`AI enrichment error: ${err.message}`, { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiError = err.message;
    return metadata;
  }
}
