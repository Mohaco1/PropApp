# R.Pharmacy Design Studio

Compare every R.Pharmacy design, section by section, write notes on each one, and pick the best parts into one "super design".

## Open it
- **On Windows (Chrome or Edge):** unzip the folder, then double-click `index.html`. Nothing to install.
- Keep the folder together: `index.html` needs `catalogue.js`, `studio.js` and the `designs` folder next to it.

## Round 3: five finalists
The sidebar now starts with **Round 3 · Five finalists**: A Quiet Precision, B Command Centre and C Guided Path (the Round 2 originals, unchanged), plus two new hybrids, D Precision Command (A + B) and E Guided Precision (A + C, with selected B).
- **Open the Round 3 space** to explore each one, compare the same page across all five at phone or laptop size, mark favourites, tick elements to keep and add notes. Your Round 2 notes for A, B and C are shown read-only alongside.
- **Rationale for D and E** explains what each hybrid borrows, leaves out and trades off. No winner is declared.
- Round 3 notes are stored separately; Round 1 and Round 2 notes are untouched.

## Round 2: five new concepts
The sidebar now starts with **Round 2 · Five concepts**. Each concept (A Quiet Precision, B Command Centre, C Guided Path, D Editorial, E The Floor) is a clickable prototype covering seven areas, with phone and laptop layouts.
- **Open the Round 2 space** (button at the top of the sidebar) to switch concepts, compare the same page across all five, swap phone/laptop, open full screen, add notes and tick the elements you want to keep.
- **Brief and evaluation** in that space explains the reasoning, the critique of Round 1, the scores and my recommendation.
- Notes made in either place are shared and included in the backup file and exports.

Round 1 designs are still there, under **Round 1 · Earlier designs**.

## How to use it
1. Click a section on the left (for example **Dashboard / Today**). Every design for that section appears side by side. Scroll sideways to see them all.
2. Under each design, tap a note type (Like, Dislike, Keep, Change, Remove, Comment), choose which part of the design it's about (optional), type the note, then click **Add note**. Notes can be edited or deleted.
3. Click **Open large** to see one design bigger, with its notes beside it. **Full screen in new tab** opens it on its own.
4. Under the designs, fill in **Super design for this section**: one row per part (for example "Navigation: take it from 6 Field Ledger · Today"), marked Decided, Considering or Rejected. Add free-text instructions and open questions.
5. Set the section's **Status** at the top right (Not reviewed, In progress, Decisions made, Finalised). It never changes to Finalised on its own.
6. **Super design (final spec)** at the bottom of the sidebar shows everything together and downloads:
   - **Claude Code handoff**: only the Decided picks plus your instructions, written as one design direction to build
   - **Full design spec**: everything, including Considering, Rejected and all notes
   - **Open questions**: what's still undecided
   - **Backup file (.json)**

## Saving and moving between computers
Notes save automatically in the browser you're using. To move to another computer, click **Save backup file (.json)**, copy the file across, then click **Load backup file** there.

## What's in it (all read-only copies)
- `designs/current-app/`: screenshots of the current app (v27) with fictional data, plus the two "app as it was" screenshots
- `designs/mockups/`: every mockup from the UI Trials canvas (first trials, Designs 1–6, key flows, award-inspired, brief)
- `designs/screenbook/`: the Screen Book (all 116 setup-question screenshots)

The real R.Pharmacy app, its data and the original designs are not touched by this folder.

## Adding a design later
Put the file in `designs/mockups/`, then add one line for it in `catalogue.js` under `designs` and list its ID in the right section. Keep existing IDs unchanged, because notes are saved against them.
