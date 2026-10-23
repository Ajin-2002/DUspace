# DUspace Phase 2: Project Analyzer Plan

## Repository findings

- Phase 1 stores imported files in a private snapshot and records a per-file manifest in MongoDB.
- Workspace API routes already enforce developer ownership; imports complete synchronously and expose a real ready state.
- There is no worker or durable queue. The old developer project analyze flow is a timed UI and calls the legacy app detector.
- The existing imported workspace detail page is the right place to start analysis and review results.

## Implementation plan

1. Add versioned analysis job, blueprint and finding collections linked to a workspace and owner.
2. Build a deterministic, bounded scanner that validates the ready snapshot and manifest, then inventories files and extracts framework, dependency, route, UI, backend, auth and static quality evidence. Use the TypeScript parser for JS/TS syntax and conservative text extractors elsewhere.
3. Add a separate polling worker process. API requests enqueue durable jobs; the worker claims jobs atomically, reports stage progress, supports cancellation/retry, and preserves prior completed blueprint versions.
4. Add authenticated, owner-scoped project/job/report/finding endpoints with pagination and validation.
5. Extend the imported workspace detail page with real status, progress, report tabs, findings and analysis history.
6. Add scanner fixtures and document worker commands, limits, support coverage and the fact that advisory/AI checks remain unavailable unless a future provider is configured.

Uploaded source is treated only as data: the worker does not install packages, run scripts, execute code, or make network requests.
