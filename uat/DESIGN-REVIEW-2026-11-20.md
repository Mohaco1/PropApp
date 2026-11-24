# R.Pharmacy: four-lens review (20 Nov 2026)

Read-only review. Nothing in the app was changed. Evidence: 24 screenshots of the UAT build with the fictional example pharmacy (Harbourview), phone 390 px and laptop 1280 px. Screens: landing, Today, Reviews, Actions, Calendar (week, year, month), Staff, Policies, More, a review in progress, an S8 review.

## The seven things that matter most

| # | Problem | Evidence | Fix (proposal) | Size |
|---|---|---|---|---|
| 1 | **Today is overwhelming.** One pharmacy shows "Needs you 44". The phone page is about 5,800 px long. | 24 staff checks were created at once, all due "Today", one row per credential per person ("Review Ahpra registration… · Priya Nair", then again for Sam Taylor…). | Group by person and by area ("Staff checks · 4 people · 24 items"). After setup, Today shows "Start with these 3" and the rest collapsed. New staff checks get spread-out due dates, not all "today". | M |
| 2 | **Your data lives in one browser.** You test on a laptop and a desktop, and they don't share data. The app can't remind you when it's closed. | Backup download is blocked on the link, and there is no reminder channel. | Phase 5: hosted storage with sign-in, plus an email or phone reminder for overdue and legal items. Until then, Save to account is the bridge. | L |
| 3 | **The same thing has two names.** | Tasks vs Actions ("Before you start · 24 open Tasks" in a review; "Actions" in the nav). Audits vs Reviews, Overview vs Today in labels and history. "Verify" means both "check later" and "go and check". Unexplained jargon: "Cadence", "Source: Your plan", "Basis", the "§" mark, the "Legal" tab. | One word list: Review, Action, Check. Replace Cadence → "How often", Source → "Set by", § → "Legal limit" pill. | S |
| 4 | **Numbers disagree between pages.** | Today "3 overdue"; Reviews "2 overdue"; header badge "3" with no label; "24 open actions" vs "Needs you 44". | Each number says what it counts ("3 overdue · 2 reviews, 1 staff"). Label or remove the header badge. | S |
| 5 | **Phone rows are hard to scan.** | Titles wrap to 4–5 lines in a narrow column. The due date squeezes into a side column. Tapping a row expands details inline and pushes the list down. Tabs run off the right edge with no hint ("Actio…"). On the laptop, the person's name is the part cut off by "…". | Phone: title first, then one grey line of due · type · person. Open details as a bottom sheet. Tabs fade at the edge or scroll. Put the person's name first. | M |
| 6 | **The review screen offers too many ways to save.** | "Saved as you go" at the top, then "Save and next", "Save & finish later" and "Review & complete". Answers: Satisfactory · Issue · Verify · N/A. | Buttons: "Next", "Finish later", "Finish review". Rename Verify → "Check later (not sure yet)". | S |
| 7 | **The first visit doesn't sell itself, and setup ends in a flood.** | Landing: "A proprietor oversight record for one NSW community pharmacy" and one button. After setup comes a 44-item list. | Landing says what you get, how long setup takes (Express about 10 min, Detailed about 30), and that data stays on your device. Setup ends with "Your first 3 things" and a calendar preview. | M |

## 1. World-class phone app designer

What works: five-item bottom bar, one question per screen in setup, large tap targets on answers, a sticky Next on reviews, and nothing hidden behind gestures.

Critique and improvements:
- **The list rows fight the screen width.** Two columns (Item | Due) on 390 px gives the title about 60% of the width, so text wraps a lot. Use one column per row: title (2 lines max), then grey meta "Overdue 3 days · Policy". Colour only the due words.
- **Inline expansion is a desktop pattern.** On a phone, tapping a row should open a bottom sheet (half height, drag to full) with "Start now" in reach of the thumb. Inline expansion moves the list under your finger.
- **Tabs are cut off with no hint.** "Needs you · Overdue · Due soon · Actio…": add an edge fade and scroll the tapped tab into view. Or use fewer tabs: Needs you · Coming up · Done.
- **The header badge "3"** is red with no label. People read red numbers as notifications. Make it "3 overdue" or remove it.
- **The search control** is a small pill with no label. Make the icon 44 px, or move search into More.
- **Staff and Policies sit under More,** but staff checks are the biggest source of work (24 of the 44). Consider a bottom bar of Today · Reviews · Staff · Calendar · More, with Actions shown inside Today.
- **Make it feel installed:** an "Add to Home Screen" prompt (PWA), app icon, splash screen, status-bar colour, and offline use. This is the cheapest way to become a "phone app" without the App Store. It needs hosting (Phase 5).
- **Dates follow the device.** The date field showed 11/20/2026 in the test browser. Check on a real Australian phone that it reads 20/11/2026. Show dates elsewhere as "20 Nov".
- **Thumb zone:** primary actions ("Start now", "Finish review") belong in the bottom third. They're placed well on reviews but not on Today's expanded row.
- **Real-device pass still outstanding:** iPhone Safari, Android Chrome, large text setting and VoiceOver (UAT item 3).

## 2. World-class UI designer

What works: calm palette, one accent, honest red/amber/green, readable type, a clear Concept D identity, and quiet "Why it's here" explanations.

Critique and improvements:
- **Too many layers before the work.** Today stacks the title, a coloured summary line, the Pharmacy setup card, a "This pharmacy" block that repeats the same counts, then the tabs. Merge the summary and the "This pharmacy" block into one strip. Hide the setup card once setup is done or snoozed.
- **Colour means too many things.** Blue is a link colour, the "action" dot, and "Today" due dates. "24 open actions" in blue looks like a link (it isn't one). Keep blue for links and buttons only, and use neutral for "Today".
- **Mixed verbs on the same kind of button:** Start · Start now · Open · Verify · Open record. Pick one per job: Start (a review), Open (a record), Check (a credential).
- **Truncation hides the key fact.** "Review Indemnity arrangements appropriate to duties · Priy…": lead with the person or subject, i.e. "Priya Nair · Indemnity check".
- **Tables on phone show headers** (Item / Due / Owner) that waste a row and repeat on every block. Drop them on the phone.
- **The laptop detail panel is good,** but it floats in a large empty column on long pages. Make it sticky, so it stays beside the row you selected.
- **"Owner: You" vs "Alex Owner"** in the same table. Always say "You".
- **Empty and "No date" states:** "Governance, access and continuity · No date" looks unfinished. Say "Not scheduled · Plan a date".
- **Bottom-bar icons:** text only is clean, but icons help scanning. Add simple outline icons above the labels.
- **Contrast:** check the grey meta text (e.g. "Policy", "Action", the table headers) against WCAG AA. It looks close to the limit.

## 3. World-class workflow engineer

The core loop is: set up → plan → do the review → record issues → follow up with actions → prove it in history. The pieces exist. These are where the loop leaks:
- **Work arrives all at once.** Setup creates every staff check and procedure task "today". Spread due dates by risk (registration first, induction next…). Batch per person: "Check Sam Taylor (6 items)" as one guided flow with the same one-question-at-a-time pattern as setup.
- **There are three ways to change a date:** "Plan a date" (Today), "Change date" (Calendar), "Adjust intervals" (Reviews). Use one date sheet everywhere, with the S8 limit shown wherever it applies.
- **Issue → Action → Close needs to be visible as one thread.** When a review records an Issue, show "Action created · due 27 Nov" on the spot. When the action is closed, the review should show "1 issue · fixed 25 Nov".
- **Assumed answers (Express) have no deadline.** Give "Confirm assumed answers" one Today item with a count, not many, and a sensible due date (e.g. 14 days).
- **Drafted procedures need a finish line.** Draft → you review → you approve, with a short checklist of the [Confirm] items to tick before approving. The "Approve" button stays locked until they're done (already the case for Express assumptions).
- **Two computers is a real workflow.** Until hosting exists, add "last saved to account" on Today, and a gentle "you have newer data on another device" check when you open the app.
- **No reminders while closed.** For an oversight tool, a weekly summary email ("2 overdue, S8 check due 2 Dec") is the single highest-value feature after hosting.
- **Handover:** "Pharmacy handover pack" (s 111(3), already deferred) should be one tap. It would export the open legal items, last S8 check and drug register location.
- **Measures to watch in the pilot:** time to finish setup, items overdue after 30 days, % of reviews finished in one sitting, % of actions closed within due date.

## 4. A proprietor opening it for the first time

What I'd think, in order:
1. **Landing:** "R.Pharmacy… oversight record… Set up your pharmacy." *What is this going to do for me, how long will it take, and who sees my data?* → Answer all three on the landing in three short lines.
2. **Setup:** clear and calm, one question at a time, and "Draft it for me" is a relief. *How many questions are left in total?* It shows "Question 4 of 7" per service but not overall → show "Service 3 of 8".
3. **After setup, Today:** *44 things? Am I already failing?* This is the moment people abandon it. → A welcome state: "You're set up. Here are your first 3 things this week," plus "Everything else is planned in the calendar."
4. **Words I don't use:** Cadence, Basis, Source, Verify, To verify, §, Legal tab, "Proprietor oversight". I'd say: how often, why, set by, check, legal limit, my checks.
5. **Trust:** the "not verified in NSW law" notes are honest and I'd keep them. Repeated on every row, they start to feel like the app doubting itself, so show them once per item, in "Why it's here".
6. **What I'd want and can't find:** "Show me only what's legally required this month," a print/PDF of the year plan for the dispensary wall, and "What changed since my last visit".

## Anything else

- **Accessibility:** run an axe check and a VoiceOver pass. Things to look for: tab lists, the expanding rows (aria-expanded), dialog focus return, and the colour-only status dots (add text, which most rows already have).
- **Performance:** the app is one 1.25 MB file and loads fast locally. When hosted, compress it and cache it for offline use.
- **Content governance:** keep one "Sources" page listing every rule the app relies on, its source and the date it was checked. Phase 3 source checks feed it, and it's what you'd show an inspector.
- **Risky until hosted:** clearing browser data deletes everything. Say so plainly in More → Backup, with "Save to account" next to it.

## Suggested order (once UAT is done)
1. Words and numbers (#3, #4): small, and fixes a lot of confusion.
2. Today grouping and the "first 3 things" welcome (#1, #7).
3. Phone row layout and bottom sheet (#5).
4. Review buttons (#6).
5. Phase 5: hosting, sync and reminders (#2).
