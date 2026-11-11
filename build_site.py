"""Assemble the static Pages artifact from editable files and resource archives."""
from pathlib import Path, PurePosixPath
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "_site"
MAX_BYTES = 512 * 1024 * 1024
MAX_FILES = 2000
ROOT_FILES = (
    "index.html", "app.js", "config.js", "content.js", "style.css", "fonts.css",
    "glass-button.js", "wet-glass.css", "favicon.ico", "favicon.svg", "apple-touch-icon.png",
    "icons.html", "icon-options.css", "icon-preview.html", "fonts.html", "font-comparison.css",
    "CREDITS.md", "REFERENCE_CREDITS.md",
)


def build():
    if OUTPUT.exists():
        raise RuntimeError("_site already exists; use a clean checkout for the build")
    archives = sorted(ROOT.glob("site-assets-*.zip"))
    if not archives:
        raise RuntimeError("Site resource archives are missing")
    OUTPUT.mkdir()
    seen = set()
    total = 0
    for name in ROOT_FILES:
        source = ROOT / name
        if not source.is_file():
            raise RuntimeError(f"Required site file is missing: {name}")
        shutil.copyfile(source, OUTPUT / name)
        seen.add(name)
    for archive in archives:
        with zipfile.ZipFile(archive) as bundle:
            for entry in bundle.infolist():
                if entry.is_dir():
                    continue
                path = PurePosixPath(entry.filename)
                if (path.is_absolute() or ".." in path.parts or "\\" in entry.filename
                        or not path.parts or path.parts[0] not in ("assets", "lib")):
                    raise RuntimeError(f"Invalid resource path in {archive.name}")
                if path.as_posix() in seen or len(seen) >= MAX_FILES:
                    raise RuntimeError("Duplicate resource or too many files")
                total += entry.file_size
                if total > MAX_BYTES:
                    raise RuntimeError("Resource archives exceed the size limit")
                destination = OUTPUT.joinpath(*path.parts)
                destination.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(entry) as source, destination.open("wb") as target:
                    shutil.copyfileobj(source, target)
                seen.add(path.as_posix())
    (OUTPUT / ".nojekyll").touch()
    print(f"Pages artifact ready: {len(seen)} files, {total} resource bytes")


if __name__ == "__main__":
    build()
