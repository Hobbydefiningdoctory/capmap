import { generate, match, resolve } from '../src/index'
import type { CapmanConfig } from '../src/types'

const config: CapmanConfig = {
  app: 'my-app',
  baseUrl: 'https://api.my-app.com',
  capabilities: [
    {
      id: 'get_resource',
      name: 'Get a resource',
      description: 'Fetch a specific resource by name, ID, or filter from the app.',
      examples: [
        'Show me the resource details',
        'Find resource by ID',
        'Look up resource by name',
      ],
      params: [
        {
          name: 'resource_id',
          description: 'The ID or name of the resource',
          required: true,
          source: 'user_query',
        },
      ],
      returns: ['resource', 'metadata'],
      resolver: {
        type: 'api',
        endpoints: [{ method: 'GET', path: '/resources/{resource_id}' }],
      },
      privacy: { level: 'public' },
    },
    {
      id: 'navigate_to_screen',
      name: 'Navigate to a screen',
      description: 'Route the user to a specific page or section in the app.',
      examples: [
        'Take me to the dashboard',
        'Open settings',
        'Go to my profile',
      ],
      params: [
        {
          name: 'destination',
          description: 'The screen or page to navigate to',
          required: true,
          source: 'user_query',
        },
      ],
      returns: ['deep_link'],
      resolver: { type: 'nav', destination: '{destination}' },
      privacy: { level: 'public' },
    },
    {
      id: 'get_user_data',
      name: 'Get user data',
      description: 'Retrieve data belonging to the currently authenticated user.',
      examples: [
        'Show my account details',
        'What is my current plan?',
        'Show my recent activity',
      ],
      params: [
        {
          name: 'user_id',
          description: 'Current user ID',
          required: true,
          source: 'session',
        },
      ],
      returns: ['user_data'],
      resolver: {
        type: 'api',
        endpoints: [{ method: 'GET', path: '/users/{user_id}' }],
      },
      privacy: { level: 'user_owned', note: 'Requires auth' },
    },
  ],
}

// ── Generate manifest ─────────────────────────────────────────────────────────
const manifest = generate(config)
console.log(`\n✓ Manifest generated for "${manifest.app}"`)
console.log(`  ${manifest.capabilities.length} capabilities registered\n`)

// ── Test queries ──────────────────────────────────────────────────────────────
const queries = [
  'Find resource by ID',
  'Take me to the dashboard',
  'Show my account details',
  'Is the server down?',
]

console.log('─── Matching queries:\n')

for (const query of queries) {
  const result = match(query, manifest)
  console.log(`  Query:      "${query}"`)
  if (result.capability) {
    console.log(`  Matched:    ${result.capability.id}`)
    console.log(`  Intent:     ${result.intent}`)
    console.log(`  Confidence: ${result.confidence}%`)
  } else {
    console.log(`  Matched:    OUT_OF_SCOPE`)
    console.log(`  Reason:     ${result.reasoning}`)
  }
  console.log()
}

// ── Test resolve ──────────────────────────────────────────────────────────────
async function testResolve() {
  console.log('─── Resolving a match:\n')

  const matchResult = match('Find resource by ID', manifest)
  const resolution  = await resolve(
    matchResult,
    { resource_id: '42' },
    { baseUrl: 'https://api.my-app.com', dryRun: true }
  )

  console.log(`  Success:      ${resolution.success}`)
  console.log(`  Resolver:     ${resolution.resolverType}`)
  if (resolution.apiCalls) {
    for (const call of resolution.apiCalls) {
      console.log(`  API call:     ${call.method} ${call.url}`)
    }
  }
  console.log()
}

testResolve().catch(console.error)