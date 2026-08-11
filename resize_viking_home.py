from pathlib import Path
from PIL import Image, ImageOps
import re
import shutil


# =========================================================
# CONFIG
# =========================================================

ROOT = Path(__file__).resolve().parent

SOURCE_IMAGE = (
    ROOT
    / "images"
    / "viking-restaurant"
    / "home.webp"
)

HTML_FILE = (
    ROOT
    / "viking-restaurant.html"
)

BACKUP_FILE = (
    ROOT
    / "viking-restaurant.before-responsive-images.html"
)

TARGET_WIDTHS = [
    640,
    960,
    1280,
]

WEBP_QUALITY = 84


# =========================================================
# HELPERS
# =========================================================

def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"

    if size_bytes < 1024 * 1024:
        return (
            f"{size_bytes / 1024:.1f} KB"
        )

    return (
        f"{size_bytes / (1024 * 1024):.2f} MB"
    )


def replace_attribute(
    tag,
    attribute,
    value,
):
    """
    Replace an existing HTML attribute,
    or add it if it does not exist.
    """

    pattern = re.compile(
        rf'\s{re.escape(attribute)}'
        rf'\s*=\s*'
        rf'(["\']).*?\1',
        re.IGNORECASE
        | re.DOTALL,
    )

    replacement = (
        f' {attribute}="{value}"'
    )

    if pattern.search(tag):
        return pattern.sub(
            replacement,
            tag,
            count=1,
        )

    if tag.rstrip().endswith("/>"):
        index = tag.rfind("/>")

        return (
            tag[:index]
            + replacement
            + " "
            + tag[index:]
        )

    index = tag.rfind(">")

    return (
        tag[:index]
        + replacement
        + tag[index:]
    )


def remove_attribute(
    tag,
    attribute,
):
    """
    Remove an HTML attribute if present.
    """

    pattern = re.compile(
        rf'\s{re.escape(attribute)}'
        rf'\s*=\s*'
        rf'(["\']).*?\1',
        re.IGNORECASE
        | re.DOTALL,
    )

    return pattern.sub(
        "",
        tag,
    )


# =========================================================
# VALIDATION
# =========================================================

def validate_files():
    if not SOURCE_IMAGE.exists():
        raise FileNotFoundError(
            "\nCould not find:\n"
            f"{SOURCE_IMAGE}\n"
        )

    if not HTML_FILE.exists():
        raise FileNotFoundError(
            "\nCould not find:\n"
            f"{HTML_FILE}\n"
        )


# =========================================================
# BACKUP
# =========================================================

def create_backup():
    if BACKUP_FILE.exists():
        print(
            "Backup already exists:"
        )

        print(
            f"  {BACKUP_FILE.name}"
        )

        print()

        return

    shutil.copy2(
        HTML_FILE,
        BACKUP_FILE,
    )

    print(
        "Created HTML backup:"
    )

    print(
        f"  {BACKUP_FILE.name}"
    )

    print()


# =========================================================
# CREATE RESPONSIVE IMAGES
# =========================================================

def create_responsive_images():
    generated_images = []

    original_file_size = (
        SOURCE_IMAGE.stat().st_size
    )

    with Image.open(
        SOURCE_IMAGE
    ) as source:

        source = (
            ImageOps.exif_transpose(
                source
            )
        )

        original_width = source.width
        original_height = source.height

        print(
            "Original image:"
        )

        print(
            f"  Dimensions: "
            f"{original_width} × "
            f"{original_height}"
        )

        print(
            f"  File size:  "
            f"{format_size(original_file_size)}"
        )

        print()

        for target_width in TARGET_WIDTHS:

            if target_width >= original_width:
                print(
                    f"Skipping "
                    f"{target_width}px version "
                    f"because source width is "
                    f"{original_width}px."
                )

                continue

            ratio = (
                target_width
                / original_width
            )

            target_height = round(
                original_height
                * ratio
            )

            resized = source.resize(
                (
                    target_width,
                    target_height,
                ),
                Image.Resampling.LANCZOS,
            )

            destination = (
                SOURCE_IMAGE.parent
                / (
                    f"{SOURCE_IMAGE.stem}"
                    f"-{target_width}"
                    f"{SOURCE_IMAGE.suffix}"
                )
            )

            resized.save(
                destination,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=6,
            )

            generated_size = (
                destination.stat().st_size
            )

            reduction = (
                1
                - (
                    generated_size
                    / original_file_size
                )
            ) * 100

            print(
                f"Created "
                f"{destination.name}"
            )

            print(
                f"  Dimensions: "
                f"{target_width} × "
                f"{target_height}"
            )

            print(
                f"  File size:  "
                f"{format_size(generated_size)}"
            )

            print(
                f"  Reduction:  "
                f"{reduction:.1f}%"
            )

            print()

            generated_images.append(
                (
                    target_width,
                    destination,
                )
            )

        return (
            original_width,
            original_height,
            generated_images,
        )


# =========================================================
# BUILD SRCSET
# =========================================================

def build_srcset(
    generated_images,
    original_width,
):
    entries = []

    for width, path in generated_images:

        relative_path = (
            path.relative_to(ROOT)
            .as_posix()
        )

        entries.append(
            f"{relative_path} {width}w"
        )

    original_relative = (
        SOURCE_IMAGE
        .relative_to(ROOT)
        .as_posix()
    )

    entries.append(
        f"{original_relative} "
        f"{original_width}w"
    )

    return ", ".join(entries)


# =========================================================
# UPDATE VIKING HTML
# =========================================================

def update_viking_html(
    original_width,
    original_height,
    generated_images,
):
    html = HTML_FILE.read_text(
        encoding="utf-8"
    )

    source_relative = (
        SOURCE_IMAGE
        .relative_to(ROOT)
        .as_posix()
    )

    img_pattern = re.compile(
        r"<img\b[^>]*>",
        re.IGNORECASE
        | re.DOTALL,
    )

    matching_tags = []

    for match in img_pattern.finditer(
        html
    ):
        tag = match.group(0)

        if (
            f'src="{source_relative}"'
            in tag
            or
            f"src='{source_relative}'"
            in tag
        ):
            matching_tags.append(
                tag
            )

    if not matching_tags:
        print(
            "WARNING:"
        )

        print(
            "No <img> using "
            f"{source_relative} "
            "was found in "
            "viking-restaurant.html."
        )

        print()

        return

    print(
        f"Found {len(matching_tags)} "
        "Viking home image occurrence(s)."
    )

    print()

    srcset = build_srcset(
        generated_images,
        original_width,
    )

    occurrence = 0


    def modify_tag(match):
        nonlocal occurrence

        tag = match.group(0)

        if not (
            f'src="{source_relative}"'
            in tag
            or
            f"src='{source_relative}'"
            in tag
        ):
            return tag

        occurrence += 1

        # -----------------------------------------
        # Common responsive attributes
        # -----------------------------------------

        tag = replace_attribute(
            tag,
            "srcset",
            srcset,
        )

        tag = replace_attribute(
            tag,
            "width",
            str(original_width),
        )

        tag = replace_attribute(
            tag,
            "height",
            str(original_height),
        )

        tag = replace_attribute(
            tag,
            "decoding",
            "async",
        )

        # -----------------------------------------
        # FIRST IMAGE = HERO
        # -----------------------------------------

        if occurrence == 1:

            tag = replace_attribute(
                tag,
                "sizes",
                (
                    "(max-width: 900px) "
                    "calc(100vw - 40px), "
                    "50vw"
                ),
            )

            tag = replace_attribute(
                tag,
                "fetchpriority",
                "high",
            )

            tag = remove_attribute(
                tag,
                "loading",
            )

        # -----------------------------------------
        # OTHER IMAGES = BELOW THE FOLD
        # -----------------------------------------

        else:

            tag = replace_attribute(
                tag,
                "sizes",
                (
                    "(max-width: 900px) "
                    "calc(100vw - 40px), "
                    "65vw"
                ),
            )

            tag = replace_attribute(
                tag,
                "loading",
                "lazy",
            )

            tag = remove_attribute(
                tag,
                "fetchpriority",
            )

        return tag


    updated_html = (
        img_pattern.sub(
            modify_tag,
            html,
        )
    )

    HTML_FILE.write_text(
        updated_html,
        encoding="utf-8",
    )

    print(
        "Updated:"
    )

    print(
        "  viking-restaurant.html"
    )

    print()

    print(
        "Responsive image behaviour:"
    )

    print(
        "  First home.webp image:"
    )

    print(
        "    → high priority"
    )

    print(
        "    → no lazy loading"
    )

    print(
        "    → responsive srcset"
    )

    if occurrence > 1:
        print(
            "  Remaining home.webp images:"
        )

        print(
            "    → lazy loaded"
        )

        print(
            "    → responsive srcset"
        )

    print()


# =========================================================
# SUMMARY
# =========================================================

def print_summary(
    generated_images,
):
    print(
        "========================================="
    )

    print(
        " VIKING RESPONSIVE IMAGE PASS COMPLETE"
    )

    print(
        "========================================="
    )

    print()

    print(
        "Generated files:"
    )

    for _, path in generated_images:
        print(
            f"  {path.relative_to(ROOT)}"
        )

    print()

    print(
        "Original image preserved:"
    )

    print(
        f"  {SOURCE_IMAGE.relative_to(ROOT)}"
    )

    print()

    print(
        "HTML backup:"
    )

    print(
        f"  {BACKUP_FILE.name}"
    )

    print()

    print(
        "Next:"
    )

    print(
        "  1. Reload Viking case study"
    )

    print(
        "  2. Check hero image"
    )

    print(
        "  3. Check screenshot lightbox"
    )

    print(
        "  4. Run Lighthouse Mobile again"
    )

    print()


# =========================================================
# MAIN
# =========================================================

def main():
    print()

    print(
        "========================================="
    )

    print(
        " Mate Code Studio"
    )

    print(
        " Viking Responsive Image Optimiser"
    )

    print(
        "========================================="
    )

    print()

    validate_files()

    create_backup()

    (
        original_width,
        original_height,
        generated_images,
    ) = create_responsive_images()

    if not generated_images:
        print(
            "No responsive images "
            "were generated."
        )

        return

    update_viking_html(
        original_width,
        original_height,
        generated_images,
    )

    print_summary(
        generated_images
    )


if __name__ == "__main__":
    main()