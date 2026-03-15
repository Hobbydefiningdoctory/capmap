import 'dotenv/config'
import { generate, validate } from '../src/index'
import { matchWithLLM } from '../src/matcher'

const config = require('../conduit.config.js')

const apiKey = process.env.DEEPSEEK_API_KEY
if (!apiKey) {
  console.error('Missing DEEPSEEK_API_KEY — add it to your Replit Secrets.')
  process.exit(1)
}

async function deepseekLLM(prompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${err}`)
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0].message.content
}

async function main() {
  const manifest = generate(config)

  const validation = validate(manifest)
  if (!validation.valid) {
    console.error('Manifest errors:', validation.errors)
    process.exit(1)
  }

  console.log(`\n✓ Manifest valid — ${manifest.capabilities.length} capabilities`)
  console.log('  Model: deepseek-chat\n')
  console.log('─'.repeat(60))

  const queries = [
    // Previously vague — LLM should handle these
    'What is everyone writing about?',
    'I want to read something',
    'Who is techwriter42?',
    'Show me johndoe',
    'Open introduction-to-react',

    // Clear matches
    'Show me the latest articles',
    'My personal feed',
    'Get profile for johndoe',

    // Should stay out of scope
    'Is the server down?',
    'Delete my account',
    'What is the weather today?',
    'Send an email to john',
  ]

  let matched    = 0
  let outOfScope = 0

  for (const query of queries) {
    process.stdout.write(`\n  ⋯  "${query}"\n`)

    const result = await matchWithLLM(query, manifest, { llm: deepseekLLM })

    const status = result.capability ? '✓' : '○'
    const name   = result.capability ? result.capability.id : 'OUT_OF_SCOPE'

    console.log(`  ${status}  → ${name}  (${result.confidence}%)`)
    console.log(`     ${result.reasoning}`)

    if (result.capability) matched++
    else outOfScope++
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`\n  Total:        ${queries.length}`)
  console.log(`  Matched:      ${matched}`)
  console.log(`  Out of scope: ${outOfScope}`)
  console.log()
}

main().catch(console.error)
