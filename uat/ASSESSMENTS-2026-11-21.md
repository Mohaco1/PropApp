# Five-lens assessment (21 Nov 2026), after v23–v24

**Goal (owner):** one app where a proprietor can do all their legal and best-practice obligations. Super mobile-friendly, good UI/UX, not a barrage of information.

**Method:**
- Phone screenshots (iPhone 13 size) of every main page, using fictional data.
- A scripted first-time setup with 3 services (DAA, vaccination, OTP), counting screens, taps and words.
- The NSW Health, Pharmacy Council and Pharmacy Board research.

## 1. PRU officer (NSW Health inspector)
**What works:**
- S8 is in one place.
- The S8 review tests the actual Storage Standards: the safe and fridge construction yearly; register, keys and codes quarterly.
- Legal obligations are listed by section and Standard.
- The vaping review is NSW Health's own checklist.
- Forged-script and missing-S8 steps come straight from NSW Health and the Council, with "Log that you reported it".
- Key dates are tracked.
- The premises renewal review matches what Council inspectors check.

**Still open:**
- Records live in one browser without sign-in (owner: assess later).
- No inspector pack (owner: later).
- Notifications made are now logged by the owner, which is fine for a helper app.

## 2. UI/UX designer (phone)
**Fixed now:**
- **Today was 3,917 px tall on a phone; now 1,618 px.** It shows the top 3, then the next 8, with "Show all". The top 3 aren't repeated in the list below.
- **List pages no longer open the first row's details automatically on a phone.** Details open when you tap. This applies to Reviews, Staff, Setup, Actions and Policies.
- **The Today summary is shorter.** The no-date and to-check counts live in the tabs.
- **Pharmacy setup** is grouped under 4 headings (Your pharmacy · Law and inspections · Records · Settings), with no repeated column headings on a phone.
- Long site-visit questions get short titles, and buttons stay clear of the sticky footer.
- The keyboard hint no longer shows on phones (it was a duplicate-class bug).

**Still worth doing later:**
- The Reviews page summary sentence is long ("16 in your plan… (reviews only; Today also counts…)"); it could be one line.
- Tables still show column headings ("Review · Next due") on a phone. Fine, but optional.
- The UAT notes button covers some content (UAT only; it goes away in release).

## 3. Workflow / SaaS expert
**What works:**
- One setup flow per service, with honest question counts.
- "What most pharmacies do" lets owners confirm in one tap; "Check later" defers without assuming.
- Due dates arrive pre-filled.
- Every rule cites its source, and nothing is approved for the owner.

**Measured:** a 3-service setup takes **31 screens and 46 taps, about 100 words a screen.** The heaviest screens are the vaccine list (203 words) and "Services provided" (189 words); both are lists, which is acceptable.

**Gaps a SaaS would close next (roadmap):**
- Sign-in and hosted records.
- Reminders by push or email.
- Several users with roles.
- An exportable pack.
- An audit trail tied to a signed-in person.

## 4. First-time proprietor who has just bought a pharmacy
**Fixed now:**
- The landing page said "10 minutes with Express, or 30 with Detailed". That choice no longer exists. It now says what the app does for an owner and that setup takes about 15–20 minutes.
- **"Bought, selling or closing"** (new OTP registration, new AIR number and VAN, s 111(3) inventory, Council notices) is now in "Your pharmacy". The setup-complete screen offers "Just bought this pharmacy? See what to do first".
- **The pharmacist in charge screen reminds you** to display their name by the dispensary and the owners' names at the entrance.

**Would still confuse a new owner:**
- Words like "Legal limit" and "Group of 5" on Today.
- The difference between Reviews and Actions.
- A one-screen "How this app works" (Today = what's next; Reviews = regular checks; Actions = fixes; Policies = procedures) would help. **Suggested next.**

## 5. My own view
- The app now covers the core of what NSW requires of an owner, with sources, and stays a helper rather than a policeman.
- **Biggest remaining risk:** records stored in one browser.
- **Biggest remaining UX win:** a short "How this app works" card and plainer labels on Today.
- **Research gaps** (blocked sites: TGA, OAIC/IPC privacy, Strive for 5, Fair Work): those steps stay marked "verify" until the documents are provided.
