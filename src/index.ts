export { setLogLevel } from './logger'
export type { LogLevel } from './logger'
import { CapmanEngine } from './engine'
import { match as _match, matchWithLLM as _matchWithLLM } from './matcher'
import { resolve as _resolve } from './resolver'
import type { Manifest, MatchResult, ResolveResult } from './types'
import type { LLMMatcherOptions } from './matcher'
import type { ResolveOptions } from './resolver'

export type {
  Capability,
  CapabilityParam,
  CapmanConfig,
  Manifest,
  MatchResult,
  ExecutionTrace,
  TraceStep,
  MatchCandidate,
  ResolveResult,
  ApiCallResult,
  ValidationResult,
  Resolver,
  ApiResolver,
  NavResolver,
  HybridResolver,
  PrivacyScope,
  ResolverType,
  HttpMethod,
} from './types'

export {
  generate,
  loadConfig,
  writeManifest,
  readManifest,
  validate,
  generateStarterConfig,
} from './generator'

export {
  match,
  matchWithLLM,
} from './matcher'
export type { LLMMatcherOptions } from './matcher'

export { resolve } from './resolver'
export type { ResolveOptions, AuthContext } from './resolver'

// ─── Convenience: ask() — match + resolve in one call ────────────────────────


export type MatchMode = 'cheap' | 'balanced' | 'accurate'

// ─── Engine (recommended API) ─────────────────────────────────────────────────
export { CapmanEngine } from './engine'
export type { EngineOptions, EngineResult } from './engine'

// ─── Cache ────────────────────────────────────────────────────────────────────
export { MemoryCache, FileCache, ComboCache } from './cache'
export type { CacheStore, CacheEntry } from './cache'

// ─── Learning ─────────────────────────────────────────────────────────────────
export { FileLearningStore, MemoryLearningStore } from './learning'
export type { LearningStore, LearningEntry, KeywordStats } from './learning'

export interface AskOptions extends ResolveOptions {
  llm?: LLMMatcherOptions['llm']
  /**
   * Controls how intent matching is performed.
   *
   * - 'cheap'    — keyword matching only. No LLM calls. Free but less accurate.
   * - 'balanced' — keyword first. Falls back to LLM if confidence < 50%. (default)
   * - 'accurate' — LLM first. Falls back to keyword if LLM call fails.
   *
   * @default 'balanced'
   */
  mode?: MatchMode
}

export interface AskOptions extends ResolveOptions {
  llm?: LLMMatcherOptions['llm']
  mode?: MatchMode
}

export interface AskResult {
  match: MatchResult
  resolution: ResolveResult
}

/**
 * One-shot convenience: match + resolve in a single call.
 * Delegates to CapmanEngine internally.
 *
 * @example
 * const result = await ask("show me the dashboard", manifest, {
 *   baseUrl: 'https://api.your-app.com',
 * })
 *
 * @deprecated For full features including trace and caching, use CapmanEngine directly.
 */

export async function ask(
  query: string,
  manifest: Manifest,
  options: AskOptions = {}
): Promise<AskResult> {
  const { llm, mode, ...resolveOptions } = options

  const engine = new CapmanEngine({
    manifest,
    llm,
    mode,
    cache: false,
    learning: false,
    baseUrl: resolveOptions.baseUrl,
    auth: resolveOptions.auth,
    headers: resolveOptions.headers,
  })

  const result = await engine.ask(query, resolveOptions)
  return { match: result.match, resolution: result.resolution }
}