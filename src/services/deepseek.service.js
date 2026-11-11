const Anthropic = require('@anthropic-ai/sdk');
const { AppError } = require('../utils/errors');

const DEFAULT_SYSTEM_PROMPT = 'Eres un asistente útil. Responde siempre en español.';

let customClient = null;
let cachedClient = null;
let cachedKey = null;

function getClient() {
  if (customClient) {
    return customClient;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AppError('IA_NO_DISPONIBLE', 502);
  }

  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new Anthropic({
      apiKey,
      baseURL: 'https://api.deepseek.com/anthropic',
      timeout: 25000
    });
    cachedKey = apiKey;
  }

  return cachedClient;
}

async function preguntar(texto, system) {
  const client = getClient();
  const systemPrompt = system || DEFAULT_SYSTEM_PROMPT;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash';

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      system: systemPrompt,
      messages: [{ role: 'user', content: texto }]
    });

    const respuesta = (response.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const uso = {
      input_tokens: response.usage?.input_tokens ?? 0,
      output_tokens: response.usage?.output_tokens ?? 0
    };

    return { respuesta, uso };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const errorStatus = error.status || error.statusCode;
    console.error(`DeepSeek error: ${error.name || 'Error'} - Estado: ${errorStatus || 'N/A'}`);

    if (errorStatus === 429) {
      throw new AppError('IA_NO_DISPONIBLE', 429);
    }
    if (errorStatus === 529) {
      throw new AppError('IA_NO_DISPONIBLE', 503);
    }
    throw new AppError('IA_NO_DISPONIBLE', 502);
  }
}

function _setClient(mock) {
  customClient = mock;
}

module.exports = {
  preguntar,
  _setClient
};

