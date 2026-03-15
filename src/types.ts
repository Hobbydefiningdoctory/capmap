// ─── Resolver Types ───────────────────────────────────────────────────────────

export type ResolverType = 'api' | 'nav' | 'hybrid'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// ─── Parameter Definition ─────────────────────────────────────────────────────

export interface CapabilityParam {
  name: string
  description: string
  required: boolean
  source: 'user_query' | 'session' | 'context' | 'static'
  default?: string | number | boolean
}

// ─── Resolver Configs ─────────────────────────────────────────────────────────

export interface ApiResolver {
  type: 'api'
  endpoints: Array<{
    method: HttpMethod
    path: string
    params?: string[]
  }>
}

export interface NavResolver {
  type: 'nav'
  destination: string
  hint?: string
}

export interface HybridResolver {
  type: 'hybrid'
  api: Omit<ApiResolver, 'type'>
  nav: Omit<NavResolver, 'type'>
}

export type Resolver = ApiResolver | NavResolver | HybridResolver

// ─── Privacy Scope ────────────────────────────────────────────────────────────

export interface PrivacyScope {
  level: 'public' | 'user_owned' | 'admin'
  note?: string
}

// ─── Capability Definition ────────────────────────────────────────────────────

export interface Capability {
  id: string
  name: string
  description: string
  examples?: string[]
  params: CapabilityParam[]
  returns: string[]
  resolver: Resolver
  privacy: PrivacyScope
}

// ─── Manifest ─────────────────────────────────────────────────────────────────

export interface Manifest {
  version: string
  app: string
  generatedAt: string
  capabilities: Capability[]
}

// ─── Config File ──────────────────────────────────────────────────────────────

export interface CapmanConfig {
  app: string
  baseUrl?: string
  capabilities: Capability[]
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface MatchResult {
  capability: Capability | null
  confidence: number
  intent: 'navigation' | 'retrieval' | 'hybrid' | 'out_of_scope'
  extractedParams: Record<string, string | null>
  reasoning: string
}

// ─── Resolve Result ───────────────────────────────────────────────────────────

export interface ResolveResult {
  success: boolean
  resolverType: ResolverType | null
  apiCalls?: Array<{ method: string; url: string; params: Record<string, unknown> }>
  navTarget?: string
  error?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}