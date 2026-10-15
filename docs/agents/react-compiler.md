# React Compiler (experimental)

Both integrations are opt-in-friendly and toggleable. Goal is exploration + filing upstream bugs, not shipping stable behavior.

- **Build compilation** — `scripts/build.ts` passes `reactCompiler: true` to `Bun.build` (Bun 1.4+ native, no Babel/plugin). Produces `_c(N)` memo cache calls + `react/compiler-runtime` imports in `dist/`. Off via `REACT_COMPILER=0`. Runs **only in the prod bundler** — `bun --hot` dev server uses the runtime transpiler and is unaffected (DevTools "Memo ✨" badge visible on a prod build, not in dev). Supported compiler bailouts fall back to original source; compiler or bundler errors can still fail the build. Known limit: sourcemaps map to the compiled intermediate, not original lines. The Dockerfile builds with `bun run build`.
- **Lint diagnostics** — Bun lint enforces React Hooks rules. The former Biome-specific React Compiler diagnostic has no configured native equivalent; compiler bailouts and build failures remain visible during `bun run build`.
- **Types** — `@types/bun` declares `reactCompiler`/`reactCompilerOutputMode` on `BuildConfig`. Build scripts and tooling configs are included in `bun run typecheck`.
- **Verify it ran** — `rm -rf dist && bun run build && F=$(ls dist/chunk-*.js) && grep -c memo_cache_sentinel "$F"` → expect `2` (compiler on). With `REACT_COMPILER=0` expect `1`. Under minify the `react/compiler-runtime` import string is renamed, so the `memo_cache_sentinel` count is the robust signal (the delta vs the 1-sentinel React baseline).
- **File bugs at** — https://github.com/oven-sh/bun/issues (compiler output correctness, fallback behavior, or lint diagnostics).
