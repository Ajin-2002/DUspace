# DUspace Phase 1: Project Import and Workspaces

## Scope

Phase 1 lets a developer create a private project workspace, import source from a ZIP archive or a supported browser folder picker, browse the imported path manifest, reopen it later, and delete the private source. Imports do not modify a local folder, install dependencies, execute scripts, build the project, or publish an app.

The developer sidebar now opens workspaces at `/developer/projects`. Marketplace app management remains at `/developer/apps`, with existing app detail, release, and publishing routes retained under `/developer/projects/:appId` and `/developer/submit`.

## Data flow

1. The authenticated developer creates a `ProjectWorkspace` with a name, description, and source type.
2. The client initializes a `ProjectWorkspaceImport` upload session.
3. The client streams one ZIP archive or the selected folder files with relative paths to the authenticated API.
4. The API writes upload staging files under the private storage root, validates each relative path, then extracts/copies files into a randomized private source snapshot.
5. SHA-256 hashes, sizes and MIME hints are stored as `ProjectWorkspaceFile` manifest rows. Source contents remain on disk and are not stored in MongoDB.
6. The workspace becomes `ready` only after its snapshot and manifest have been written.

The ordinary `/uploads` static route remains for existing marketplace cover images and release assets. `PROJECT_STORAGE_DIR` is checked at startup and rejected if it is the same as or inside `UPLOAD_DIR`.

## API

All project endpoints require a Bearer token accepted by the existing `requireDeveloper` middleware. Project-specific requests are scoped to the current owner; missing and non-owned project IDs both return `404`.

| Method and path | Purpose |
| --- | --- |
| `POST /api/v1/projects` | Create `{ name, description?, sourceType: "zip" | "folder" }` |
| `GET /api/v1/projects?page=&limit=&q=&status=&sort=` | List the current owner's projects |
| `GET /api/v1/projects/:projectId` | Read workspace metadata |
| `PATCH /api/v1/projects/:projectId` | Update `name` and/or `description` |
| `DELETE /api/v1/projects/:projectId` | Clean private project storage and delete owned records |
| `POST /api/v1/projects/:projectId/uploads` | Initialize `{ sourceType, originalFilename? }` and return `importId` |
| `POST /api/v1/projects/:projectId/uploads/complete?importId=...` | Multipart upload (`archive` for ZIP; `relativePaths` and repeated `files` for folders) |
| `GET /api/v1/projects/:projectId/import-status` | Read the real latest import state and progress stage |
| `GET /api/v1/projects/:projectId/files?page=&limit=` | Read a bounded path/size/MIME/hash manifest page |

Responses omit storage keys and filesystem paths. Project file contents are not served by the static upload route or exposed in the manifest API.

## Storage and environment

Local development uses `PROJECT_STORAGE_DIR=./private-projects` relative to the API working directory. It is private application storage and should be excluded from source control and backed up if local imports need to persist.

Production should point `PROJECT_STORAGE_DIR` to a private persistent volume, separate from public uploads. The Render configuration mounts the existing disk at `/var/data`, stores public files in `/var/data/uploads`, and stores project snapshots in `/var/data/private-projects`. A production deployment must retain this volume; ephemeral filesystem deployments will lose imported sources on restart/redeploy. The current repository has no private object-storage provider, so deployments that need multiple API instances or managed object storage should replace the local filesystem adapter before scaling horizontally.

New variables (all import limits have conservative defaults):

| Variable | Default | Meaning |
| --- | --- | --- |
| `PROJECT_STORAGE_DIR` | `./private-projects` | Private staging and snapshot root; must be outside `UPLOAD_DIR` |
| `PROJECT_MAX_UPLOAD_MB` | `100` | Maximum compressed ZIP size |
| `PROJECT_MAX_EXTRACTED_MB` | `200` | Maximum total uploaded/extracted source bytes |
| `PROJECT_MAX_FILES` | `5000` | Maximum regular files |
| `PROJECT_MAX_ENTRIES` | `10000` | Maximum ZIP entries, including directories |
| `PROJECT_MAX_PATH_DEPTH` | `20` | Maximum path segments |
| `PROJECT_MAX_COMPRESSION_RATIO` | `100` | Maximum declared total/per-file expansion ratio |
| `PROJECT_EXCLUDED_DIRS` | empty | Extra comma-separated directory names excluded from ZIP and folder imports |

Default omitted directories are `node_modules`, `.git`, `.next`, `dist`, `build`, `.turbo`, `.cache`, and `coverage`. Hidden configuration, lockfiles, source files and assets are kept unless their path is in an excluded directory.

## Browser folder import

Folder picking requires the browser File System Access API (`showDirectoryPicker`), which is available in current Chromium-based desktop browsers. The permission request happens only after the user selects the folder import option. Other browsers receive an explanation and can use a ZIP instead. The browser sends file blobs and relative paths; it never sends an absolute local path for the server to read.

## Import security and cleanup

- ZIP input is parsed with the installed `unzipper` library; filename extension and client MIME are not treated as archive validation.
- Absolute paths, drive paths, traversal, NUL bytes, excessive nesting, duplicate paths, case collisions, encrypted/unsupported compression, symlinks and special files are rejected.
- ZIP entry count, file count, upload bytes, extracted bytes and compression ratios are bounded.
- Folder paths are normalized and validated server-side; server-calculated stream sizes and hashes populate the manifest.
- Staged/snapshot files use restrictive permissions and randomized snapshot keys. Partial files are removed on failure; workspaces are not marked ready before persistence succeeds.
- Imports are never executed. No lifecycle scripts, dependency installers, builds, previews or uploaded HTML are run/rendered.
- Deletion is owner-scoped and does not remove MongoDB records until private storage cleanup succeeds. It is rejected while an import is active.
- Any import still active when the API starts is treated as interrupted: its staging and partial snapshot are removed, and its workspace is marked failed. (The filesystem adapter is single-instance; a shared object store/lease is needed before running multiple API instances.)

## Database changes

Mongoose creates indexes from the new model schemas:

- `ProjectWorkspace`: `{ ownerId, updatedAt }`, `{ ownerId, status, updatedAt }`
- `ProjectWorkspaceImport`: `{ ownerId, projectId, createdAt }`, `{ status, updatedAt }`
- `ProjectWorkspaceFile`: unique `{ projectId, relativePath }`, plus `{ ownerId, projectId }`

There is no migration step for existing marketplace `App` documents. Marketplace apps and releases continue to use their existing models and APIs.

## Development and verification

From the repository root:

```sh
pnpm --filter api dev
pnpm --filter api test
pnpm --filter api build
pnpm --filter web lint
pnpm --filter web build
```

The API unit tests cover safe path normalization, generated-directory exclusions, collisions, ZIP extraction, hashes, CRC integrity, traversal and symlink rejection, and compression-ratio limits. The frontend currently has no test runner configured; its import screens are checked with lint and a production build. Full authenticated MongoDB integration tests require a disposable test database; no test database configuration is present in this repository.

## Known Phase 1 limits

- Files can be browsed by path, but the browser editor and authorized file-content endpoint are future work.
- Folder uploads use one multipart request and the default 200 MB/5,000-file limits; larger/resumable uploads need a chunked upload transport.
- Local filesystem snapshots are appropriate for the configured persistent disk, but are not shared across horizontally scaled API instances.
- Framework/language detection is intentionally lightweight and uses filenames only.
