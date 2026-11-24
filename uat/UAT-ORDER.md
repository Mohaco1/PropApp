# UAT plan: the permanent link

**Use this one link for all UAT:** https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN ("R.Pharmacy UAT testing")
- Every fix is republished to this same link, so your test data and notes are kept.
- v36 and earlier versions stay on their own links, unchanged.

## Order
1. **Onboard using Detailed** (choose "Detailed" on the services step).
2. **Test everything in Detailed.** On every setup question, use the orange "UAT · for you only" strip to mark:
   - **Could be standard (assume in Express)**
   - **Must always be asked**
   - **No opinion**

   Add a note where it helps. For anything else on any page, use **UAT notes** (bottom left); each note is tagged with the page you're on.
3. **When you have a batch, tell Claude "check notes".** Claude reads them directly, fixes, tests and republishes to this link, then marks each note **Fixed – retest** with what changed.
4. **Retest** and press **Retested · close** (or **Still wrong**).
5. When Detailed is done, Claude carries your standard/ask choices into Express. Then **test Express** on a fresh start: a new private window, or Setup → Locations → Add location.

## Between your two computers
- **UAT notes:** synced automatically, as long as you're signed in to claude.ai.
- **Test records:** at the end of a session, go to Setup → Locations, backup & restore → Storage & backup and press **Save to my account**. On the other computer, press **Restore from my account**. (This is the first time it has been switched on; tell me if it fails. The fallback is a separate fictional pharmacy on each computer.)

## Where notes live
- In this UAT page's private store on claude.ai, readable only by you (and by Claude when you ask).
- Never in the pharmacy's records, backups or history.
- The tool is removed before any real release.

## For Claude (resuming)
- **Read notes:** ArtifactData `list` on https://claude.ai/artifact/Vnn6KXsNkkEe7Ywc3DbnWN, collections `uatnotes` and `uatquestions`.
- **After a fix:** update the note with `status: "Fixed – retest"` and `fix: "<what changed>"`.
- **Rebuild:** `node uat/build-uat.js`, then publish `uat/app/rpharmacy-uat-testing.html` to the same link. Omit `capabilities` on a republish, so the stored `db` + `user` declaration is kept.
