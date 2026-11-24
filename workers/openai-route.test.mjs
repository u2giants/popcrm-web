import { describe, it, expect } from 'vitest'
import { chatCompletionTarget } from './crm-worker-supabase.mjs'

const env = { OPENAI_API_KEY: 'test-openai', OPENROUTER_API_KEY: 'test-openrouter' }

describe('chatCompletionTarget', () => {
  it('sends OpenAI models directly to OpenAI by default', () => {
    expect(chatCompletionTarget('openai/gpt-5.4-mini', env)).toMatchObject({ provider: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', key: 'test-openai', model: 'gpt-5.4-mini' })
  })
  it('switches OpenAI models back to OpenRouter with OPENAI_ROUTE=openrouter', () => {
    expect(chatCompletionTarget('openai/gpt-5.4', { ...env, OPENAI_ROUTE: 'OpenRouter' })).toMatchObject({ provider: 'OpenRouter', key: 'test-openrouter', model: 'openai/gpt-5.4' })
  })
  it('keeps non-OpenAI models on OpenRouter', () => {
    expect(chatCompletionTarget('google/gemini-3-flash-preview', env)).toMatchObject({ provider: 'OpenRouter', model: 'google/gemini-3-flash-preview' })
  })
})
