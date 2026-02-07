#!/usr/bin/env python3
import argparse
import csv
import hashlib
import os
import sys
import urllib.parse
import urllib.request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download investment docs from URLs and log a manifest."
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Output directory for downloaded files.",
    )
    parser.add_argument(
        "--urls",
        nargs="*",
        default=[],
        help="One or more URLs to download.",
    )
    parser.add_argument(
        "--url-file",
        help="Path to a text file containing URLs (one per line).",
    )
    return parser.parse_args()


def read_url_file(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8") as handle:
        return [line.strip() for line in handle if line.strip()]


def derive_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    basename = os.path.basename(parsed.path)
    return basename or "downloaded-file"


def unique_path(directory: str, filename: str) -> str:
    base, ext = os.path.splitext(filename)
    candidate = os.path.join(directory, filename)
    counter = 1
    while os.path.exists(candidate):
        candidate = os.path.join(directory, f"{base}-{counter}{ext}")
        counter += 1
    return candidate


def sha256_for_path(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def download_file(url: str, output_dir: str) -> tuple[str, int, str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        content_disposition = response.headers.get("Content-Disposition", "")
        filename = derive_filename(url)
        if "filename=" in content_disposition:
            parts = content_disposition.split("filename=")
            if len(parts) > 1:
                filename = parts[1].strip().strip('"')
        output_path = unique_path(output_dir, filename)
        with open(output_path, "wb") as handle:
            handle.write(response.read())
    size = os.path.getsize(output_path)
    sha256 = sha256_for_path(output_path)
    return output_path, size, sha256, "ok"


def write_manifest(rows: list[dict[str, str]], output_dir: str) -> None:
    manifest_path = os.path.join(output_dir, "manifest.csv")
    fieldnames = ["url", "filename", "size_bytes", "sha256", "status", "error"]
    with open(manifest_path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    urls = list(args.urls)
    if args.url_file:
        urls.extend(read_url_file(args.url_file))
    urls = [url for url in urls if url]
    if not urls:
        raise SystemExit("No URLs provided. Use --urls or --url-file.")

    os.makedirs(args.out, exist_ok=True)
    rows: list[dict[str, str]] = []

    for url in urls:
        row = {
            "url": url,
            "filename": "",
            "size_bytes": "",
            "sha256": "",
            "status": "error",
            "error": "",
        }
        try:
            output_path, size, sha256, status = download_file(url, args.out)
            row["filename"] = os.path.basename(output_path)
            row["size_bytes"] = str(size)
            row["sha256"] = sha256
            row["status"] = status
        except Exception as exc:  # noqa: BLE001
            row["error"] = str(exc)
        rows.append(row)

    write_manifest(rows, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
