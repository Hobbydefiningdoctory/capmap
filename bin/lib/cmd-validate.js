'use strict'

const { header, log, c, getFlag, requireSrc } = require('./shared')

module.exports = function cmdValidate() {
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
