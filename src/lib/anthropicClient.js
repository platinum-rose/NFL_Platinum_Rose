// src/lib/anthropicClient.js
// ═══════════════════════════════════════════════════════════════════════════════
// AI Agent Client — supports Anthropic Claude AND OpenAI GPT (function calling).
//
// Internal storage format is Anthropic-style messages so the UI rendering layer
// is provider-agnostic.  OpenAI requests/responses are converted on the way in
// and out.
//
// Providers:
//   'anthropic' — uses VITE_ANTHROPIC_API_KEY, model claude-sonnet-4-5
//   'openai'    — uses VITE_OPENAI_API_KEY,    model gpt-4o-mini (default)
//
// Security note: browser-direct API calls. Personal app only.
// ═══════════════════════════════════════════════════════════════════════════════

import { ANTHROPIC_API } from './apiConfig.js';

const OPENAI_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';

// ─── Message Sanitizer ───────────────────────────────────────────────────────

/**
 * Strip fields that the Anthropic API does not accept before every outbound
 * call.  Specifically:
 *  - 'thinking' and 'redacted_thinking' blocks from assistant messages
 *    (re-sending them causes HTTP 400 "Invalid data in redacted_thinking block")
 *  - Extra client-side fields ('hidden', 'meta', etc.) from all messages
 */
function sanitizeMessagesForAPI(messages) {
  return messages.map(msg => {
    const clean = { role: msg.role };
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      clean.content = msg.content.filter(
        b => b.type !== 'thinking' && b.type !== 'redacted_thinking'
      );
    } else {
      clean.content = msg.content;
    }
    return clean;
  });
}

// ─── Anthropic Core Call ─────────────────────────────────────────────────────

async function callAnthropic(
  apiKey,
  { model, system, messages, tools, maxTokens, signal }
) {
  const body = {
    model: model || ANTHROPIC_API.MODEL_DEFAULT,
    max_tokens: maxTokens || 4096,
    messages,
  };
  if (system) body.system = system;
  if (tools && tools.length > 0) body.tools = tools;

  const MAX_RETRIES = 1;
  const RETRY_DELAY_MS = 600;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }

    const response = await fetch(ANTHROPIC_API.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API.VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal,
    });

    // Retry once on transient server/rate-limit errors
    if ((response.status === 429 || response.status === 503) &&
        attempt < MAX_RETRIES) {
      continue;
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody?.error?.message || `Anthropic API error: ${response.status}`
      );
    }
    return response.json();
  }
}

// ─── OpenAI Format Conversion Helpers ────────────────────────────────────────

/**
 * Convert Anthropic-format tool definitions to OpenAI function-call format.
 * Anthropic: { name, description, input_schema }
 * OpenAI:    { type: 'function', function: { name, description, parameters } }
 */
export function toOpenAITools(anthropicTools) {
  return (anthropicTools || []).map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

/**
 * Convert our internal Anthropic-style messages array to the OpenAI messages array.
 * Handles: plain user strings, tool_result blobs, assistant text+tool_use blocks.
 */
function toOpenAIMessages(systemPrompt, messages) {
  const result = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        result.push({ role: 'user', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Tool results — one OpenAI "tool" message per result
        for (const block of msg.content) {
          if (block.type === 'tool_result') {
            result.push({
              role: 'tool',
              tool_call_id: block.tool_use_id,
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
            });
          }
        }
      }
    } else if (msg.role === 'assistant') {
      const blocks = Array.isArray(msg.content) ? msg.content : [];
      const textBlocks = blocks.filter(b => b.type === 'text');
      const toolBlocks  = blocks.filter(b => b.type === 'tool_use');

      const openaiMsg = {
        role: 'assistant',
        content: textBlocks.map(b => b.text).join('') || null,
      };

      if (toolBlocks.length > 0) {
        openaiMsg.tool_calls = toolBlocks.map(b => ({
          id: b.id,
          type: 'function',
          function: {
            name: b.name,
            arguments: JSON.stringify(b.input),
          },
        }));
      }

      result.push(openaiMsg);
    }
  }

  return result;
}

/**
 * Convert an OpenAI assistant message to Anthropic-style.
 * { role, content, tool_calls } → { role: 'assistant', content: [text?, tool_use*] }
 */
function fromOpenAIAssistant(msg) {
  const blocks = [];
  if (msg.content) blocks.push({ type: 'text', text: msg.content });
  for (const tc of msg.tool_calls || []) {
    let input = {};
    try { input = JSON.parse(tc.function.arguments); } catch { /* malformed */ }
    blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
  }
  return { role: 'assistant', content: blocks };
}

// ─── OpenAI Agent Turn ────────────────────────────────────────────────────────

/**
 * Run a full agent turn against the OpenAI API (function-calling loop).
 * Stores messages in Anthropic-style format for UI compatibility.
 *
 * Same signature as runAgentTurn — provider-transparent to the caller.
 */
export async function runOpenAIAgentTurn({
  apiKey, systemPrompt, messages, tools, model,
  executeToolFn, onStep, signal,
}) {
  const allMessages = [...messages];
  const openaiTools = toOpenAITools(tools);
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const openaiMessages = toOpenAIMessages(systemPrompt, allMessages);

    let data;
    try {
      const resp = await fetch(OPENAI_COMPLETIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: model || OPENAI_DEFAULT_MODEL,
          messages: openaiMessages,
          tools: openaiTools.length > 0 ? openaiTools : undefined,
          tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `OpenAI API error: ${resp.status}`);
      }
      data = await resp.json();
    } catch (err) {
      if (onStep) onStep({ type: 'error', error: err });
      throw err;
    }

    const choice    = data.choices[0];
    const rawMsg    = choice.message;
    const assistantMsg = fromOpenAIAssistant(rawMsg);

    allMessages.push(assistantMsg);
    if (onStep) onStep({ type: 'assistant', message: assistantMsg });

    const toolCalls = rawMsg.tool_calls || [];
    if (toolCalls.length === 0 || choice.finish_reason === 'stop') break;

    const toolResultContents = [];
    for (const tc of toolCalls) {
      let input = {};
      try { input = JSON.parse(tc.function.arguments); } catch { /* malformed */ }

      if (onStep) onStep({ type: 'tool_start', id: tc.id, name: tc.function.name, input });

      let result;
      try {
        result = await executeToolFn(tc.function.name, input);
      } catch (e) {
        result = { error: `Tool execution failed: ${e.message}` };
      }

      if (onStep) onStep({ type: 'tool_result', id: tc.id, name: tc.function.name, result });

      toolResultContents.push({
        type: 'tool_result',
        tool_use_id: tc.id,
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      });
    }

    allMessages.push({ role: 'user', content: toolResultContents });
  }

  return allMessages;
}

// ─── Anthropic Agent Turn ─────────────────────────────────────────────────────

export async function runAgentTurn({
  apiKey, systemPrompt, messages, tools, model,
  executeToolFn, onStep, signal,
}) {
  const allMessages = [...messages];
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response;
    try {
      response = await callAnthropic(apiKey, {
        model,
        system: systemPrompt,
        messages: sanitizeMessagesForAPI(allMessages),
        tools,
        signal,
      });
    } catch (err) {
      if (onStep) onStep({ type: 'error', error: err });
      throw err;
    }

    const assistantMsg = { role: 'assistant', content: response.content };
    allMessages.push(assistantMsg);
    if (onStep) onStep({ type: 'assistant', message: assistantMsg });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') break;

    const toolResultContents = [];
    for (const block of toolUseBlocks) {
      if (onStep) onStep({ type: 'tool_start', id: block.id, name: block.name, input: block.input });

      let result;
      try {
        result = await executeToolFn(block.name, block.input);
      } catch (e) {
        result = { error: `Tool execution failed: ${e.message}` };
      }

      if (onStep) onStep({ type: 'tool_result', id: block.id, name: block.name, result });

      toolResultContents.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      });
    }

    allMessages.push({ role: 'user', content: toolResultContents });
  }

  return allMessages;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractFinalText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      const textBlocks = (Array.isArray(msg.content) ? msg.content : [])
        .filter(b => b.type === 'text');
      if (textBlocks.length > 0) return textBlocks.map(b => b.text).join('\n');
    }
  }
  return '';
}

export function extractToolCalls(messages) {
  const calls = [];
  const resultMap = {};

  for (const msg of messages) {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_result') {
          resultMap[block.tool_use_id] = block.content;
        }
      }
    }
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_use') {
          calls.push({ id: block.id, name: block.name, input: block.input });
        }
      }
    }
  }

  return calls.map(c => ({ ...c, result: resultMap[c.id] ?? null }));
}



