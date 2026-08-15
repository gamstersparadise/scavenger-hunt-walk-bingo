#!/usr/bin/env python3
"""
Walk Bingo - Scavenger Hunt Generator
Run: python walk_bingo.py
"""

import random
import textwrap
from datetime import datetime

# ── Bingo items pool ──────────────────────────────────────────────────────────
ITEMS = [
    # Nature
    "A yellow flower",
    "A red flower",
    "A white flower",
    "A wild berry bush",
    "A mushroom",
    "Moss on a rock",
    "A pine cone",
    "A fallen tree",
    "A bird nest",
    "A spider web",
    "A feather on the ground",
    "A four-leaf clover",
    "A dandelion",
    "A butterfly",
    "A bumblebee",
    "A snail",
    "A frog or toad",
    "A squirrel",
    "A bird singing",
    "Two birds together",
    "An anthill",
    "A beetle",
    "A caterpillar",
    "A worm on the path",
    "A rabbit",
    "A duck or goose",
    "A deer track",
    "Lichen on bark",
    "A stream or brook",
    "A puddle with reflections",
    "Flowing water sounds",
    "A cloud shaped like an animal",
    # Outdoors / human traces
    "A wooden fence",
    "A stone wall",
    "A red mailbox",
    "A bench to sit on",
    "A signpost",
    "A footbridge",
    "A swing set",
    "Smoke from a chimney",
    "Laundry drying outside",
    "A garden gnome",
    "A wind chime",
    "A bicycle parked outside",
    "A vegetable garden",
    "A fruit tree",
    "An apple on the ground",
    "A hay bale",
    "A tractor or farm vehicle",
    "A church or chapel",
    "A flag flying",
    "Graffiti or street art",
    "A fountain",
    "A locked gate",
    "Steps carved into a hill",
    "A shadow that looks cool",
    "Something blue and man-made",
    "Something orange",
    "Something perfectly round",
    "Something older than you",
    "Something newer than a year",
    "A number above 100 on a sign",
]

# ── Card helpers ──────────────────────────────────────────────────────────────

CELL_W = 18  # inner text width (chars)
CELL_H = 9  # inner text height (lines) — ~half of width for monospace square feel
BORDER = 1  # space padding each side
COL_INNER = BORDER + CELL_W + BORDER  # total inner width between pipes

H_SEP = "+" + (("-" * COL_INNER + "+") * 3)


def fit_text(text):
    """Wrap and centre text into a CELL_W × CELL_H block."""
    wrapped = textwrap.wrap(text, CELL_W)
    # Trim if somehow too long
    wrapped = wrapped[:CELL_H]
    # Vertical centre: pad top and bottom
    pad_total = CELL_H - len(wrapped)
    pad_top = pad_total // 2
    pad_bot = pad_total - pad_top
    lines = ([""] * pad_top) + wrapped + ([""] * pad_bot)
    # Horizontal centre each line
    return [line.center(CELL_W) for line in lines]


def render_card(card):
    """Render the 3×3 card where every cell is a visual square."""
    out = [H_SEP]
    for row in card:
        cell_blocks = [fit_text(cell) for cell in row]
        for line_idx in range(CELL_H):
            row_line = "|"
            for block in cell_blocks:
                row_line += " " + block[line_idx] + " |"
            out.append(row_line)
        out.append(H_SEP)
    return "\n".join(out)


# ── Output builder ────────────────────────────────────────────────────────────


def bingo_rules():
    return (
        "HOW TO PLAY\n"
        "-----------\n"
        "Find the items on your walk and tick them off.\n"
        "Complete a full ROW or COLUMN → you're done! Head home. 🏡\n"
        "Rows go left → right.  Columns go top → bottom.\n"
    )


def build_output(card):
    date_str = datetime.now().strftime("%A, %d %B %Y  %H:%M")
    width = len(H_SEP)  # use grid width as page width
    title_pad = " " * ((width - len("🌿  WALK BINGO  🌿")) // 2)
    date_pad = " " * ((width - len(date_str)) // 2)

    lines = [
        "=" * width,
        f"{title_pad}🌿  WALK BINGO  🌿",
        f"{date_pad}{date_str}",
        "=" * width,
        "",
        bingo_rules(),
        "",
        "YOUR CARD",
        "---------",
        render_card(card),
        "-" * width,
        "  Name:              ______________________________",
        "  Steps taken:       ______________________________",
        "-" * width,
        "",
        "Notes:",
        "_" * width,
        "_" * width,
        "_" * width,
        "=" * width,
    ]
    return "\n".join(lines)


def save_to_file(content):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"walk_bingo_{ts}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    return filename


# ── Main ──────────────────────────────────────────────────────────────────────


def main():
    items = random.sample(ITEMS, 9)
    card = [items[i * 3 : (i + 1) * 3] for i in range(3)]
    output = build_output(card)

    print()
    print(output)
    print()

    save = input("Save to .txt file? [Y/n] ").strip().lower()
    if save in ("", "y", "yes"):
        filename = save_to_file(output)
        print(f"\n✅  Saved to: {filename}")
        print("   Open it, print it, and enjoy your walk!")
    else:
        print("\nHave a great walk! 🚶")


if __name__ == "__main__":
    main()
