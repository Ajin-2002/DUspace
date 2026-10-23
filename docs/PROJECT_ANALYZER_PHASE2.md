# Project Analyzer (Phase 2)

## Repository fit and processing model

The analyzer uses the Phase 1 ProjectWorkspace, ProjectWorkspaceImport and ProjectWorkspaceFile records. A job can only start for a developer-owned workspace whose latest import and private snapshot are both ready. The worker reads the server-owned manifest; it ignores client paths and stored storage keys when constructing filesystem paths.

The API process runs the durable queue poller alongside HTTP handling, so the configured API service processes jobs without a second deployment. A standalone worker command is available for deployments that share the same MongoDB and private snapshot storage. Job claims use an atomic MongoDB update. Multiple workers can safely compete for queued jobs.

Each worker validates the normalized manifest path, snapshot containment, regular-file type, byte totals and SHA-256 hash before analysis. Imported source is data only. The analyzer does not run project scripts, install packages, execute the application, render uploaded HTML, or make external network calls.

## Pipeline and progress

The job reports these stages: validation, inventory, framework detection, dependency analysis, source analysis, architecture analysis, UI analysis, quality checks and blueprint generation. Inventory and validation progress advances as files are completed; later stages advance when their actual pass completes. Cancellation is checked between files and stages. A configurable timeout bounds a running job.

Worker startup requeues stale jobs while attempts remain and marks repeatedly interrupted jobs failed. Failed and cancelled jobs can be retried; each new run gets a new version. Completed reports and findings remain attached to their job version. An active-job key and a unique project/version index prevent simultaneous duplicate jobs and duplicate report versions.

## Current detection coverage

- **JavaScript and TypeScript:** TypeScript compiler parser extracts static imports, exported JSX components, static JSX Route paths, literal Node route registrations, environment variable names, form and event-handler indicators, and parse diagnostics.
- **Framework evidence:** Next.js, React, React with Vite, Vite, Vue, Angular, Express, NestJS, FastAPI, Flask, Django and Laravel are detected from package or configuration evidence. HTML without recognized framework evidence is labeled Static HTML. Other projects receive generic file and language inventory.
- **Routes:** Next.js App Router page/layout/route files, Pages Router files, literal Node app/router/server HTTP method registrations, React Router JSX paths, Vue Router and Angular route objects with literal paths and route targets, common Python decorators and Django path declarations, and Laravel Route registrations are reported. Dynamic registration and alias expansion are not executed.
- **Dependencies:** npm manifests, package-lock resolved versions, requirements.txt and common PEP 621/Poetry pyproject declarations, Composer manifests, Cargo manifests and Go modules are read when available. TOML parsing is deliberately limited to static dependency sections. Package manager, lockfile, declared scripts, runtime versions and observed JS/TS imports are reported separately. A declared dependency is not treated as proof that code uses it.
- **UI inventory:** Page candidates, exported or named JSX candidates, navigation/header/sidebar/form roles, CSS/Sass/Tailwind and component-library indicators, token-file candidates and basic responsive markers are reported with source paths, evidence and confidence.
- **Languages:** Source extensions are counted for TypeScript, JavaScript, Python, PHP, Go, Rust, Java, Kotlin, Ruby, HTML, CSS, Sass, Less and SQL. Other files remain in the generic inventory.

Python, PHP and other non-JS structures currently use conservative text patterns. Vue Router and Angular routes are only extracted from static object literals with a literal path and a component, redirect or child-route field. There is no runtime route discovery.

## Quality and security checks

Current static checks include TypeScript/JavaScript parse diagnostics, missing relative import candidates, possible hard-coded secret patterns, dynamic eval/Function patterns, raw HTML rendering indicators, invalid package JSON, and missing supported lockfiles. Possible secret values are never copied into findings or blueprint fields; a finding contains only the relative file path and line number.

The checks do not prove a project is secure. TypeScript compiler diagnostics beyond parsing, ESLint, full secret scanners and vulnerability-advisory databases are not invoked. Dependency advisory coverage is labeled unavailable, and no package is reported as safe. AI analysis is not configured and does not block deterministic output.

## Blueprint version 1

ProjectBlueprint stores one immutable report per analysis job and version. The top-level document records project/owner/job references, schema version, analysis version and generation time. To stay below MongoDB's single-document size limit, the blueprint holds aggregate inventory counts while ProjectAnalysisFile stores the per-file inventory in indexed rows. Its validated blueprint data contains:

- **summary:** evidence-based description, primary framework and languages.
- **inventory:** source, asset, configuration, documentation, test and skipped-file counts and total bytes. Per-file path, extension, category, size, manifest hash and parse status are available through the paginated inventory endpoint.
- **technologies:** framework names, confidence and evidence.
- **architecture:** entry points, routes, layouts, API endpoints, data-model candidates, auth indicators, environment variable names and known integration packages.
- **uiInventory:** page/component/navigation/form candidates, styling systems, token files and responsive indicators.
- **dependencies:** direct and development declarations, observed imports, lockfile, sanitized scripts and declared runtime.
- **quality:** finding count, completed/skipped checks and limitations.
- **metadata:** generated time, complete/incomplete status and AI availability.

Source contents, environment values, secrets and private storage keys are not stored in the blueprint. Per-file content is streamed for hash verification and only bounded text is held briefly in worker memory for static parsing.

## API

All routes require a developer JWT. Project and job ownership is checked on each request.

| Method and path | Behavior |
| --- | --- |
| POST /api/v1/projects/:projectId/analyses | Queue analysis for a ready imported workspace; responds 202 with the job. |
| GET /api/v1/projects/:projectId/analyses | Paginated analysis history. |
| GET /api/v1/analyses/:analysisId | Job status, stage, actual progress, attempt and safe error. |
| GET /api/v1/analyses/:analysisId/report | Versioned blueprint once complete. |
| GET /api/v1/analyses/:analysisId/findings | Paginated findings; optional severity and category filters. |
| GET /api/v1/analyses/:analysisId/files | Paginated manifest inventory; optional path search and category filter. |
| POST /api/v1/analyses/:analysisId/cancel | Cancel a queued job or request cancellation at a running worker checkpoint. |
| POST /api/v1/analyses/:analysisId/retry | Queue a new version after failure or cancellation. |

The imported workspace detail page now displays status, progress, report tabs, history, retry/cancel controls and paginated findings. The older marketplace app detection flow remains separate.

## Limits and configuration

All analysis limits have conservative defaults:

| Variable | Default | Meaning |
| --- | ---: | --- |
| ANALYSIS_MAX_SOURCE_MB | 20 | Maximum total text loaded for source/config parsing; hashes still verify the full private snapshot. |
| ANALYSIS_TIMEOUT_SECONDS | 180 | Maximum duration for one worker attempt. |
| ANALYSIS_WORKER_CONCURRENCY | 1 | Worker loops per process, capped at 4. |
| ANALYSIS_MAX_ATTEMPTS | 3 | Maximum stale-worker recoveries before marking a job failed. |
| ANALYSIS_STALE_JOB_SECONDS | 900 | No-progress interval before a running job is considered interrupted. |

File count and total bytes also honor the Phase 1 PROJECT_MAX_FILES and PROJECT_MAX_EXTRACTED_MB limits. Text files over 512 KiB are inventoried and hashed but not parsed. The analyzer retains only bounded file text in memory and never puts source contents in MongoDB.

For browser uploads, NEXT_PUBLIC_API_URL must point to the reachable API origin in the frontend deployment. Set API CLIENT_URL to the frontend origin, or CLIENT_URLS to a comma-separated list of allowed frontend origins. Use the deployed HTTPS API URL in the frontend and the deployed HTTPS frontend origin in the API. A localhost API URL is only suitable when the browser is running against the same machine.

## Running and testing

From the repository root, run:

    pnpm --filter api dev
    pnpm --filter api dev:worker
    pnpm --filter api test
    pnpm --filter api build
    pnpm --filter web lint
    pnpm --filter web build

The API starts its queue poller by default. dev:worker or worker runs an additional worker process for local or separately scaled deployments; it must use the same MongoDB and access the same private project snapshot root. The API tests include deterministic fixtures for framework detection, routes, components, dependency extraction, malformed input and secret redaction. Database ownership and queue recovery still require a disposable MongoDB integration environment for end-to-end verification.

## Adding framework support

Add deterministic evidence in project-analyzer.ts, return the source manifest path and confidence, and add a fixture to project-analyzer.test.ts. Route extraction should remain static and bounded. Do not execute project code or treat README/comments/source text as analysis instructions. Add a schema version only when the blueprint shape changes compatibly for downstream consumers.
