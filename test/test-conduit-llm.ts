import { generate, matchWithLLM, validate } from '../src/index'

require('dotenv').config()

const config = require('./conduit.config.js')
const manifest = generate(config)

const validation = validate(manifest)
if (!validation.valid) {
  console.error('Manifest errors:', validation.errors)
  process.exit(1)
}

console.log(`\n✓ Manifest valid — ${manifest.capabilities.length} capabilities`)
console.log(`  Using DeepSeek LLM matcher\n`)
console.log('─'.repeat(60))

// The vague queries that failed keyword matching
const vagueQueries = [
  'What is everyone writing about?',
  'I want to read something',
  'Who is techwriter42?',
  'Show me johndoe',
  'Open introduction-to-react',

  // These should still be out of scope even with LLM
  'Is the server down?',
  'Delete my account',
  'What is the weather today?',
  'Send an email to john',
]

// DeepSeek LLM function
async function deepseek(prompt: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json() as any
  return data.choices[0].message.content
}

async function run() {
  let matched    = 0
  let outOfScope = 0

  for (const query of vagueQueries) {
    const result = await matchWithLLM(query, manifest, { llm: deepseek })

    const status = result.capability ? '✓' : '○'
    const name   = result.capability ? result.capability.id : 'OUT_OF_SCOPE'

    console.log(`\n  ${status}  "${query}"`)
    console.log(`     → ${name}  (${result.confidence}%)`)
    console.log(`     reasoning: ${result.reasoning}`)

    if (result.capability) matched++
    else outOfScope++
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`\n  Total:        ${vagueQueries.length}`)
  console.log(`  Matched:      ${matched}`)
  console.log(`  Out of scope: ${outOfScope}`)
  console.log()
}

run().catch(console.error)