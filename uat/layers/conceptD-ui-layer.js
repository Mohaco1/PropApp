/* ===== Concept D · Precision Command UI layer (UAT v28) =====
 * Presentation only. Reuses the app's existing data, rules and dialogs.
 * Writes nothing new to storage: every save goes through existing functions
 * (RPH.schedule.dialog, the meeting dialog, staff and setup editors).
 */
(function(){
const css=`
:root{--d-ink:#0c111c;--d-muted:#5b6476;--d-faint:#6f7787;--d-line:#e6e8ee;--d-soft:#f6f7f9;--d-sel:#f1f4fe;--d-accent:#2f5bea;--d-red:#c0281b;--d-amber:#a35a00;--d-green:#1c7a3e;--d-blue:#2f5bea}
html body{background:#fff;color:var(--d-ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif}
html body h1,html body h2,html body h3{font-family:inherit;letter-spacing:-.01em;color:var(--d-ink)}
html body h1{font-size:24px;font-weight:650;margin:0 0 14px}
html body>header{position:fixed;inset:0 0 auto 0;width:auto;height:56px;flex-direction:row;align-items:center;justify-content:flex-start;gap:14px;padding:0 20px;background:#fff;border:0;border-bottom:1px solid var(--d-line);z-index:6}
html body>header strong{font-size:18px;letter-spacing:-.4px}
html body>header strong:before{background:var(--d-accent);transform:none;width:8px;height:8px;border-radius:2px;margin-right:8px;vertical-align:2px}
html body>header>span{margin:0;color:var(--d-muted);font-size:13px;max-width:28ch}
.d-headtools{margin-left:auto;display:flex;align-items:center;gap:8px;min-width:0}
.d-site{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--d-muted)}
.d-site select{min-height:36px;border:1px solid var(--d-line);border-radius:8px;padding:0 8px;background:#fff;font:inherit;color:var(--d-ink);max-width:220px}
.d-search{min-height:36px;border:1px solid var(--d-line);border-radius:8px;background:var(--d-soft);color:var(--d-muted);padding:0 12px;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.d-search kbd{font:11px/1 inherit;border:1px solid var(--d-line);border-radius:4px;padding:2px 4px;margin-left:8px;background:#fff}
html body .rph-header-actor{min-height:36px;border:1px solid var(--d-line);border-radius:18px;background:#fff;padding:0 12px;display:flex;gap:6px;align-items:center;font-size:13px}
html body>nav{position:fixed;inset:56px 0 auto 0;width:auto;height:46px;flex-direction:row;align-items:stretch;gap:2px;padding:0 14px;background:#fff;border:0;border-bottom:1px solid var(--d-line);overflow-x:auto;overflow-y:hidden;z-index:5;scrollbar-width:none}
html body>nav button{border-radius:0;padding:0 11px;gap:0;color:var(--d-muted);font-weight:550;font-size:14px;white-space:nowrap;border-bottom:2px solid transparent;min-height:44px}
html body>nav button svg{display:none}
html body>nav button:hover{color:var(--d-ink);background:transparent}
html body>nav button[aria-current=page]{background:transparent;color:var(--d-ink);border-bottom-color:var(--d-ink)}
html body>main{margin:0 auto;padding:112px clamp(16px,3vw,40px) 56px;max-width:1280px}
html body>#status{position:fixed;inset:112px 16px auto auto;height:auto;min-height:0;margin:0;width:auto;max-width:min(520px,calc(100vw - 32px));z-index:8;background:var(--d-ink);color:#fff;border-radius:10px;box-shadow:0 8px 30px #0c111c1f}
@media(max-width:700px){html body>#status{inset:auto 16px 76px 16px}}
html body .card{border:1px solid var(--d-line);border-radius:10px;box-shadow:none;background:#fff}
html body .pill{border-radius:4px;background:transparent;border:0;padding:0;font-weight:600;color:var(--d-muted)}
html body .pill.late{color:var(--d-red)}html body .pill.soon{color:var(--d-amber)}html body .pill.done{color:var(--d-green)}html body .pill.progress{color:var(--d-blue)}
html body .wq-dot.red{background:var(--d-red)}html body .wq-dot.amber{background:var(--d-amber)}html body .wq-dot.green{background:var(--d-green)}
html body .wq-listrow,html body .work-row,html body .hubrow{border:0;border-bottom:1px solid var(--d-line);border-radius:0;background:#fff;box-shadow:none}
html body .wq-listrow:hover,html body .work-row:hover,html body .hubrow:hover{background:var(--d-soft)}
html body .work-row[aria-pressed=true]{background:var(--d-sel);box-shadow:inset 3px 0 0 var(--d-ink)}
html body .wq-tabs,html body #work-tabs,html body #review-tabs{border-bottom:1px solid var(--d-line);gap:4px}
html body .wq-tabs>button,html body #work-tabs>button{border:0;border-radius:0;background:transparent;border-bottom:2px solid transparent;color:var(--d-muted);min-height:44px}
html body .wq-tabs>button[aria-pressed=true],html body #work-tabs>button[aria-pressed=true]{color:var(--d-ink);border-bottom-color:var(--d-ink);background:transparent}
html body #context-panel{border:1px solid var(--d-line);border-radius:10px;box-shadow:0 8px 30px #0c111c14}
@media(min-width:701px){
 html body dialog#editor{position:fixed;inset:0 0 0 auto;margin:0;height:100dvh;max-height:100dvh;width:min(560px,100vw);max-width:100vw;border:0;border-left:1px solid var(--d-line);border-radius:0;box-shadow:-12px 0 40px #0c111c1f;background:#fff;padding:24px 28px}
}
@media(max-width:700px){
 html body>header{position:sticky;top:0;height:auto;min-height:56px;flex-wrap:wrap;padding:8px 14px;gap:8px}
 html body>header>span{display:none}
 .d-headtools{width:100%;margin:0;flex-wrap:wrap}
 .d-site{flex:1 1 100%}.d-site select{flex:1;max-width:none;min-height:44px}
 .d-search{min-height:44px;flex:1}.d-search kbd{display:none}
 html body .rph-header-actor{min-height:44px}
 html body>main{padding:16px 16px 84px}
 html body dialog#editor{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;inset:0;border-radius:0;border:0;padding:16px}
 html body .mobilebar{background:#fff;border-top:1px solid var(--d-line)}
 html body .mobilebar button{min-height:48px;background:transparent;border:0;color:var(--d-muted);font-weight:600}
 html body .mobilebar button[aria-current=page]{color:var(--d-ink);box-shadow:inset 0 2px 0 var(--d-ink)}
}
/* Calendar page */
.d-tabs{display:flex;gap:4px;border-bottom:1px solid var(--d-line);margin:0 0 18px;overflow-x:auto}
.d-tabs button{border:0;background:transparent!important;box-shadow:none;border-bottom:2px solid transparent;border-radius:0;min-height:44px;padding:0 12px;color:var(--d-muted);font-weight:600;white-space:nowrap}
.d-tabs button[aria-selected=true]{color:var(--d-ink);border-bottom-color:var(--d-ink)}
.d-statusline{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px;color:var(--d-muted);margin:0 0 16px}
.d-statusline b{font-weight:650}
.w-overdue{color:var(--d-red)}.w-soon{color:var(--d-amber)}.w-up{color:var(--d-muted)}.w-prog{color:var(--d-blue)}.w-done{color:var(--d-green)}
.d-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#b8bfcc;margin-right:6px;vertical-align:1px}
.d-dot.w-overdue{background:var(--d-red)}.d-dot.w-soon{background:var(--d-amber)}.d-dot.w-prog{background:var(--d-blue)}.d-dot.w-done{background:var(--d-green)}
.d-week{margin:0 0 22px}
.d-week h2{font-size:15px;margin:0 0 4px;display:flex;gap:10px;align-items:baseline}
.d-week h2 small{font-weight:500;color:var(--d-faint);font-size:13px}
.d-table{width:100%;border-collapse:collapse;font-size:14px}
.d-week .d-table{table-layout:fixed}.d-week .d-table th:nth-child(2){width:22%}.d-week .d-table th:nth-child(3){width:24%}
.d-table th{font-size:12px;font-weight:600;color:var(--d-faint);text-align:left;padding:6px 8px;border-bottom:1px solid var(--d-line);white-space:nowrap}
.d-table td{padding:0 8px;border-bottom:1px solid var(--d-line);height:46px;vertical-align:middle}
.d-table tr.d-row{cursor:pointer}
.d-table tr.d-row:hover td{background:var(--d-soft)}
.d-table tr.sel td{background:var(--d-sel)}.d-table tr.sel td:first-child{box-shadow:inset 3px 0 0 var(--d-ink)}
.d-table td button.d-link{border:0;background:transparent;padding:0;min-height:44px;font:inherit;font-weight:600;color:var(--d-ink);text-align:left;cursor:pointer}
.d-table td button.d-link:hover{text-decoration:underline}
.d-status{font-weight:600;white-space:nowrap}
.d-muted{color:var(--d-muted)}
.d-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.d-year{min-width:860px}
.d-year td.m{text-align:center;padding:0 2px;font-size:12px;font-weight:650;width:52px}
.d-year th.m{text-align:center}
.d-year th.now{color:var(--d-ink)}
.d-year td.m span{display:inline-block;min-width:44px;padding:3px 0;border-radius:4px}
.d-year td.m .done{color:var(--d-green);background:#e8f4ec}
.d-year td.m .overdue{color:var(--d-red);background:#fbeceb}
.d-year td.m .planned{color:var(--d-ink);background:var(--d-soft);border:1px solid var(--d-line)}
.d-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--d-muted);margin:10px 0}
.d-legend span b{font-weight:650}
.d-legal{font-weight:700;color:var(--d-muted);margin-left:6px}
.d-note{border:1px solid var(--d-line);border-left:3px solid var(--d-amber);border-radius:8px;padding:12px 14px;margin:14px 0;background:#fff}
.d-note h3{font-size:15px;margin:0 0 4px}
.d-note ul{margin:6px 0 0;padding-left:18px}.d-note li{margin:2px 0}
.d-note button{border:0;background:transparent;color:var(--d-accent);font-weight:600;min-height:44px;padding:0 6px;cursor:pointer}
.d-yearnav{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.d-yearnav strong{font-size:16px;min-width:60px}
.d-yearnav button,.d-plain button{min-height:44px;border:1px solid var(--d-line);border-radius:8px;background:#fff;padding:0 14px;font-weight:600;cursor:pointer}
.d-plain{border:1px solid var(--d-line);border-radius:10px;padding:14px;margin:18px 0;background:var(--d-soft)}
.d-plain h3{font-size:15px;margin:0 0 6px}
.d-plain form{display:flex;gap:8px;flex-wrap:wrap}
.d-plain input{flex:1 1 240px;min-height:44px;border:1px solid var(--d-line);border-radius:8px;padding:0 12px;font:inherit;background:#fff}
.d-plain .d-preview{margin:10px 0 0;font-size:14px}
.d-plain button.primary{background:var(--d-ink);color:#fff;border-color:var(--d-ink)}
.d-month-wrap #review-tabs{display:none}
.d-month-wrap>h1{display:none}
/* Staff matrix (B style) */
.d-staff-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start}
@media(min-width:1100px){.d-staff-grid.has-pane{grid-template-columns:minmax(0,1fr) 380px}}
.d-staff .d-table td{height:52px}
.d-staff td.name button{border:0;background:transparent;font:inherit;font-weight:650;min-height:44px;padding:0;text-align:left;cursor:pointer;color:var(--d-ink)}
.d-staff td.name button .wq-dot{display:none}
.d-pane{border:1px solid var(--d-line);border-radius:10px;padding:18px;background:#fff;position:sticky;top:120px}
.d-pane h2{font-size:18px;margin:0 0 2px}
.d-pane ul{list-style:none;padding:0;margin:12px 0}
.d-pane li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--d-line);padding:8px 0;font-size:14px}
.d-pane .d-actions{display:flex;flex-wrap:wrap;gap:8px}
.d-pane .d-actions button{min-height:44px;border:1px solid var(--d-line);border-radius:8px;background:#fff;padding:0 14px;font-weight:600}
.d-pane .d-actions button.primary{background:var(--d-ink);border-color:var(--d-ink);color:#fff}
.d-sub{display:none}
@media(max-width:700px){.d-staff .d-sub{display:block;font-size:13px;color:var(--d-muted);padding-bottom:8px;margin-top:-6px}}
@media(max-width:700px){
 .d-staff .d-hide-m{display:none}
 .d-week .d-table{font-size:13px}.d-week .d-table th:nth-child(2){width:27%}.d-week .d-table th:nth-child(3){width:31%}.d-week .d-table td:nth-child(2){white-space:nowrap}
 .d-pane{position:static}
}
/* Onboarding tiles */
.fresh-form .d-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:10px 0}
.fresh-form .d-tiles>label{display:flex;gap:10px;align-items:center;border:1px solid var(--d-line);border-radius:10px;padding:10px 12px;min-height:48px;cursor:pointer;background:#fff;font-weight:550;margin:0}
.fresh-form .d-tiles>label:has(input:checked){border-color:var(--d-ink);background:var(--d-sel);box-shadow:inset 0 0 0 1px var(--d-ink)}
.fresh-form .d-tiles input{width:20px;height:20px;margin:1px 0 0;flex:none}
.d-progress{height:6px;background:var(--d-soft);border-radius:3px;overflow:hidden;margin:4px 0 4px}
.d-progress i{display:block;height:100%;background:var(--d-ink)}
.d-plan{border:1px solid var(--d-line);border-radius:10px;padding:12px 14px;margin:12px 0;background:var(--d-soft);font-size:14px}
.d-plan h3{font-size:15px;margin:0 0 6px}
.d-plan ul{margin:4px 0 0;padding-left:18px}
.d-plan p{margin:4px 0;color:var(--d-muted)}
/* Jump palette */
#d-jump{position:fixed;inset:0;background:#0c111c40;display:flex;align-items:flex-start;justify-content:center;padding-top:12vh;z-index:20}
#d-jump>div{background:#fff;border-radius:12px;width:min(560px,94vw);box-shadow:0 20px 60px #0c111c40;overflow:hidden}
#d-jump input{width:100%;border:0;border-bottom:1px solid var(--d-line);min-height:52px;padding:0 16px;font:inherit;font-size:16px;outline:none}
#d-jump ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}
#d-jump li button{width:100%;text-align:left;border:0;background:transparent;min-height:44px;padding:0 10px;border-radius:6px;font:inherit;display:flex;justify-content:space-between;gap:10px}
#d-jump li button[aria-selected=true],#d-jump li button:hover{background:var(--d-sel)}
#d-jump li small{color:var(--d-faint)}
`;
const style=document.createElement('style');style.id='concept-d-style';style.textContent=css;document.head.append(style);
})();

/* ---------- shared helpers ---------- */
const D={};
D.el=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k.startsWith('on'))e[k]=v;else e.setAttribute(k,v);}for(const k of kids)if(k!=null)e.append(k);return e;};
D.iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
D.date=s=>new Date(s+'T12:00:00');
D.weekStart=s=>{const d=D.date(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return D.iso(d);};
D.addDays=(s,n)=>{const d=D.date(s);d.setDate(d.getDate()+n);return D.iso(d);};
D.short=s=>D.date(s).toLocaleDateString('en-AU',(window.innerWidth<=700||D.phone)?{day:'numeric',month:'short'}:{weekday:'short',day:'numeric',month:'short'});
/* One status word per row. Uses the same draft checks as the Audits page. */
D.inProgress=r=>!!(r.draft||readDraft('event-audit/'+r.id)||(r.id.startsWith('A1/')&&readDraft('staff-review/annual/'+r.id.slice(3))));
D.status=r=>{
 if(D.inProgress(r))return {word:'In progress',cls:'w-prog'};
 if(!r.date)return {word:'No date',cls:'w-up'};
 if(r.date<today())return {word:'Overdue',cls:'w-overdue'};
 if(r.date<=addInterval(today(),7,'days'))return {word:r.date===today()?'Due today':'Due soon',cls:'w-soon'};
 return {word:'Upcoming',cls:'w-up'};
};
D.word=(s)=>{const w=D.el('span',{class:'d-status '+s.cls});w.append(D.el('i',{class:'d-dot '+s.cls,'aria-hidden':'true'}),s.word);return w;};
D.legal=id=>{try{const k=RPH.schedule.basis(id).kind;return k==='regulation'||k==='external';}catch{return false;}};
/* Calendar rows: the same rows the Audits "Calendar" tab shows (active reviews and scheduled meetings). */
D.rows=()=>{
 const rows=entries().filter(r=>r.active);
 if(state.freshSite)for(const [id,label] of Object.entries(scheduledMeetings)){const date=state.schedule[id];if(date&&!rows.some(r=>r.id===id))rows.push({id,label,date,active:true,meetingType:true,run:()=>editMeeting(id)});}
 return rows;
};
D.open=r=>{const fn=readDraft('event-audit/'+r.id)&&!r.draft?()=>reviewEditor(r.id,true):r.run;fn();};
/* A date can be changed with the existing reasoned dialog for reviews and meetings that have a schedule entry. */
D.canReschedule=r=>!r.id.startsWith('A1/')&&!r.id.startsWith('annual-policy/')&&catalog().some(a=>a.id===r.id)||!!scheduledMeetings[r.id];
D.changeDate=(r,prefill)=>{
 if(!D.canReschedule(r))return D.open(r);
 RPH.schedule.dialog(r.id,()=>render());
 if(prefill){const input=$('editor').querySelector('input[type=date]');if(input){input.value=prefill;input.dispatchEvent(new Event('input'));}}
};
D.completedOn=()=>state.reviews.filter(r=>r.date).map(r=>({id:r.audit,label:r.templateName||catalog().find(a=>a.id===auditKey(r.audit))?.name||r.audit,date:r.date,review:r}));

/* ---------- header: pharmacy switcher, jump search ---------- */
D.header=function(){
 const header=document.querySelector('body>header');if(!header)return;
 let tools=$('d-headtools');
 if(!tools){tools=D.el('div',{id:'d-headtools',class:'d-headtools'});header.append(tools);}
 const actor=$('rph-header-actor');
 tools.replaceChildren();
 let dir=null;try{dir=siteDirectory();}catch{}
 if(dir&&dir.sites&&dir.sites.length>1){
  const label=D.el('label',{class:'d-site'});const sel=D.el('select',{'aria-label':'Pharmacy'});
  for(const entry of dir.sites){let name=state.pharmacyName;if(entry.id!==dir.active){try{name=JSON.parse(localStorage.getItem(entry.slot)).pharmacyName;}catch{name='Unavailable location';}}sel.add(new Option(name||'New pharmacy',entry.id));}
  sel.value=dir.active;sel.onchange=()=>chooseSite(sel.value);label.append(D.el('span',{text:'Pharmacy'}),sel);tools.append(label);
 }
 if(state.freshSite){const s=D.el('button',{type:'button',class:'d-search','aria-label':'Search or jump to a page or review'});s.append('Search or jump to…',D.el('kbd',{text:navigator.platform?.includes('Mac')?'⌘K':'Ctrl K'}));s.onclick=D.jump;tools.append(s);}
 if(actor)tools.append(actor);
};
/* Jump only: opens existing pages and records. Never changes data. */
D.jump=function(){
 if($('d-jump'))return;
 const pages=[...document.querySelectorAll('body>nav [data-page]')].map(b=>({label:b.textContent.trim(),hint:'Page',go:()=>{if(b.dataset.page==='setup')return beginSetup();page=b.dataset.page;render();}}));
 const recs=entries().filter(r=>r.active).map(r=>({label:r.label,hint:r.date?pretty(r.date):'No date',go:()=>D.open(r)}));
 const staffRecs=(state.staff||[]).filter(p=>p.active!==false).map(p=>({label:p.person,hint:'Staff',go:()=>{profileId=p.id;profileTab='Credentials';gotoPage('staff-profile');}}));
 const all=[...pages,...recs,...staffRecs];
 const wrap=D.el('div',{id:'d-jump',role:'dialog','aria-modal':'true','aria-label':'Search or jump to'});const box=D.el('div');wrap.append(box);
 const input=D.el('input',{type:'search','aria-label':'Search pages, reviews and staff',placeholder:'Search pages, reviews and staff'});const list=D.el('ul',{role:'listbox'});box.append(input,list);
 let sel=0,shown=[];
 const close=()=>{wrap.remove();document.removeEventListener('keydown',onKey,true);};
 const draw=()=>{const q=input.value.trim().toLowerCase();shown=all.filter(x=>x.label.toLowerCase().includes(q)).slice(0,12);sel=Math.min(sel,Math.max(0,shown.length-1));list.replaceChildren(...shown.map((x,i)=>{const b=D.el('button',{type:'button',role:'option','aria-selected':String(i===sel)});b.append(D.el('span',{text:x.label}),D.el('small',{text:x.hint}));b.onclick=()=>{close();x.go();};return D.el('li',{},b);}));if(!shown.length)list.append(D.el('li',{class:'d-muted',text:'No matches'}));};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,shown.length-1);draw();}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);draw();}else if(e.key==='Enter'&&shown[sel]){e.preventDefault();const x=shown[sel];close();x.go();}};
 document.addEventListener('keydown',onKey,true);wrap.onclick=e=>{if(e.target===wrap)close();};input.oninput=()=>{sel=0;draw();};
 document.body.append(wrap);draw();input.focus();
};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&state.freshSite&&!$('editor').open){e.preventDefault();D.jump();}});

/* ---------- navigation: add the Calendar tab ---------- */
(function(){
 const nav=document.querySelector('body>nav');if(!nav||nav.querySelector('[data-page="planner"]'))return;
 const b=D.el('button',{'data-page':'planner',type:'button'});b.textContent='Calendar';
 b.onclick=()=>{page='planner';render();};
 const audits=nav.querySelector('[data-page="audits"]');(audits?audits.after(b):nav.append(b));
})();

/* ---------- Calendar page ---------- */
let plannerTab='Weekly',plannerYear=Number(today().slice(0,4)),plannerKeptReviewTab=null,plannerSel='';
function plannerView(){
 const main=$('main');
 if(plannerTab==='Month'){
  if(plannerKeptReviewTab===null)plannerKeptReviewTab=reviewTab;
  reviewTab='Calendar';calendar();main.classList.add('d-month-wrap');
 }else{main.classList.remove('d-month-wrap');main.replaceChildren();}
 const h=D.el('h1',{text:'Calendar'});
 const tabs=D.el('div',{class:'d-tabs',role:'tablist','aria-label':'Calendar views'});
 for(const [name,label] of [['Weekly','Weekly breakdown'],['Year','Year plan'],['Month','Month']]){const t=D.el('button',{type:'button',role:'tab','aria-selected':String(plannerTab===name)});t.textContent=label;t.onclick=()=>{plannerTab=name;render();main.querySelector('.d-tabs [aria-selected=true]')?.focus();};tabs.append(t);}
 const rows=D.rows();
 const line=D.el('p',{class:'d-statusline'});
 const counts=[['Overdue','w-overdue',rows.filter(r=>D.status(r).cls==='w-overdue').length],['Due soon','w-soon',rows.filter(r=>D.status(r).cls==='w-soon').length],['In progress','w-prog',rows.filter(r=>D.inProgress(r)).length],['No date','w-up',rows.filter(r=>!r.date).length]];
 for(const [label,cls,n] of counts){const s=D.el('span',{class:n&&cls!=='w-up'?cls:''});s.append(D.el('b',{text:String(n)}),' '+label.toLowerCase());line.append(s);}
 const top=D.el('div',{id:'planner-head'},h,line,tabs);
 main.prepend(top);
 const body=D.el('div',{id:'planner-body'});
 if(plannerTab==='Weekly'){top.after(body);plannerWeekly(body,rows);}
 else if(plannerTab==='Year'){top.after(body);plannerYearPlan(body,rows);}
 else{const list=$('cal-rows');(list?list.after(body):main.append(body));plannerPlain(body,rows);const link=D.el('p',{class:'d-muted'});link.append('Search and filters below apply to this month view, as on the Audits page.');body.append(link);}
}
function plannerTable(headers){const t=D.el('table',{class:'d-table'});const tr=D.el('tr');for(const [h,cls] of headers)tr.append(D.el('th',{text:h,class:cls||'',scope:'col'}));t.append(D.el('thead',{},tr));const tb=D.el('tbody');t.append(tb);return [t,tb];}
function plannerWeekly(host,rows){
 const now=today(),thisWeek=D.weekStart(now),nextWeek=D.addDays(thisWeek,7),horizon=D.addDays(thisWeek,7*8);
 const groups=new Map();const add=(k,title,sub,item)=>{if(!groups.has(k))groups.set(k,{title,sub,items:[]});groups.get(k).items.push(item);};
 const overdue=rows.filter(r=>r.date&&r.date<thisWeek).sort((a,b)=>a.date.localeCompare(b.date));
 for(const r of overdue)add('0','Overdue from earlier weeks','',{r,s:D.status(r)});
 const dated=rows.filter(r=>r.date&&r.date>=thisWeek&&r.date<horizon);
 const done=D.completedOn().filter(c=>c.date>=thisWeek&&c.date<=now);
 const weeks=[];for(let w=thisWeek;w<horizon;w=D.addDays(w,7))weeks.push(w);
 for(const w of weeks){const end=D.addDays(w,6);const title=w===thisWeek?'This week':w===nextWeek?'Next week':'Week of '+D.date(w).toLocaleDateString('en-AU',{day:'numeric',month:'short'});const sub=D.date(w).toLocaleDateString('en-AU',{day:'numeric',month:'short'})+' – '+D.date(end).toLocaleDateString('en-AU',{day:'numeric',month:'short'});
  for(const c of done.filter(c=>c.date>=w&&c.date<=end))add(w,title,sub,{done:c,s:{word:'Completed',cls:'w-done'}});
  for(const r of dated.filter(r=>r.date>=w&&r.date<=end).sort((a,b)=>a.date.localeCompare(b.date)))add(w,title,sub,{r,s:D.status(r)});
  if(w===thisWeek||w===nextWeek)if(!groups.has(w))groups.set(w,{title,sub,items:[]});
 }
 const later=rows.filter(r=>r.date&&r.date>=horizon).sort((a,b)=>a.date.localeCompare(b.date));
 for(const r of later)add('9','Later','After '+D.date(D.addDays(horizon,-1)).toLocaleDateString('en-AU',{day:'numeric',month:'short'}),{r,s:D.status(r)});
 for(const r of rows.filter(r=>!r.date))add('z','No date yet','Set a date from the Audits page or here',{r,s:D.status(r)});
 const order=[...groups.keys()].sort((a,b)=>a==='0'?-1:b==='0'?1:a==='z'?1:b==='z'?-1:a==='9'?1:b==='9'?-1:a.localeCompare(b));
 for(const k of order){const g=groups.get(k);const sec=D.el('section',{class:'d-week'});const h=D.el('h2',{},g.title);if(g.sub)h.append(D.el('small',{text:g.sub}));h.append(D.el('small',{text:g.items.length+(g.items.length===1?' item':' items')}));sec.append(h);
  if(!g.items.length){sec.append(D.el('p',{class:'d-muted',text:'Nothing due.'}));host.append(sec);continue;}
  const [t,tb]=plannerTable([['Item'],['Due'],['Status']]);
  for(const it of g.items){const tr=D.el('tr');
   if(it.done){const b=D.el('button',{type:'button',class:'d-link'});b.textContent=it.done.label;b.onclick=()=>it.done.review.meeting?meetingEditor(it.done.review.meeting):historyEntries().find(x=>x.type==='Review'&&x.id===it.done.review.id)?.open();tr.append(D.el('td',{},b),D.el('td',{class:'d-muted',text:'Recorded '+D.short(it.done.date)}),D.el('td',{},D.word(it.s)));}
   else{const r=it.r,b=D.el('button',{type:'button',class:'d-link'});b.textContent=r.label;b.onclick=()=>D.open(r);const name=D.el('td',{},b);if(D.legal(r.id))name.append(D.el('span',{class:'d-legal',title:'Legal or external date',text:'§'}));
    tr.append(name,D.el('td',{class:'d-muted',text:r.date?D.short(r.date):'—'}),D.el('td',{},D.word(it.s)));}
   tb.append(tr);}
  sec.append(t);host.append(sec);}
 host.append(D.el('p',{class:'d-legend'},D.el('span',{text:'§ legal or external date. Dates come from your schedule; nothing here changes them.'})));
}
function plannerYearPlan(host,rows){
 const y=plannerYear,months=[...Array(12)].map((_,i)=>i),now=today(),nowMonth=now.slice(0,7);
 const nav=D.el('div',{class:'d-yearnav'});const prev=D.el('button',{type:'button','aria-label':'Previous year'});prev.textContent='‹ '+(y-1);prev.onclick=()=>{plannerYear--;render();};const next=D.el('button',{type:'button','aria-label':'Next year'});next.textContent=(y+1)+' ›';next.onclick=()=>{plannerYear++;render();};nav.append(prev,D.el('strong',{text:String(y)}),next);host.append(nav);
 const done=D.completedOn();
 const items=rows.filter(r=>!r.meetingType||r.date);
 const byId=new Map();for(const r of items)byId.set(r.id,r);
 const [t,tb]=plannerTable([['Review'],...months.map(m=>[new Date(y,m,1).toLocaleDateString('en-AU',{month:'short'}),'m'+((y+'-'+String(m+1).padStart(2,'0'))===nowMonth?' now':'')])]);t.classList.add('d-year');
 const monthLoad=Array(12).fill(0),monthItems=[...Array(12)].map(()=>[]);
 for(const r of items){const tr=D.el('tr');const b=D.el('button',{type:'button',class:'d-link'});b.textContent=r.label;b.onclick=()=>D.open(r);const name=D.el('td',{},b);if(D.legal(r.id))name.append(D.el('span',{class:'d-legal',title:'Legal or external date',text:'§'}));tr.append(name);
  for(const m of months){const ym=y+'-'+String(m+1).padStart(2,'0');const td=D.el('td',{class:'m'});const marks=[];
   const did=done.filter(c=>c.id===(r.id.startsWith('A1/')?'A1':r.id)&&c.date.startsWith(ym)&&(!r.id.startsWith('A1/')||c.review.personId===r.id.slice(3)||c.review.answers?.some(a=>a.personId===r.id.slice(3))));
   if(did.length)marks.push(['done','Done']);
   if(r.date&&r.date.startsWith(ym)){if(r.date<now)marks.push(['overdue','Overdue']);else{marks.push(['planned','Planned']);monthLoad[m]++;monthItems[m].push(r);}}
   for(const [cls,word] of marks){td.append(D.el('span',{class:cls,title:word+' · '+r.label,text:word}));}
   if(!marks.length)td.append(D.el('span',{'aria-hidden':'true',text:''}));
   tr.append(td);}
  tb.append(tr);}
 const scroll=D.el('div',{class:'d-scroll'},t);host.append(scroll);
 host.append(D.el('div',{class:'d-legend'},D.el('span',{},D.el('b',{class:'w-done',text:'Done'}),' a review was recorded'),D.el('span',{},D.el('b',{class:'w-overdue',text:'Overdue'}),' due date has passed'),D.el('span',{},D.el('b',{text:'Planned'}),' next due date'),D.el('span',{},D.el('b',{text:'§'}),' legal or external date')));
 host.append(D.el('p',{class:'d-muted',text:'Only recorded reviews and the next due date are shown. Later repeats appear once each review is completed and its next date is set.'}));
 /* Busy-month note: informational only. Each item opens the existing date dialog. */
 const planned=monthLoad.filter(n=>n>0),avg=planned.length?planned.reduce((a,b)=>a+b,0)/planned.length:0,peak=Math.max(0,...monthLoad),m=monthLoad.indexOf(peak);
 if(peak>=5||peak>=4&&peak>=avg*1.5){const name=new Date(y,m,1).toLocaleDateString('en-AU',{month:'long'});const note=D.el('div',{class:'d-note',role:'note'});note.append(D.el('h3',{text:name+' looks heavy · '+peak+' reviews due'}),D.el('p',{class:'d-muted',text:'You may want to spread them out. Changing a date uses the usual dialog and asks for a reason when a date is pushed later.'}));
  const ul=D.el('ul');for(const r of monthItems[m]){const li=D.el('li',{},r.label+' · '+D.short(r.date)+' ');const c=D.el('button',{type:'button'});if(D.canReschedule(r)){c.textContent='Change date';c.setAttribute('aria-label','Change date · '+r.label);c.onclick=()=>D.changeDate(r);}else{c.textContent='Open';c.setAttribute('aria-label','Open · '+r.label);c.onclick=()=>D.open(r);}li.append(c);ul.append(li);}note.append(ul);host.prepend(note);}
}
/* Plain-words planner: reads a sentence, finds the review and the date, then opens the existing date dialog prefilled. Nothing is saved until you confirm there. */
D.months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
D.parseDate=function(text){
 const t=text.toLowerCase(),now=D.date(today());
 if(/\btoday\b/.test(t))return today();
 if(/\btomorrow\b/.test(t))return D.addDays(today(),1);
 let m=t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);if(m)return m[0];
 m=t.match(/\bin (\d{1,2}) (day|days|week|weeks)\b/);if(m)return D.addDays(today(),Number(m[1])*(m[2].startsWith('week')?7:1));
 m=t.match(/\b(\d{1,2})(?:st|nd|rd|th)?(?: of)? (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?: (\d{4}))?\b/)||null;
 let day,mon,yr;
 if(m){day=+m[1];mon=D.months.indexOf(m[2]);yr=m[3]?+m[3]:null;}
 else{m=t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?(?:,? (\d{4}))?\b/);if(m){day=+m[2];mon=D.months.indexOf(m[1]);yr=m[3]?+m[3]:null;}}
 if(mon==null||mon<0)return '';
 if(yr==null){yr=now.getFullYear();const c=new Date(yr,mon,day,12);if(D.iso(c)<today())yr++;}
 const d=new Date(yr,mon,day,12);if(d.getMonth()!==mon)return '';return D.iso(d);
};
D.match=function(text,rows){
 const words=text.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!['on','the','for','at','in','of','and','morning','afternoon','evening','am','pm','check','review','add','book','plan','next','this'].includes(w)&&!D.months.some(mo=>w.startsWith(mo))&&!/^\d+(st|nd|rd|th)?$/.test(w));
 if(!words.length)return null;
 let best=null,score=0;
 for(const r of rows){const label=r.label.toLowerCase();let s=0;for(const w of words)if(label.includes(w))s+=w.length;if(s>score){score=s;best=r;}}
 return best;
};
function plannerPlain(host,rows){
 const box=D.el('section',{class:'d-plain','aria-labelledby':'d-plain-title'});box.append(D.el('h3',{id:'d-plain-title',text:'Plan in plain words'}));
 const f=D.el('form',{id:'d-plain-form'});const input=D.el('input',{type:'text',name:'q','aria-label':'Describe what to plan, for example: S8 check 1st Dec',placeholder:'e.g. S8 check 1st Dec morning',autocomplete:'off'});const go=D.el('button',{type:'submit'});go.textContent='Find';f.append(input,go);box.append(f);
 const out=D.el('div',{class:'d-preview',role:'status','aria-live':'polite'});box.append(out);
 const options=[...rows];
 f.onsubmit=e=>{e.preventDefault();out.replaceChildren();const q=input.value.trim();if(!q)return out.append('Type what to plan and a date.');
  const r=D.match(q,options),date=D.parseDate(q),time=/\b(morning|afternoon|evening|\d{1,2}(:\d{2})?\s?(am|pm))\b/i.test(q);
  if(!r){out.append('No matching review or meeting found. Try part of its name, for example "S8" or "Site visit".');return;}
  if(!date){out.append('Found '+r.label+'. Add a date, for example "1 Dec" or "tomorrow".');return;}
  const p=D.el('p');p.append(D.el('b',{text:r.label}),' → '+pretty(date));if(r.date)p.append(D.el('span',{class:'d-muted',text:' (currently '+pretty(r.date)+')'}));out.append(p);
  if(time)out.append(D.el('p',{class:'d-muted',text:'Only the date is saved; reviews do not store a time of day.'}));
  if(D.canReschedule(r)){const add=D.el('button',{type:'button',class:'primary'});add.textContent='Add';add.setAttribute('aria-label','Add · open the date dialog for '+r.label);add.onclick=()=>D.changeDate(r,date);out.append(add,D.el('p',{class:'d-muted',text:'Opens the usual date dialog with this date filled in. Check it and save there.'}));}
  else{const open=D.el('button',{type:'button'});open.textContent='Open '+r.label;open.onclick=()=>D.open(r);out.append(D.el('p',{class:'d-muted',text:'This date is set from the staff record, not the schedule.'}),open);}
 };
 host.append(box);
}

/* ---------- Staff register: credentials matrix (B style) ---------- */
D.staffCell=function(items,kind){
 const pick=items.filter(i=>kind==='reg'?['registration','insurance'].includes(i.id):kind==='cred'?i.id.startsWith('credential/'):kind==='svc'?(i.id.startsWith('service/')||i.id.startsWith('path/')):!['registration','insurance'].includes(i.id)&&!i.id.startsWith('credential/')&&!i.id.startsWith('service/')&&!i.id.startsWith('path/'));
 if(!pick.length)return {word:'—',cls:'w-up',title:'Not required for this role'};
 const expired=pick.filter(i=>i.expired),needs=pick.filter(i=>i.outcome==='Needs Review'),soon=pick.filter(i=>i.soon);
 if(expired.length)return {word:'Expired',cls:'w-overdue',title:expired.map(i=>i.label).join('\n')};
 if(needs.length)return {word:needs.length===pick.length&&pick.length>1?'To verify ('+needs.length+')':needs.length>1?needs.length+' to verify':'To verify',cls:'w-overdue',title:needs.map(i=>i.label).join('\n')};
 if(soon.length){const first=soon.map(i=>i.expiry).sort()[0];return {word:'Expires '+D.date(first).toLocaleDateString('en-AU',{day:'numeric',month:'short'}),cls:'w-soon',title:soon.map(i=>i.label).join('\n')};}
 return {word:'Current',cls:'w-done',title:pick.map(i=>i.label).join('\n')};
};
D.annualCell=function(p){const d=personDue(p);if(!d)return {word:'No date',cls:'w-up'};if(d<today())return {word:'Overdue',cls:'w-overdue'};if(d===today())return {word:'Due today',cls:'w-soon'};if(d<=addInterval(today(),reminderLead(),'days'))return {word:'Due '+D.date(d).toLocaleDateString('en-AU',{day:'numeric',month:'short'}),cls:'w-soon'};return {word:'Due '+D.date(d).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'2-digit'}),cls:'w-up'};};
let staffPaneId='';
D.staffMatrix=function(){
 const host=$('staff-rows');if(!host)return;const cards=[...host.querySelectorAll(':scope>article')];
 if(!cards.length)return;
 const used=new Set(),people=cards.map(c=>{const name=c.querySelector('button')?.firstChild?.textContent||'';const p=(state.staff||[]).find(x=>x.person===name&&!used.has(x.id));if(p)used.add(p.id);return p;});
 const wrap=D.el('div',{class:'d-staff-grid d-staff',id:'d-staff-grid'});
 const [t,tb]=plannerTable([['Person'],['Role','d-hide-m'],['Registration','d-hide-m'],['Credentials','d-hide-m'],['Training','d-hide-m'],['Annual assurance','d-hide-m'],['Status']]);
 cards.forEach((card,i)=>{const p=people[i];const nameBtn=card.querySelector('button');const tr=D.el('tr',{class:'d-row'});
  const nameTd=D.el('td',{class:'name'},nameBtn);tr.append(nameTd);
  if(!p){tr.append(D.el('td',{class:'d-hide-m',text:card.querySelector('p')?.textContent||''}));for(let k=0;k<4;k++)tr.append(D.el('td',{class:'d-hide-m'}));tr.append(D.el('td'));tb.append(tr);return;}
  const items=staffItems(p);
  tr.append(D.el('td',{class:'d-hide-m d-muted',text:p.role}));
  const sub=[];for(const [kind,name] of [['reg','Registration'],['cred','Credentials'],['svc','Training']]){const c=D.staffCell(items,kind);const td=D.el('td',{class:'d-hide-m'},D.word(c));td.title=c.title||'';tr.append(td);if(c.cls==='w-overdue'||c.cls==='w-soon')sub.push(name+': '+c.word.toLowerCase());}
  const an=D.annualCell(p);tr.append(D.el('td',{class:'d-hide-m'},D.word(an)));if(an.cls==='w-overdue'||an.cls==='w-soon')sub.push('Annual: '+an.word.toLowerCase());
  if(sub.length)nameTd.append(D.el('span',{class:'d-sub',text:sub.join(' · ')}));
  const dot=nameBtn.querySelector('.wq-dot'),label=dot?.getAttribute('aria-label')||'Current';
  tr.append(D.el('td',{},D.word({word:label,cls:label==='Current'?'w-done':label==='Coming up'?'w-soon':'w-overdue'})));
  if(p.id===staffPaneId)tr.classList.add('sel');
  tr.onclick=e=>{if(e.target.closest('button'))return;staffPaneId=staffPaneId===p.id?'':p.id;D.staffMatrix.redraw();};
  tb.append(tr);});
 host.replaceChildren(wrap);const left=D.el('div',{},D.el('div',{class:'d-scroll'},t));wrap.append(left);
 const p=(state.staff||[]).find(x=>x.id===staffPaneId);
 if(p&&people.includes(p)){wrap.classList.add('has-pane');const pane=D.el('aside',{class:'d-pane','aria-label':'Selected staff member'});
  pane.append(D.el('p',{class:'eyebrow',text:p.role}),D.el('h2',{text:p.person}));
  const ul=D.el('ul');for(const i of staffItems(p)){const s=i.expired?{word:'Expired',cls:'w-overdue'}:i.outcome==='Needs Review'?{word:'To verify',cls:'w-overdue'}:i.soon?{word:'Expires '+pretty(i.expiry),cls:'w-soon'}:{word:i.outcome==='Not Applicable'?'Not applicable':'Current',cls:i.outcome==='Not Applicable'?'w-up':'w-done'};ul.append(D.el('li',{},D.el('span',{text:i.label}),D.word(s)));}
  const a=D.annualCell(p);ul.append(D.el('li',{},D.el('span',{text:'Annual assurance'}),D.word(a)));if(p.changePending)ul.append(D.el('li',{},D.el('span',{text:'Staff change'}),D.word({word:'Awaiting review',cls:'w-overdue'})));pane.append(ul);
  const acts=D.el('div',{class:'d-actions'});const open=D.el('button',{type:'button',class:'primary'});open.textContent='Open staff record';open.onclick=()=>{profileId=p.id;profileTab='Credentials';gotoPage('staff-profile');};
  const close=D.el('button',{type:'button'});close.textContent='Close';close.onclick=()=>{staffPaneId='';D.staffMatrix.redraw();};acts.append(open,close);pane.append(acts);
  wrap.append(pane);}
 D.staffMatrix.lastHost=host;
};
D.staffMatrix.redraw=function(){const s=$('staff-search');if(s&&s.oninput)s.oninput({target:s});else render();};
const dStaffRegister=staffRegister;
staffRegister=function(){dStaffRegister();const s=$('staff-search');if(s){const orig=s.oninput;s.oninput=e=>{orig(e);D.staffMatrix();};}D.staffMatrix();};

/* ---------- Onboarding: service tiles and "Your plan so far" ---------- */
const dServicesSelect=fsServicesSelect;
fsServicesSelect=function(){
 dServicesSelect();
 const b=$('editor')?.querySelector('.fresh-form');if(!b)return;
 const labels=[...b.querySelectorAll(':scope>label')].filter(l=>l.querySelector('input[type=checkbox]'));if(!labels.length)return;
 const steps=[!!state.freshSite,!!state.freshProprietors,false];const doneSteps=steps.filter(Boolean).length;
 const prog=D.el('div',{class:'d-progstep'});prog.append(D.el('p',{class:'eyebrow',text:'Step '+(doneSteps+1)+' of 4 · needed to start · step 4 sets up each service you choose'}),D.el('div',{class:'d-progress',role:'progressbar','aria-label':'Setup progress','aria-valuemin':'0','aria-valuemax':'4','aria-valuenow':String(doneSteps)},D.el('i',{style:'width:'+Math.round(doneSteps/4*100)+'%'})));
 const tiles=D.el('div',{class:'d-tiles'});labels[0].before(prog);prog.after(tiles);for(const l of labels)tiles.append(l);
 const plan=D.el('section',{class:'d-plan','aria-live':'polite'});tiles.before(plan);
 const order=displayOrder(services);
 const draw=()=>{
  const chosen=labels.map((l,i)=>l.querySelector('input').checked?order[i]:null).filter(Boolean);
  plan.replaceChildren(D.el('h3',{text:'Your plan so far'}));
  if(!chosen.length){plan.append(D.el('p',{text:'No services selected yet. Core reviews stay on your plan.'}));}
  else{const ul=D.el('ul');for(const s of chosen){const n=catalog().filter(a=>a.service===s.id&&!a.eventOnly).length;ul.append(D.el('li',{text:s.name+(n?' · '+n+(n===1?' review':' reviews')+' added':'')}));}plan.append(ul);}
  plan.append(D.el('p',{text:'You can change services later. Each one asks a few setup questions next; optional details can be added later.'}));
 };
 for(const l of labels)l.querySelector('input').addEventListener('change',draw);draw();
};

/* ---------- render: Calendar page, header, staff ---------- */
const dRender=render;
render=function(){
 if(page!=='planner'&&plannerKeptReviewTab!==null){reviewTab=plannerKeptReviewTab;plannerKeptReviewTab=null;}
 if(page!=='planner')$('main')?.classList.remove('d-month-wrap');
 if(page==='planner'){const keep=page;page='audits';dRender();page=keep;plannerView();
  document.querySelectorAll('body>nav [data-page]').forEach(b=>{if(b.dataset.page==='planner')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const mb=document.querySelector('.mobilebar');if(mb)[...mb.children].forEach((b,i)=>{if(i===3)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const cap=document.querySelector('body>header span');if(cap)cap.textContent=state.pharmacyName||'Proprietor oversight';
 }else dRender();
 D.header();
};
document.body.classList.add('concept-d');

/* ===== Part 2 · Concept D across every page (v29) ===== */
(function(){
const css=`
/* Base controls */
html body main button,html body #editor button{font:inherit;font-size:14px;font-weight:600;border:1px solid var(--d-line);border-radius:8px;background:#fff;color:var(--d-ink);min-height:40px;padding:0 14px;box-shadow:none;cursor:pointer}
html body main button:hover,html body #editor button:hover{background:var(--d-soft)}
html body main button.primary,html body #editor button.primary,html body #editor button.d-primary,html body main button.d-primary{background:var(--d-ink);border-color:var(--d-ink);color:#fff}
html body main button.primary:hover,html body #editor button.d-primary:hover,html body #editor button.primary:hover{background:#2a3242}
html body main button[aria-pressed=true]:not(.work-row):not(.wq-listrow),html body #editor button[aria-pressed=true]:not(.fresh-option){background:var(--d-sel);border-color:#c9d3f5;color:var(--d-ink)}
html body main input:not([type=checkbox]):not([type=radio]),html body main select,html body main textarea,html body #editor input:not([type=checkbox]):not([type=radio]),html body #editor select,html body #editor textarea{font:inherit;font-size:15px;border:1px solid #d5d9e2;border-radius:8px;background:#fff;color:var(--d-ink);min-height:42px;padding:0 12px;box-shadow:none}
html body main textarea,html body #editor textarea{padding:10px 12px;min-height:90px}
html body main input:focus-visible,html body main select:focus-visible,html body main textarea:focus-visible,html body #editor input:focus-visible,html body #editor select:focus-visible,html body #editor textarea:focus-visible{outline:2px solid var(--d-accent);outline-offset:1px;border-color:var(--d-accent)}
html body main input[type=checkbox],html body #editor input[type=checkbox]{accent-color:var(--d-ink)}
:where(main) :where(label:has(>input[type=search]),label:has(>input[type=text]),label:has(>select)){display:flex;flex-direction:column;align-items:stretch;gap:6px;font-size:13px;font-weight:600;color:var(--d-muted);max-width:420px}
html body main label>input[type=search]{width:100%}
html body main details>summary,html body #editor details>summary{cursor:pointer;font-weight:600;color:var(--d-ink);min-height:40px;display:flex;align-items:center;gap:8px;list-style:none}
html body main details>summary::-webkit-details-marker{display:none}
html body main details>summary:before,html body #editor details>summary:before{content:'';width:7px;height:7px;border-right:1.5px solid var(--d-muted);border-bottom:1.5px solid var(--d-muted);transform:rotate(-45deg);transition:transform .15s}
html body main details[open]>summary:before,html body #editor details[open]>summary:before{transform:rotate(45deg)}
html body main p.muted,html body main .muted{color:var(--d-muted)}
html body main h1+p{color:var(--d-muted);margin-top:-6px}
html body main h2{font-size:17px;font-weight:650}
html body .notice,html body main .notice{background:var(--d-soft);border:1px solid var(--d-line);border-left:3px solid var(--d-amber);border-radius:8px;color:var(--d-ink)}
/* Button groups → D segmented filters */
html body #staff-summaries,html body #task-counts,html body #policy-tabs,html body .toolbar:has(>button[aria-pressed]){display:flex;flex-wrap:wrap;gap:4px;background:none!important;border-bottom:1px solid var(--d-line);padding:0;margin:4px 0 14px}
html body #staff-summaries>button,html body #task-counts>button,html body #policy-tabs>button,html body .toolbar:has(>button[aria-pressed])>button{border:0!important;border-radius:0!important;background:transparent!important;border-bottom:2px solid transparent!important;color:var(--d-muted)!important;min-height:44px;padding:0 10px;box-shadow:none!important}
html body #staff-summaries>button[aria-pressed=true],html body #task-counts>button[aria-pressed=true],html body #policy-tabs>button[aria-pressed=true],html body .toolbar:has(>button[aria-pressed])>button[aria-pressed=true]{color:var(--d-ink)!important;border-bottom-color:var(--d-ink)!important}
html body #policy-tabs>button:before,html body #policy-tabs>*:before{display:none!important}
/* List rows (reviews, meetings, tasks, history) */
html body .wq-listrow{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(108px,auto);align-items:center;gap:16px;width:100%;min-height:48px;padding:6px 8px!important;text-align:left;font-weight:500;color:var(--d-ink);border-radius:0!important}
html body .wq-listrow>span:first-child{font-weight:600}
html body .wq-listrow>span:first-child .wq-dot{display:none}
html body .wq-listrow small{color:var(--d-muted);font-size:13px;white-space:nowrap}
.d-rowword{font-size:13px;font-weight:600;white-space:nowrap;text-align:left}
.d-rowword i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#b8bfcc;vertical-align:0}
.d-rowword.red{color:var(--d-red)}.d-rowword.red i{background:var(--d-red)}
.d-rowword.amber{color:var(--d-amber)}.d-rowword.amber i{background:var(--d-amber)}
.d-rowword.green{color:var(--d-green)}.d-rowword.green i{background:var(--d-green)}
.d-rowword.neutral{color:var(--d-muted)}
html body .hubrow{min-height:48px;padding:6px 8px;text-align:left;font-weight:600;width:100%}
html body .hubrow small{font-weight:500;color:var(--d-muted)}
/* Services */
html body .svc-row{border-bottom:1px solid var(--d-line);padding:4px 0}
html body .svc-row>button:first-child{border:0;background:transparent;text-align:left;font-weight:600;padding:0 8px}
html body .svc-row>button:not(:first-child){border:0;background:transparent;color:var(--d-muted);font-weight:500}
html body .svc-row>button:not(:first-child):hover{color:var(--d-red);background:transparent}
/* Cards → hairline sections */
html body main .card{padding:16px 18px}
html body main article.card{border-radius:8px}
/* Today */
.d-today-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;margin:0 0 6px}
.d-today-head h1{margin:0}
.d-today-head .d-date{color:var(--d-muted);font-size:14px}
html body main section.card.d-setup{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:10px 14px;border-radius:8px;background:var(--d-soft);margin:0 0 14px}
html body main section.card.d-setup p{margin:0;font-weight:600;font-size:14px}
html body main section.card.d-setup progress{width:140px;height:6px;appearance:none;border:0;border-radius:3px;background:#e3e6ec;overflow:hidden}
html body main section.card.d-setup progress::-webkit-progress-bar{background:#e3e6ec}
html body main section.card.d-setup progress::-webkit-progress-value{background:var(--d-ink)}
html body main section.card.d-setup progress::-moz-progress-bar{background:var(--d-ink)}
html body main section.card.d-setup button{margin-left:auto;background:var(--d-ink);border-color:var(--d-ink);color:#fff}
html body #summary-strip.d-statusline2{display:flex!important;flex-wrap:wrap;gap:2px 4px;border:0;background:none;padding:0;margin:0 0 18px;box-shadow:none;grid-template-columns:none}
html body #summary-strip.d-statusline2>button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:baseline;gap:5px;min-height:36px;padding:0 10px;border-radius:6px;font-size:14px;color:var(--d-muted);border:0;flex:none;width:auto}
html body #summary-strip.d-statusline2>button:hover{background:var(--d-soft)}
html body #summary-strip.d-statusline2>button:focus-visible{outline:2px solid var(--d-accent)}
html body #summary-strip.d-statusline2>button:before{display:none!important}
html body #summary-strip.d-statusline2>button strong{font-size:15px;font-weight:700;color:var(--d-ink)}
html body #summary-strip.d-statusline2>button.d-red,html body #summary-strip.d-statusline2>button.d-red strong{color:var(--d-red)}
html body #summary-strip.d-statusline2>button.d-amber,html body #summary-strip.d-statusline2>button.d-amber strong{color:var(--d-amber)}
html body #summary-strip.d-statusline2>button.d-zero strong{color:var(--d-muted)}
html body #overview-site{color:var(--d-faint)}
html body #priority-work{display:block}
@media(min-width:1100px){
 html body #priority-work{display:grid!important;grid-template-columns:minmax(0,1fr) 380px;gap:24px;align-items:start}
 html body #priority-work>#context-panel,html body #priority-work>.d-pane-empty{position:sticky!important;top:120px;inset:auto;width:auto;max-height:calc(100dvh - 140px);overflow:auto;box-shadow:none;border:1px solid var(--d-line);border-radius:10px;padding:18px;background:#fff;z-index:1}
}
.d-pane-empty{display:none;color:var(--d-muted);font-size:14px}
@media(min-width:1100px){.d-pane-empty{display:block}}
.d-qhead{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1.4fr) 104px 112px;gap:14px;padding:6px 8px;font-size:12px;font-weight:600;color:var(--d-faint);border-bottom:1px solid var(--d-line)}
html body #priority-work .work-row.d-q{display:grid!important;grid-template-columns:minmax(0,1.5fr) minmax(0,1.4fr) 104px 112px;gap:14px;align-items:center;width:100%;min-height:52px;padding:6px 8px;text-align:left;border-radius:0}
html body #priority-work .work-row.d-q .work-title{display:flex;flex-direction:column;gap:1px;font-weight:600;min-width:0}
html body #priority-work .work-row.d-q .work-title .wq-dot{display:none}
html body #priority-work .work-row.d-q .d-area{font-size:12px;font-weight:500;color:var(--d-faint)}
html body #priority-work .work-row.d-q .d-why{font-size:13px;color:var(--d-muted);font-weight:500}
html body #priority-work .work-row.d-q>small{display:none}
html body #priority-work .work-row.d-q .d-due{font-size:13px;color:var(--d-muted);font-weight:500;white-space:nowrap}
#work-list>h2{font-size:15px;margin:6px 0 8px}
@media(max-width:700px){
 .d-qhead{display:none}
 html body #priority-work .work-row.d-q{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"t s" "w w";gap:2px 10px;padding:10px 4px}
 html body #priority-work .work-row.d-q .work-title{grid-area:t}
 html body #priority-work .work-row.d-q .d-word2{grid-area:s}
 html body #priority-work .work-row.d-q .d-why{grid-area:w}
 html body #priority-work .work-row.d-q .d-due{display:none}
 html body main section.card.d-setup button{margin-left:0}
}
/* Landing and setup */
html body.first-use>main{max-width:520px;margin:0 auto;padding-top:18vh;text-align:left}
html body.first-use>main h1{font-size:34px;letter-spacing:-.02em;margin-bottom:8px}
html body.first-use>main button{background:var(--d-ink);border-color:var(--d-ink);color:#fff;min-height:48px;padding:0 20px;font-size:15px;margin:10px 0}
html body.first-use>main p{color:var(--d-muted)}
html body.first-use>nav{display:none}
html body #editor .fresh-form{gap:12px}
html body #editor .fresh-form>p:first-of-type{color:var(--d-muted)}
html body #editor .fresh-form>button:not(.fresh-option):not(.d-primary){background:var(--d-soft);border-color:#d5d9e2}
html body #editor .fresh-form>button:not(.fresh-option){text-align:center;justify-self:start;min-width:160px;min-height:44px}
html body #editor .fresh-form .fresh-option{min-height:48px;padding:10px 14px;border-color:var(--d-line)}
html body #editor .fresh-form .fresh-option[aria-pressed="true"]{background:var(--d-sel);color:var(--d-ink);border-color:var(--d-ink);box-shadow:inset 0 0 0 1px var(--d-ink);outline:0}
html body #editor .fresh-form label{font-size:14px;font-weight:600;color:var(--d-ink)}
html body #editor .fresh-form label>input,html body #editor .fresh-form label>select,html body #editor .fresh-form label>textarea{margin-top:6px;font-weight:400}
html body #editor h2,html body #editor #dialog-title{font-size:20px;font-weight:650;letter-spacing:-.01em}
html body #editor .close,html body #editor #close{border:0;background:transparent;color:var(--d-muted)}
html body #editor .eyebrow{color:var(--d-faint)}
/* Setup page */
html body main .site-card{border:0;border-bottom:1px solid var(--d-line);border-radius:0;padding:0}
html body main .site-card>summary{min-height:56px;padding:0 4px}
/* Tabs: underline style for every tab strip */
html body main .wq-tabs>button,html body main [role=tablist]>button,html body main [role=tablist]>[role=tab]{border:0!important;border-radius:0!important;background:transparent!important;border-bottom:2px solid transparent!important;color:var(--d-muted)!important;min-height:44px;padding:0 10px;box-shadow:none!important}
html body main .wq-tabs>button[aria-pressed=true],html body main [role=tablist]>[aria-selected=true],html body main [role=tablist]>button[aria-pressed=true]{color:var(--d-ink)!important;border-bottom-color:var(--d-ink)!important}
html body main [role=tablist]{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--d-line);margin:4px 0 14px;background:none!important}
/* Services rows */
html body main .fresh-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;border-bottom:1px solid var(--d-line);margin:0;padding:2px 0}
html body main .fresh-row>button:first-child{border:0;background:transparent;text-align:left;font-weight:600;min-height:48px;padding:0 8px;width:100%}
html body main .fresh-row>button:first-child:hover{background:var(--d-soft)}
html body main .fresh-row>button:not(:first-child){border:0;background:transparent;color:var(--d-muted);font-weight:500;font-size:13px}
html body main .fresh-row>button:not(:first-child):hover{color:var(--d-red);background:transparent}
html body main .hubrow .pill{background:transparent!important}
html body [hidden]{display:none!important}
html body #status{background:var(--d-ink)!important;color:#fff;border-radius:8px}
:where(#editor) :where(label:has(>input:not([type=checkbox]):not([type=radio])),label:has(>select),label:has(>textarea)){display:flex;flex-direction:column;align-items:stretch;gap:6px;font-size:14px;font-weight:600}
html body #editor label>input:not([type=checkbox]):not([type=radio]),html body #editor label>select,html body #editor label>textarea{width:100%;max-width:none}
@media(max-width:700px){html body dialog#editor[open]{height:100dvh!important;max-height:none!important;top:0!important;bottom:0!important}}
`;
const s=document.createElement('style');s.id='concept-d-style-2';s.textContent=css;document.head.append(s);
})();

/* Status words on list rows: read the existing dot label, add the word. */
D.decorateRows=function(root){
 for(const row of root.querySelectorAll('.wq-listrow:not(.d-x)')){row.classList.add('d-x');const dot=row.querySelector('.wq-dot');if(!dot)continue;const tone=['red','amber','green'].find(t=>dot.classList.contains(t))||'neutral';const w=D.el('span',{class:'d-rowword '+tone,'aria-hidden':'true'});w.append(D.el('i'),dot.getAttribute('aria-label')||'');row.append(w);}
};
/* Primary action in setup and editor forms: the first save/continue button. */
D.decorateEditor=function(){
 const ed=$('editor');if(!ed||!ed.open)return;
 for(const form of ed.querySelectorAll('.fresh-form,form')){if(form.querySelector('.d-primary'))continue;const b=[...form.querySelectorAll('button')].find(x=>!x.classList.contains('fresh-option')&&!x.classList.contains('close')&&x.id!=='close'&&/^(Continue|Save|Next|Finish|Done|Create|Add staff|Record|Confirm|Start)/.test(x.textContent.trim())&&!/Finish Later|needs verification/i.test(x.textContent));if(b)b.classList.add('d-primary');}
 D.decorateRows(ed);
};
new MutationObserver(()=>D.decorateEditor()).observe($('editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});

/* Today (Overview) in Concept D layout */
D.why=function(r,now){
 const parts=[];
 if(r.date){const days=Math.round((D.date(r.date)-D.date(now))/864e5);parts.push(days<0?'Overdue by '+(-days)+(days===-1?' day':' days'):days===0?'Due today':'Due in '+days+(days===1?' day':' days'));}
 else parts.push(r.dateLabel||r.note||r.status||'No due date yet');
 if(r.key.startsWith('review/')){const id=r.key.slice(7);let k='';try{k=RPH.schedule.basis(id).kind;}catch{}
  if(r.date)parts.push(k==='regulation'?'Legal requirement':k==='external'?'External deadline':k==='guidance'?'Guidance-based':r.detail||'Your review schedule');else if(k==='regulation')parts.push('Legal requirement');}
 else if(r.area==='Tasks')parts.push('Task'+(r.detail?' · owner: '+r.detail:''));
 else if(r.area==='Staff')parts.push(r.status==='Expired'?'Credential expired':r.status==='Expiring soon'?'Credential expiring':'Not yet verified');
 else if(r.detail)parts.push(r.detail);
 return [...new Set(parts.flatMap(x=>String(x).split(' · ')))].join(' · ');
};
D.today=function(){
 const main=$('main'),wrap=$('priority-work');if(!wrap||!state.freshSite)return;
 const h1=main.querySelector('h1'),date=main.querySelector('.overview-date');
 if(h1&&!h1.closest('.d-today-head')){h1.textContent='Today';const head=D.el('div',{class:'d-today-head'});h1.before(head);head.append(h1);if(date){date.classList.add('d-date');head.append(date);}}
 const setup=[...main.querySelectorAll(':scope>section.card')].find(c=>c.querySelector('progress'));if(setup)setup.classList.add('d-setup');
 const strip=$('summary-strip');
 if(strip){strip.classList.add('d-statusline2');for(const b of strip.querySelectorAll(':scope>button')){const n=Number(b.querySelector('strong')?.textContent||0),name=b.textContent.replace(/^\d+/,'').trim();b.classList.toggle('d-zero',!n);if(n&&/Overdue/.test(name))b.classList.add('d-red');else if(n&&/To verify|Need a date/.test(name))b.classList.add('d-amber');const strong=b.querySelector('strong');if(strong&&strong.nextSibling)strong.nextSibling.textContent=' '+name.toLowerCase();}}
 const list=$('work-list');
 if(list&&!list.querySelector('.d-qhead')){const head=D.el('div',{class:'d-qhead','aria-hidden':'true'});for(const t of ['Check','Why it’s here','Due','Status'])head.append(D.el('span',{text:t}));$('dash-attention').before(head);}
 const data=oversightData(),byKey=new Map(data.rows.map(r=>[r.key,r]));
 const decorate=()=>{
  for(const row of wrap.querySelectorAll('.work-row:not(.d-q)')){const r=byKey.get(row.dataset.key);if(!r)continue;row.classList.add('d-q');const title=row.querySelector('.work-title');
   if(title&&!title.querySelector('.d-area'))title.append(D.el('span',{class:'d-area',text:r.area}));
   const late=r.date&&r.date<data.now,week=r.date&&r.date<=addInterval(data.now,7,'days');
   const tone=late||r.status==='Expired'?'red':week||r.status==='Expiring soon'?'amber':'neutral';
   const word=late?'Overdue':r.status==='Expired'?'Expired':r.status==='Expiring soon'?'Expiring':r.status==='Outstanding'?(r.date===data.now?'Due today':'Open'):r.status==='Needs Review'?'To verify':!r.date?(/verif/i.test(r.status)?'To verify':'No date'):r.date===data.now?'Due today':week?'Due soon':'Upcoming';
   row.append(D.el('span',{class:'d-why',text:D.why(r,data.now)}),D.el('span',{class:'d-due',text:r.date?pretty(r.date):'—'}));const w=D.el('span',{class:'d-rowword d-word2 '+tone});w.append(D.el('i'),word);row.append(w);}
  const pane=$('context-panel'),empty=wrap.querySelector('.d-pane-empty');
  if(pane&&empty)empty.remove();
  if(!pane&&!empty)wrap.append(D.el('aside',{class:'d-pane-empty','aria-hidden':'true'},D.el('p',{text:'Select a check to see why it’s here, its last review and what to do next.'})));
 };
 decorate();
 if(!wrap.dataset.dObs){wrap.dataset.dObs='1';new MutationObserver(()=>{decorate();}).observe(wrap,{childList:true,subtree:true});}
};

/* Run after every render */
const dRender2=render;
render=function(){dRender2();try{if(page==='overview')D.today();D.decorateRows($('main'));}catch(e){console.warn('Concept D layout',e);}};
new MutationObserver(()=>D.decorateRows($('main'))).observe($('main'),{childList:true,subtree:true});

/* ===== Phone view (UAT): show the phone layout on a laptop screen =====
 * Re-evaluates every width media query as if the screen were 390px wide.
 * Display only; switch back with "Laptop view". The choice is remembered on this browser. */
D.phoneW=390;
D.phoneRules=[];D.mediaOrig=new WeakMap();
D.collectMedia=function(){
 D.phoneRules=[];
 for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules;}catch{continue;}
  const walk=list=>{for(const r of list){if(r instanceof CSSMediaRule){if(!D.mediaOrig.has(r))D.mediaOrig.set(r,r.media.mediaText);if(/(min|max)-width/.test(D.mediaOrig.get(r)))D.phoneRules.push({r,orig:D.mediaOrig.get(r)});walk(r.cssRules);}}};
  walk(rules);}
};
D.asPhone=function(text){
 return text.replace(/\((min|max)-width\s*:\s*([\d.]+)(px|em|rem)\)/g,(m,kind,n,unit)=>{const px=Number(n)*(unit==='px'?1:16);const ok=kind==='max'?D.phoneW<=px:D.phoneW>=px;return ok?'(min-width:0px)':'(max-width:0px)';});
};
D.applyView=function(phone){
 D.phone=!!phone;
 if(!D.phoneRules.length||phone)D.collectMedia();
 for(const x of D.phoneRules){try{x.r.media.mediaText=phone?D.asPhone(x.orig):x.orig;}catch{}}
 document.documentElement.classList.toggle('d-phone-view',D.phone);
 try{localStorage.setItem('rph-uat-view',D.phone?'phone':'laptop');}catch{}
 const t=$('d-viewtoggle');if(t){t.textContent=D.phone?'Laptop view':'Phone view';t.setAttribute('aria-pressed',String(D.phone));}
};
(function(){
 const st=document.createElement('style');st.id='concept-d-phone';st.textContent=`
html.d-phone-view{background:#e9ebf0}
html.d-phone-view body{max-width:390px;margin:0 auto;min-height:100dvh;background:#fff;box-shadow:0 0 0 1px #d5d9e2,0 20px 60px #0c111c22;position:relative}
html.d-phone-view body>header{position:sticky!important;left:auto;right:auto}
html.d-phone-view .mobilebar{left:50%!important;right:auto!important;width:390px;transform:translateX(-50%)}
html.d-phone-view body dialog#editor[open]{width:390px!important;max-width:390px!important;left:50%!important;right:auto!important;inset:0 auto 0 50%!important;transform:translateX(-50%);margin:0!important}
html.d-phone-view body>#status{left:calc(50% - 179px)!important;right:auto!important;width:358px!important}
html.d-phone-view #d-jump>div{width:370px}
#d-viewtoggle{position:fixed;right:12px;bottom:12px;z-index:30;min-height:40px;border:1px solid #d5d9e2;border-radius:20px;background:#fff;padding:0 14px;font:600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0c111c;box-shadow:0 4px 16px #0c111c1f;cursor:pointer}
html.d-phone-view #d-viewtoggle{right:calc(50% - 195px - 140px)}
@media (max-width:1000px){html.d-phone-view #d-viewtoggle{right:12px;bottom:76px}}
`;document.head.append(st);
 const realWide=window.innerWidth>700;
 if(!realWide)return; // A real phone already uses the phone layout.
 const t=document.createElement('button');t.id='d-viewtoggle';t.type='button';t.title='UAT: switch between phone and laptop layouts';t.onclick=()=>{D.applyView(!D.phone);render();};document.body.append(t);
 let pref='phone';try{pref=localStorage.getItem('rph-uat-view')||'phone';}catch{}
 D.applyView(pref==='phone');render();
})();
