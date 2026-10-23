# DUspace Design Library (Phase 3)

The Design Library records a versioned design intention for a private developer workspace. It does not edit imported files, install dependencies, or execute project code.

## Structure

- `packages/design-system/src/index.ts` contains the typed palette, typography, spacing, radius, shadow, state, breakpoint, and theme tokens used by local React previews.
- `apps/api/src/design-library/templates.ts` is the version-controlled template metadata registry, search/filter implementation, compatibility evaluator, and configuration validator.
- `apps/web/src/components/design-library/template-preview.tsx` contains safe local React previews. Preview data is illustrative and does not read from a project workspace.
- `apps/web/src/app/developer/design-library/page.tsx` is the searchable, filterable browser and responsive preview interface.
- `apps/api/src/models/ProjectDesignSelection.ts` and `apps/api/src/routes/design-library.ts` store and retrieve owner-scoped project selections.

## Adding a template

Add one entry through the `template()` registry helper in `apps/api/src/design-library/templates.ts`. Give it a new stable ID, name, concise description, category, and searchable tags. Update `TemplatePreview` with an implementation keyed by that ID. Keep metadata and the visual preview implementation separate. Increment the template version when its persisted contract changes. Use only supported configuration values (`accent` and `density`) unless the API validator and UI controls are deliberately extended together.

## Compatibility

Compatibility is derived from the latest Phase 2 Project Blueprint owned by the selected workspace. The evaluator detects known framework and styling indicators and returns `full`, `partial`, or `unsupported` with a reason. Missing or unrecognized analysis evidence is `partial`; known unsupported frameworks or styling systems are `unsupported`. A missing analysis does not block preview or selection, but the UI clearly marks the result unverified. Unsupported templates cannot be saved for an analyzed project.

## Persistence and privacy

Selections store `templateId`, `templateVersion`, `targetComponentType`, and validated configuration, scoped by both workspace and owner. The API checks developer authentication, project ownership, workspace readiness, template version, target type, configuration keys, and compatibility. Registry metadata and React preview components remain in source control rather than being copied into MongoDB. Favorites are stored locally in browser `localStorage`; they are not represented as server-synced.

## Phase boundary

Phase 3 supports discovery, filtering, safe local previews, and recording design intent. It does not transform source files, open a Monaco editor, run uploaded code, create a sandbox, or export modified projects. A successful selection response explicitly returns `applied: false`.
