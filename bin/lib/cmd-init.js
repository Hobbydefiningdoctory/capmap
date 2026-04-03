'use strict'

const path = require('path')
const fs   = require('fs')
const { header, log, c, requireSrc } = require('./shared')

module.exports = function cmdInit() {
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
  console.log(`\n    npx capman generate\n`)
}
