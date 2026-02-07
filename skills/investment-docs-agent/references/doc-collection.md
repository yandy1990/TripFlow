# Document Collection Conventions

## Folder layout

- `investment-docs/<company>/<YYYY-MM-DD>/`
  - Keep each run isolated.
  - Example: `investment-docs/TripFlow/2026-02-07/`

## Manifest expectations

- Use `manifest.csv` as the canonical audit log.
- Include the original URL, local filename, file size, sha256, and status.
- If a download fails, keep the row with `status=error` and capture the error message.

## Naming and hygiene

- Keep filenames stable and descriptive.
- Preserve original extensions.
- Avoid overwriting files from earlier runs unless explicitly requested.
