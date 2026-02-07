---
name: investment-docs-agent
description: "Download, organize, and audit investment materials (pitch decks, demos, financials) from provided URLs or file lists. Use when Codex needs a repeatable workflow to collect investment documents, save them locally with stable filenames, and generate a manifest for later analysis or memo writing."
---

# Investment Docs Collection Agent

## Core workflow

1. **Create a working folder**
   - Use `investment-docs/<company>/<YYYY-MM-DD>/` to isolate each target and run.

2. **Download source materials**
   - Prefer the bundled script for deterministic logging:
     ```bash
     python skills/investment-docs-agent/scripts/download_docs.py \
       --out investment-docs/<company>/<YYYY-MM-DD> \
       --urls https://example.com/deck.pdf https://example.com/finances.xlsx
     ```
   - If sources are in a file, pass `--url-file <path>` instead.

3. **Review the manifest**
   - The script writes `manifest.csv` with URL, filename, size, and sha256.
   - Use this manifest as the audit trail for the investment memo.

4. **Classify and prep materials**
   - Identify file types (deck, video, financials).
   - If text extraction is needed, prefer built-in tooling available in the environment (e.g., `pdftotext`), and note any missing tools.

5. **Record any download or access issues**
   - Capture failed URLs and error messages from `manifest.csv`.

## Bundled resources

- `scripts/download_docs.py`: Download URLs or URL lists to a target folder and generate `manifest.csv` with hashes.
- `references/doc-collection.md`: Folder conventions and logging tips.

## Output expectations

- Organized folder structure under `investment-docs/`.
- `manifest.csv` present with complete audit metadata.
- Any failures called out explicitly in analysis notes.
