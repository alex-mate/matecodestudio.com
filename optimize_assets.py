from pathlib import Path
from PIL import Image
import shutil
import re


# =========================================================
# CONFIG
# =========================================================

ROOT = Path(__file__).resolve().parent

IMAGES_DIR = ROOT / "images"

BACKUP_DIR = ROOT / ".performance-backup"

WEBP_QUALITY = 88

IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
}

TEXT_EXTENSIONS = {
    ".html",
    ".css",
}


# =========================================================
# HELPERS
# =========================================================

def format_size(size):
    if size < 1024:
        return f"{size} B"

    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"

    return f"{size / (1024 * 1024):.2f} MB"


def should_skip(path):
    parts = path.parts

    return (
        ".performance-backup" in parts
        or "node_modules" in parts
        or ".git" in parts
    )


def backup_file(path):
    relative_path = path.relative_to(ROOT)

    backup_path = BACKUP_DIR / relative_path

    backup_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not backup_path.exists():
        shutil.copy2(
            path,
            backup_path,
        )


def image_has_alpha(image):
    return (
        "A" in image.getbands()
        or "transparency" in image.info
    )


# =========================================================
# WEBP CONVERSION
# =========================================================

def convert_to_webp(source):
    destination = source.with_suffix(
        ".webp"
    )

    original_size = source.stat().st_size

    with Image.open(source) as image:

        if image_has_alpha(image):
            converted = image.convert(
                "RGBA"
            )
        else:
            converted = image.convert(
                "RGB"
            )

        converted.save(
            destination,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6,
        )

    webp_size = destination.stat().st_size

    # If WebP gives us almost no benefit,
    # keep the original reference instead.
    if webp_size >= original_size * 0.98:
        destination.unlink(
            missing_ok=True
        )

        print(
            f"SKIP  {source.relative_to(ROOT)}"
            f" — original already efficient"
        )

        return None

    saving = (
        1 - (
            webp_size /
            original_size
        )
    ) * 100

    print(
        f"WEBP  {source.relative_to(ROOT)}\n"
        f"      {format_size(original_size)}"
        f" → {format_size(webp_size)}"
        f"  ({saving:.1f}% smaller)"
    )

    return destination


# =========================================================
# REPLACE REFERENCES
# =========================================================

def update_asset_references(
    conversions,
):
    for path in ROOT.rglob("*"):

        if (
            not path.is_file()
            or should_skip(path)
            or path.suffix.lower()
            not in TEXT_EXTENSIONS
        ):
            continue

        try:
            original_text = path.read_text(
                encoding="utf-8"
            )
        except UnicodeDecodeError:
            continue

        updated_text = original_text

        for source, destination in conversions:

            source_relative = (
                source
                .relative_to(ROOT)
                .as_posix()
            )

            destination_relative = (
                destination
                .relative_to(ROOT)
                .as_posix()
            )

            updated_text = (
                updated_text.replace(
                    source_relative,
                    destination_relative,
                )
            )

        if updated_text != original_text:

            backup_file(path)

            path.write_text(
                updated_text,
                encoding="utf-8",
            )

            print(
                f"UPDATE "
                f"{path.relative_to(ROOT)}"
            )


# =========================================================
# ADD WIDTH / HEIGHT TO HTML IMAGES
# =========================================================

IMG_PATTERN = re.compile(
    r"<img\b[^>]*>",
    re.IGNORECASE | re.DOTALL,
)

SRC_PATTERN = re.compile(
    r'''src=["']([^"']+)["']''',
    re.IGNORECASE,
)

WIDTH_PATTERN = re.compile(
    r"\bwidth\s*=",
    re.IGNORECASE,
)

HEIGHT_PATTERN = re.compile(
    r"\bheight\s*=",
    re.IGNORECASE,
)

DECODING_PATTERN = re.compile(
    r"\bdecoding\s*=",
    re.IGNORECASE,
)


def get_local_image_path(src):
    # Ignore remote / data images
    if (
        src.startswith("http://")
        or src.startswith("https://")
        or src.startswith("data:")
    ):
        return None

    clean_src = (
        src.split("?")[0]
        .split("#")[0]
        .lstrip("/")
    )

    image_path = ROOT / clean_src

    if not image_path.exists():
        return None

    return image_path


def enhance_image_tag(match):
    tag = match.group(0)

    src_match = SRC_PATTERN.search(tag)

    if not src_match:
        return tag

    image_path = get_local_image_path(
        src_match.group(1)
    )

    if not image_path:
        return tag

    try:
        with Image.open(
            image_path
        ) as image:
            width, height = image.size
    except Exception:
        return tag

    additions = []

    if not WIDTH_PATTERN.search(tag):
        additions.append(
            f'width="{width}"'
        )

    if not HEIGHT_PATTERN.search(tag):
        additions.append(
            f'height="{height}"'
        )

    if not DECODING_PATTERN.search(tag):
        additions.append(
            'decoding="async"'
        )

    if not additions:
        return tag

    attributes = " " + " ".join(
        additions
    )

    if tag.endswith("/>"):
        return (
            tag[:-2]
            + attributes
            + " />"
        )

    return (
        tag[:-1]
        + attributes
        + ">"
    )


def optimise_html_images():
    for html_file in ROOT.rglob(
        "*.html"
    ):

        if should_skip(html_file):
            continue

        original_text = (
            html_file.read_text(
                encoding="utf-8"
            )
        )

        updated_text = (
            IMG_PATTERN.sub(
                enhance_image_tag,
                original_text,
            )
        )

        if updated_text != original_text:

            backup_file(
                html_file
            )

            html_file.write_text(
                updated_text,
                encoding="utf-8",
            )

            print(
                f"DIM   "
                f"{html_file.relative_to(ROOT)}"
            )


# =========================================================
# FAVICON
# =========================================================

def optimise_favicon():
    favicon = ROOT / "favicon.ico"

    if not favicon.exists():
        return

    original_size = favicon.stat().st_size

    backup_file(
        favicon
    )

    with Image.open(
        favicon
    ) as image:

        icon = image.convert(
            "RGBA"
        )

        # Ensure square source
        width, height = icon.size

        if width != height:

            size = min(
                width,
                height,
            )

            left = (
                width - size
            ) // 2

            top = (
                height - size
            ) // 2

            icon = icon.crop(
                (
                    left,
                    top,
                    left + size,
                    top + size,
                )
            )

        icon.save(
            favicon,
            format="ICO",
            sizes=[
                (16, 16),
                (32, 32),
                (48, 48),
                (64, 64),
            ],
        )

    new_size = favicon.stat().st_size

    print(
        f"ICON  favicon.ico\n"
        f"      {format_size(original_size)}"
        f" → {format_size(new_size)}"
    )


# =========================================================
# MAIN
# =========================================================

def main():

    print()
    print(
        "========================================="
    )
    print(
        " Mate Code Studio — Performance Pass"
    )
    print(
        "========================================="
    )
    print()

    BACKUP_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    conversions = []

    original_total = 0
    webp_total = 0

    # -----------------------------------------
    # Convert image assets
    # -----------------------------------------

    if IMAGES_DIR.exists():

        image_files = sorted(
            path
            for path
            in IMAGES_DIR.rglob("*")
            if (
                path.is_file()
                and path.suffix.lower()
                in IMAGE_EXTENSIONS
            )
        )

        for source in image_files:

            original_total += (
                source.stat().st_size
            )

            destination = (
                convert_to_webp(
                    source
                )
            )

            if destination:

                conversions.append(
                    (
                        source,
                        destination,
                    )
                )

                webp_total += (
                    destination.stat().st_size
                )
            else:
                webp_total += (
                    source.stat().st_size
                )

    # -----------------------------------------
    # Update HTML / CSS references
    # -----------------------------------------

    print()
    print(
        "Updating asset references..."
    )

    update_asset_references(
        conversions
    )

    # -----------------------------------------
    # Width / height / async decoding
    # -----------------------------------------

    print()
    print(
        "Adding image dimensions..."
    )

    optimise_html_images()

    # -----------------------------------------
    # Favicon
    # -----------------------------------------

    print()
    print(
        "Optimising favicon..."
    )

    optimise_favicon()

    # -----------------------------------------
    # Summary
    # -----------------------------------------

    print()
    print(
        "========================================="
    )
    print(
        " PERFORMANCE SUMMARY"
    )
    print(
        "========================================="
    )

    if original_total:

        saving = (
            1 - (
                webp_total /
                original_total
            )
        ) * 100

        print(
            f"Images before: "
            f"{format_size(original_total)}"
        )

        print(
            f"Images after:  "
            f"{format_size(webp_total)}"
        )

        print(
            f"Reduction:     "
            f"{saving:.1f}%"
        )

    print()
    print(
        "Original files were NOT deleted."
    )

    print(
        "Modified HTML/CSS/favicon backups:"
    )

    print(
        f"{BACKUP_DIR.relative_to(ROOT)}/"
    )

    print()
    print(
        "Check the site locally before deleting"
        " the original PNG/JPG files."
    )
    print()


if __name__ == "__main__":
    main()