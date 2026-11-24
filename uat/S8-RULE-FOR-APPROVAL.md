# S8 inventory date: wording for your approval (not changed yet)

Source: your uploaded copy of the Medicines, Poisons and Therapeutic Goods Regulation 2026 (`conversation-materials/uploaded-sources/7a633918-sl-2026-330-2.pdf`), section 111:

> **111 Inventories of Schedule 8 substances**
> (1) The responsible person for a relevant place must ensure an accurate inventory of all Schedule 8 substances at the relevant place is made in accordance with this section at the approved times or, if there are no approved times—
> (a) every 6 months for the following relevant places— [public hospital wards and pharmacies, private health facility dispensaries, correctional centre clinics, public OTP clinics, public residential care facilities], or
> (b) otherwise—every 3 months.
> (2) The person making the inventory must— (a) make the inventory as an entry in the drug register, and (b) include, immediately under the last entry for each substance— (i) the quantity of the substance actually kept at the relevant place, and (ii) the date the inventory was made, and (c) sign the entry in the drug register.
> (3) A person who, for a period of 1 month or more, takes control of a relevant place at which Schedule 8 substances are kept must, immediately on taking control, ensure an inventory is made as an entry in the drug register in accordance with this section.

## What this means for a community pharmacy
A community pharmacy isn't on the 6-month list, so the inventory is due **every 3 months**, unless NSW Health has approved other times.

## What the app does now (v27 to v31)
- **Completing the S8 review:** the next date can't be set more than 3 months ahead. ✔
- **"Change due date" window** (also reached from Calendar → Plan in plain words): the S8 date can be moved later than 3 months after the last inventory, as long as a reason is given. ✘ (Known issue K-01.)

## Proposed fix (needs your yes)
1. In the "Change due date" window, for the S8 stock check only, refuse a date later than **3 months after the last recorded S8 inventory**. If there's no inventory on record yet, the limit is 3 months from today.
2. Add a tick box: **"NSW Health has approved other inventory times for this pharmacy"**, with a required reference. When ticked, the 3-month limit doesn't apply and the reference is saved in the change history. This covers the "approved times" wording in s 111(1).
3. Add tests for every way of changing the date: the review form, the Reviews page, Calendar (all three tabs), plain words and the Today page.

Optional, from s 111(3): a reminder when a new proprietor or pharmacist-in-charge takes control for a month or more. That's new functionality, so it's listed only.

Reply "approve S8 fix" (and say whether you want the optional reminder), and I'll build and test it.
