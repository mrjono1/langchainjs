# Zod compatibility tests

Regression tests for TypeScript behavior when consumers use Zod 4 with `@langchain/core` and `langchain`.

## Test scenarios

| Test       | Consumer zod             | What it tests                                          |
| ---------- | ------------------------ | ------------------------------------------------------ |
| `zod-v4`   | `^4.3.6`                 | Core types + agent APIs with a normal zod@4 install    |
| `zod4-dup` | `4.3.6` + nested `4.1.x` | OOM regression — two physical zod@4 copies in the tree |

## What's tested

Each test simulates a consumer app using `@langchain/core` and `langchain`:

- `tool()` with simple, nested, enum, and deeply-nested zod schemas
- `StructuredOutputParser.fromZodSchema()`
- `createMiddleware()` with `stateSchema` and `beforeAgent`/`beforeModel` hooks
- `createAgent()` — basic, with middleware, with `responseFormat`, with `stateSchema`, kitchen sink
- `toolStrategy()` and `providerStrategy()` with zod schemas

No internal type utilities are imported — only public consumer-facing APIs.

## Running

```bash
bash environment_tests/test-zod-compat/run.sh
```

The script builds `langchain`, packs `@langchain/core` and `langchain`, installs each scenario, and runs `tsc --noEmit` with a 120s timeout and 512MB heap limit.

## zod4-dup layout

After install, `run.sh` extracts a second zod version under `@langchain/core/node_modules/zod` so TypeScript resolves two distinct copies of zod's `.d.ts` files. Exported types use structural interfaces without importing nominal types from `zod`, so checking stays fast.
