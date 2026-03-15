#!/usr/bin/env node
'use strict'

const path = require('path')
const fs   = require('fs')

const args    = process.argv.slice(2)
const command = args[0]
const flags   = args.slice(1)

const getFlag = (name) => {
  const i = flags.indexOf(name)
  return i !== -1 ? flags[i + 1] : undefined
}

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  teal:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  gray:   '\x1b[90m',
}

const log = {
  info:    (...a) => console.log(`${c.teal}i${c.reset}`, ...a),
  success: (...a) => console.log(`${c.green}✓${c.reset}`, ...a),
  warn:    (...a) => console.log(`${c.yellow}⚠${c.reset}`, ...a),
  error:   (...a) => console.error(`${c.red}✗${c.reset}`, ...a),
  blank:   ()     => console.log(),
}

function header() {
  console.log()
  console.log(`${c.bold}${c.teal}  capman${c.reset} ${c.gray}v0.1.0 — Capability Manifest Engine${c.reset}`)
  console.log(`${c.gray}  ─────────────────────────────────────────${c.reset}`)
  console.log()
}

function requireSrc() {
  const distPath = path.join(__dirname, '..', 'dist', 'index.js')
  if (fs.existsSync(distPath)) return require(distPath)

  try {
    require('ts-node/register')
    return require(path.join(__dirname, '..', 'src', 'index.ts'))
  } catch {
    log.error('Cannot find dist/. Run: npx tsc')
    process.exit(1)
  }
}

function cmdHelp() {
  header()
  console.log(`${c.bold}  Usage:${c.reset}  node bin/capman.js <command>`)
  console.log()
  console.log(`${c.bold}  Commands:${c.reset}`)
  console.log(`    ${c.teal}init${c.reset}      Create a starter capman.config.js`)
  console.log(`    ${c.teal}generate${c.reset}  Generate manifest.json from config`)
  console.log(`    ${c.teal}validate${c.reset}  Validate an existing manifest.json`)
  console.log(`    ${c.teal}inspect${c.reset}   Print all capabilities in manifest`)
  console.log()
  console.log(`${c.bold}  Options:${c.reset}`)
  console.log(`    ${c.gray}--config    Path to config file  (default: capman.config.js)${c.reset}`)
  console.log(`    ${c.gray}--out       Output path          (default: manifest.json)${c.reset}`)
  console.log(`    ${c.gray}--manifest  Manifest to read     (default: manifest.json)${c.reset}`)
  console.log()
}

function cmdInit() {
  header()
  const outPath = path.resolve(process.cwd(), 'capman.config.js')
  if (fs.existsSync(outPath)) {
    log.warn('capman.config.js already exists — not overwriting.')
    process.exit(0)
  }
  const { generateStarterConfig } = requireSrc()
  fs.writeFileSync(outPath, generateStarterConfig())
  log.success(`Created ${c.bold}capman.config.js${c.reset}`)
  log.info(`Edit it with your app's capabilities, then run:`)
  console.log(`\n    node bin/capman.js generate\n`)
}

function cmdGenerate() {
  header()
  const { loadConfig, generate, writeManifest, validate } = requireSrc()

  const configPath = getFlag('--config')
  const outPath    = getFlag('--out') ?? 'manifest.json'

  log.info('Loading config...')
  let config
  try {
    config = loadConfig(configPath)
  } catch (e) {
    log.error(e.message)
    process.exit(1)
  }

  log.info(`Generating manifest for ${c.bold}${config.app}${c.reset}...`)
  const manifest = generate(config)
  const result   = validate(manifest)

  for (const w of result.warnings) log.warn(w)
  for (const e of result.errors)   log.error(e)

  if (!result.valid) {
    log.error('Manifest has errors — fix them before writing.')
    process.exit(1)
  }

  const written = writeManifest(manifest, outPath)
  log.blank()
  log.success(`Manifest written to ${c.bold}${written}${c.reset}`)
  log.info(`${manifest.capabilities.length} capabilities registered`)
  console.log()
}

function cmdValidate() {
  header()
  const { readManifest, validate } = requireSrc()

  const manifestPath = getFlag('--manifest') ?? 'manifest.json'
  let manifest
  try {
    manifest = readManifest(manifestPath)
  } catch (e) {
    log.error(e.message)
    process.exit(1)
  }

  log.info(`Validating ${c.bold}${manifestPath}${c.reset}...`)
  const result = validate(manifest)
  log.blank()

  for (const w of result.warnings) log.warn(w)
  for (const e of result.errors)   log.error(e)

  if (result.valid) {
    log.success(`${manifest.capabilities.length} capabilities — all valid`)
  } else {
    log.error(`${result.errors.length} error(s) found.`)
    process.exit(1)
  }
  console.log()
}

function cmdInspect() {
  header()
  const { readManifest } = requireSrc()

  const manifestPath = getFlag('--manifest') ?? 'manifest.json'
  let manifest
  try {
    manifest = readManifest(manifestPath)
  } catch (e) {
    log.error(e.message)
    process.exit(1)
  }

  console.log(`${c.bold}  App:${c.reset}          ${manifest.app}`)
  console.log(`${c.bold}  Generated:${c.reset}    ${manifest.generatedAt}`)
  console.log(`${c.bold}  Capabilities:${c.reset} ${manifest.capabilities.length}`)
  console.log()

  for (const cap of manifest.capabilities) {
    const col = cap.resolver.type === 'api' ? c.teal : cap.resolver.type === 'nav' ? c.teal : c.yellow
    console.log(`  ${c.bold}${cap.name}${c.reset}  ${col}[${cap.resolver.type}]${c.reset}  ${c.gray}${cap.privacy.level}${c.reset}`)
    console.log(`  ${c.gray}id: ${cap.id}${c.reset}`)
    console.log(`  ${cap.description}`)
    if (cap.examples?.length) {
      console.log(`  ${c.gray}e.g. "${cap.examples[0]}"${c.reset}`)
    }
    console.log()
  }
}

switch (command) {
  case 'init':     cmdInit();     break
  case 'generate': cmdGenerate(); break
  case 'validate': cmdValidate(); break
  case 'inspect':  cmdInspect();  break
  case undefined:
  case '--help':
  case '-h':       cmdHelp();     break
  default:
    header()
    log.error(`Unknown command: ${command}`)
    console.log(`  Run: node bin/capman.js --help\n`)
    process.exit(1)
}