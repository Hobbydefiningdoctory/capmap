import 'dotenv/config'
import { generate, matchWithLLM } from '../src/index'
import { CapmanEngine } from '../src/engine'
import type { CapmanConfig } from '../src/types'

// ── Config ────────────────────────────────────────────────────────────────────

const config: CapmanConfig = {
  app: 'conduit',
  baseUrl: 'https://conduit.productionready.io/api',
  capabilities: [
    {
      id: 'get_global_articles',
      name: 'Get global articles',
      description: 'Fetch a list of all articles from the global feed.',
      examples: ['Show me the latest articles', 'Get all articles', 'List recent posts'],
      params: [
        { name: 'tag', description: 'Filter by tag', required: false, source: 'user_query' },
      ],
      returns: ['articles'],
      resolver: { type: 'api', endpoints: [{ method: 'GET', path: '/articles' }] },
      privacy: { level: 'public' },
    },
    {
      id: 'get_user_profile',
      name: 'Get user profile',
      description: 'Fetch the public profile of a user by their username.',
      examples: ['Show profile for johndoe', 'Who is techwriter42?'],
      params: [
        { name: 'username', description: 'Username to look up', required: true, source: 'user_query' },
      ],
      returns: ['profile'],
      resolver: { type: 'api', endpoints: [{ method: 'GET', path: '/profiles/{username}' }] },
      privacy: { level: 'public' },
    },
    {
      id: 'get_personal_feed',
      name: 'Get personal feed',
      description: 'Fetch articles from authors the current user follows.',
      examples: ['My feed', 'Articles from people I follow'],
      params: [],
      returns: ['articles'],
      resolver: { type: 'api', endpoints: [{ method: 'GET', path: '/articles/feed' }] },
      privacy: { level: 'user_owned' },
    },
    {
      id: 'navigate_to_article',
      name: 'Navigate to article',
      description: 'Route the user to a specific article page.',
      examples: ['Take me to article how-to-train-your-dragon', 'Open article intro-to-react'],
      params: [
        { name: 'slug', description: 'Article slug', required: true, source: 'user_query' },
      ],
      returns: ['deep_link'],
      resolver: { type: 'nav', destination: '/#/article/{slug}' },
      privacy: { level: 'public' },
    },
  ],
}

const manifest = generate(config)

// ── OpenRouter LLM function ───────────────────────────────────────────────────

const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

async function openrouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer':  'https://github.com/capman-ai/capman',
    },
    body: JSON.stringify({
      model:      OPENROUTER_MODEL,
      max_tokens: 500,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json() as any
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`)
  return data.choices[0].message.content
}

// ── Replit AI fallback (OpenAI-compatible proxy) ──────────────────────────────

async function replitAI(prompt: string): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  if (!baseUrl || !apiKey) throw new Error('Replit AI env vars not set')

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      'gpt-4o-mini',
      max_tokens: 500,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json() as any
  if (!res.ok) throw new Error(`Replit AI ${res.status}: ${JSON.stringify(data)}`)
  return data.choices[0].message.content
}

// ── Auto-detect which LLM is available ───────────────────────────────────────

async function detectLLM(): Promise<{ fn: (p: string) => Promise<string>; name: string }> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      // Probe with a minimal request — if the account/key works, use OpenRouter
      const probe = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer':  'https://github.com/capman-ai/capman',
        },
        body: JSON.stringify({
          model:      OPENROUTER_MODEL,
          max_tokens: 5,
          messages:   [{ role: 'user', content: 'hi' }],
        }),
      })
      const pd = await probe.json() as any
      if (probe.ok) {
        return { fn: openrouter, name: `OpenRouter — ${OPENROUTER_MODEL}` }
      }
      console.warn(`  ⚠  OpenRouter unavailable (${pd.error?.message ?? probe.status}) — falling back to Replit AI`)
    } catch {
      console.warn('  ⚠  OpenRouter probe failed — falling back to Replit AI')
    }
  }
  return { fn: replitAI, name: 'Replit AI — gpt-4o-mini' }
}

// ── Test queries ──────────────────────────────────────────────────────────────

const queries = [
  // Vague — keyword matcher struggles, LLM should handle
  'What is everyone writing about?',
  'I want to read something interesting',
  'Who is techwriter42?',
  'Show me johndoe',
  // Clear — both should handle
  'Take me to article how-to-train-your-dragon',
  'My personal feed',
  // Out of scope
  'Is the server down?',
  'Send an email to john',
]

async function run() {
  const llm = await detectLLM()

  console.log('\n✓ Manifest ready —', manifest.capabilities.length, 'capabilities')
  console.log('  Model:', llm.name, '\n')
  console.log('─'.repeat(60))

  // Test 1: matchWithLLM directly
  console.log('\n── Direct LLM matching:\n')
  for (const query of queries) {
    const result = await matchWithLLM(query, manifest, { llm: llm.fn })
    const status = result.capability ? '✓' : '○'
    const name   = result.capability?.id ?? 'OUT_OF_SCOPE'
    console.log(`  ${status}  "${query}"`)
    console.log(`     → ${name} (${result.confidence}%)`)
    console.log(`     → ${result.reasoning}`)
    if (result.capability && Object.keys(result.extractedParams).length) {
      console.log(`     → params: ${JSON.stringify(result.extractedParams)}`)
    }
    console.log()
  }

  // Test 2: CapmanEngine in accurate mode
  console.log('─'.repeat(60))
  console.log('\n── CapmanEngine (accurate mode):\n')

  const engine = new CapmanEngine({
    manifest,
    mode: 'accurate',
    llm: llm.fn,
    cache: false,
    learning: false,
  })

  const result = await engine.ask('What is everyone writing about today?', { dryRun: true })
  console.log('  Query: "What is everyone writing about today?"')
  console.log('  Matched:', result.match.capability?.id ?? 'OUT_OF_SCOPE')
  console.log('  Confidence:', result.match.confidence + '%')
  console.log('  Resolved via:', result.resolvedVia)
  console.log('  Reasoning:', result.trace.reasoning)
  console.log('  Steps:', result.trace.steps.map(s => `${s.type}(${s.status})`).join(' → '))
  console.log()
}

run().catch(console.error)