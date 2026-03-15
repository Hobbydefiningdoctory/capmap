# Contributing to capman

Thank you for your interest in contributing! This guide will help you get started.

---

## Getting Started

### Prerequisites

- Node.js v24+
- pnpm (package manager)
- TypeScript familiarity

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd capman

# Install dependencies
pnpm install

# Build the project
npm run build
```

---

## Project Structure

```
capman/
├── src/
│   ├── index.ts        # Public API — exports generate, match, resolve, ask
│   ├── types.ts        # All TypeScript interfaces and types
│   ├── generator.ts    # Manifest generation and validation
│   ├── matcher.ts      # Keyword and LLM-based query matching
│   └── resolver.ts     # Capability resolution (API, nav, hybrid)
├── bin/
│   └── capman.js       # CLI entry point
├── examples/
│   └── basic.ts        # End-to-end usage example
├── test/
│   ├── conduit.config.js       # Test app config (Conduit blog)
│   ├── test-conduit.ts         # Keyword matcher tests
│   └── test-conduit-llm.ts     # LLM matcher tests
└── dist/               # Compiled output (do not edit)
```

---

## Development Workflow

### Making Changes

1. Edit files in `src/`
2. Rebuild: `npm run build`
3. Run the example to verify: `npm run example`
4. Run the test suite manually:

```bash
npx tsx test/test-conduit.ts
npx tsx test/test-conduit-llm.ts
```

### Watching for Changes

```bash
npm run dev   # runs tsc --watch
```

---

## Adding a New Capability

1. Open `test/conduit.config.js` (or your own config file)
2. Add a new entry to the `capabilities` array:

```js
{
  id: 'my_capability',
  name: 'My Capability',
  description: 'What this capability does.',
  examples: [
    'Example query one',
    'Example query two',
  ],
  params: [
    {
      name: 'param_name',
      description: 'Description of the param',
      required: true,
      source: 'user_query', // or 'session'
    },
  ],
  returns: ['result_type'],
  resolver: {
    type: 'api',  // 'api' | 'nav' | 'hybrid'
    endpoints: [{ method: 'GET', path: '/my-endpoint/{param_name}' }],
  },
  privacy: { level: 'public' }, // 'public' | 'user_owned' | 'private'
}
```

3. Regenerate the manifest: `node bin/capman.js generate`
4. Validate: `node bin/capman.js validate`

---

## Extending the Codebase

### Adding a New Resolver Type

1. Add the type to `src/types.ts` under `ResolverType`
2. Add a new resolver interface (e.g. `MyResolver`) and include it in the `Resolver` union
3. Handle the new type in `src/resolver.ts`

### Improving the Matcher

- **Keyword matcher** — edit `scoreCapability()` in `src/matcher.ts`
- **LLM matcher** — edit the prompt template in `matchWithLLM()` in `src/matcher.ts`
- The confidence threshold (default: `50`) is defined in both `match()` and `ask()`

---

## Code Style

- TypeScript strict mode is enabled — all types must be explicit
- No default exports — use named exports only
- Keep functions small and single-purpose
- Format with Prettier before committing:

```bash
npx prettier --write src/
```

---

## Submitting a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and rebuild: `npm run build`
4. Verify everything works: `npm run example`
5. Commit with a clear message: `git commit -m "feat: add X capability"`
6. Push and open a pull request against `main`

### Commit Message Format

```
feat:     new feature
fix:      bug fix
refactor: code restructure without behaviour change
docs:     documentation only
chore:    build, tooling, or config changes
```

---

## Questions?

Open an issue or start a discussion in the repository.
