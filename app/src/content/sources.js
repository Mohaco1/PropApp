// Where every rule in the app comes from (current app's codex-fixes.js SOURCES, same titles, dates and links),
// plus the NSW Health law pages read in the 20 Nov 2026 crawl (uat/research/nsw-health-site-pages.json, p051/p056/p108).
// Only links that were read are listed here, except the three with no read date (TGA vapes x2, eNRMC): those links come from
// the independent review (Gemini, 25 Nov) and back content the app already had; their pages haven't been opened here. [key, title, last read, pattern that finds it in the app's text, url]
export const SOURCES = [
  ['reg', 'Medicines, Poisons and Therapeutic Goods Regulation 2026 (NSW)', '2026-11-20', /Regulation 2026|Regulation s \d|\(s \d+|\bs 1\d\d\b/, 'https://legislation.nsw.gov.au/view/html/inforce/current/sl-2026-0330'],
  ['nswlaw', 'NSW Health: medicines, poisons and therapeutic goods legislation overview', '2026-11-20', /from 5 Nov(ember)? 2026|new (NSW )?laws/i, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/medicines-poisons-laws-overview.aspx'],
  ['nswpharm', 'NSW Health: legislation changes for pharmacists', '2026-11-20', /no longer (needed|required|must)|approval number/i, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/medicine-laws-pharmacists.aspx'],
  ['nswfaq', 'NSW Health: pharmacists, frequently asked questions', '2026-11-20', /NSW Health FAQ/i, 'https://www.health.nsw.gov.au/pharmaceutical/pharmacists/Pages/faq-pharmacists.aspx'],
  ['mss', 'NSW Medicine Storage Standards', '2026-11-20', /Storage Standards/, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/medicine-storage-standards.aspx'],
  ['edr', 'NSW Electronic Drug Register Standards', '2026-11-20', /Electronic Drug Register/, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/electronic-register-standards.aspx'],
  ['otp', 'NSW OTP Standards and OTP registration', '2026-11-20', /OTP Standards|OTP registration/, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/otp-standards.aspx'],
  ['vacc', 'NSW Pharmacist Vaccination Standards and authorities', '2026-11-20', /Vaccination Standards|Immuniser|immuniser/, 'https://www.health.nsw.gov.au/immunisation/professionals/pharmacist-immunisers/Pages/default.aspx'],
  ['s45', 'Strive for 5 (national vaccine storage guidelines)', '2026-11-22', /Strive for 5/, 'https://www.health.gov.au/resources/publications/national-vaccine-storage-guidelines-strive-for-5'],
  ['ca', 'NSW pharmacist prescribing Class Authorities (expanded scope)', '2026-11-20', /Class Authorit|prescribing authorit/i, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/expanded-scope-pharmacists-information.aspx'],
  ['intent', 'NSW Health: Intention to provide expanded community pharmacy services', '2026-11-20', /Intention to provide/i, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/expanded-services-application.aspx'],
  ['vape', 'NSW Health vaping requirements and self-assessment', '2026-11-20', /vaping|vapes/i, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/nicotine-vaping.aspx'],
  ['cann', 'NSW Health Cannabis medicines', '2026-11-20', /Cannabis medicines/, 'https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis-medicines.aspx'],
  ['council', 'Pharmacy Council of NSW (premises, ownership, proprietor oversight)', '2026-11-21', /Pharmacy Council|Council Guide/, 'https://www.hpca.nsw.gov.au/councils/pharmacy'],
  ['pba', 'Pharmacy Board of Australia guidelines', '2026-11-21', /Pharmacy Board/, 'https://www.pharmacyboard.gov.au/Codes-Guidelines'],
  ['ppa', 'PPA Program Rules (DAA, Staged Supply, HMR, RMMR, MedsCheck)', '2026-11-20', /PPA|Program Rules/, 'https://www.ppaonline.com.au/'],
  ['tgavape', 'TGA: supplying therapeutic vapes in pharmacies', '', /TGA list of notified vapes|SAS Category C/, 'https://www.tga.gov.au/resources/guidance/supplying-therapeutic-vapes-pharmacies'],
  ['tgavapeph', 'TGA: vapes, information for pharmacists', '', /TGA list of notified vapes/, 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/vapes-information-pharmacists'],
  ['enrmc', 'Department of Health: eNRMC implementation extended to 31 March 2027', '', /eNRMC/, 'https://www.health.gov.au/news/electronic-national-residential-medication-charts-enrmc-implementation-timeframes-extended-to-31-march-2027'],
  ['tga', 'TGA (vapes, recalls, advertising)', '2026-11-22', /\bTGA\b/, 'https://www.tga.gov.au/'],
  ['privacy', 'Privacy Act 1988 and NSW HRIP Act', '2026-11-22', /Privacy Act|HRIP/, 'https://www.oaic.gov.au/privacy/notifiable-data-breaches'],
  ['nsp', 'NSW Needle and Syringe Program guideline GL2023_002', '2026-11-21', /GL2023_002|Needle and Syringe/, 'https://www1.health.nsw.gov.au/pds/Pages/doc.aspx?dn=GL2023_002'],
  ['fw', 'Fair Work Act 2009 and Pharmacy Industry Award', '2026-11-22', /Fair Work/, 'https://www.fairwork.gov.au/'],
];
export const sourceByKey = k => SOURCES.find(s => s[0] === k);
