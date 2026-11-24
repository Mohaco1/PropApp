/* ===== Concept D frontend (UAT v30) =====
 * The approved Round 3 Concept D prototype (design-studio/round3/concept-d.html) as the app's frontend.
 * Page structures, header, tabs, tables, detail pane, inline phone details, calendar and the audit screen
 * follow the prototype. All data comes from the app's own functions; every save goes through the app's
 * existing editors and rules. Nothing here writes to storage directly.
 */
(function(){const s=document.createElement('style');s.id='cd-frontend-css';s.textContent=CD_CSS;document.head.append(s);})();
const CD={st:{sel:{},f:{today:'all',reviews:'all',actions:'open',staff:'Active',policies:'all'},q:{},expanded:true,cal:'Weekly',day:today(),month:today().slice(0,7),year:Number(today().slice(0,4)),lib:false},act:{}};
const cdE=s=>esc(String(s??''));
CD.isM=()=>D.phone||window.matchMedia('(max-width:899px)').matches;
CD.short=d=>D.date(d).toLocaleDateString('en-AU',{day:'numeric',month:'short'});
CD.dow=d=>D.date(d).toLocaleDateString('en-AU',{weekday:'short'});
CD.native={overview:'today',audits:'reviews',actions:'actions',planner:'calendar',staff:'staff',documents:'policies',more:'more'};
CD.NAV=[['overview','Today'],['audits','Reviews'],['actions','Actions'],['planner','Calendar'],['staff','Staff'],['documents','Policies'],null,['meetings','Meetings'],['services','Services'],['history','History'],['setup','Setup']];
CD.MOB=[['overview','Today'],['audits','Reviews'],['actions','Actions'],['planner','Calendar'],['more','More']];
CD.go=function(p){CD.st.tapped={};CD.st.allToday=false;if(p==='setup')return beginSetup();if(p==='documents')CD.st.lib=false;page=p;render();window.scrollTo(0,0);};
/* register a click action; returns the attribute string */
CD.a=function(fn){const id='a'+(CD.n=(CD.n||0)+1);CD.act[id]=fn;return 'data-act="'+id+'"';};
CD.btn=(label,fn,primary)=>`<button class="btn${primary?' primary':''}" ${CD.a(fn)}>${cdE(label)}</button>`;
CD.legacy=function(text){const b=[...$('main').querySelectorAll('button')].find(x=>x.textContent.trim().startsWith(text));if(b){b.click();return true;}notify('That option is not available here.');return false;};
CD.word=(cls,text)=>`<span class="w w-${cls}">${cdE(text)}</span>`;
CD.dot=cls=>`<span class="dot d-${cls}"></span>`;
CD.filt=function(key,opts){return `<div class="filters" role="group">${opts.map(([k,l,n])=>`<button type="button" data-f="${key}:${cdE(k)}" aria-pressed="${CD.st.f[key]===k}">${cdE(l)}${n!=null?`<span class="n">${n}</span>`:''}</button>`).join('')}</div>`;};
/* table with selectable rows; on a phone the selected row's details open in place (prototype behaviour) */
CD.table=function(key,cols,rows,selId,detail,cls){
 const fx=cols.some(c=>c[2]);
 return `<table class="${cls||''}${fx?' fx':''}"><thead><tr>${cols.map(c=>`<th class="${c[1]||''}"${c[2]?` style="width:${c[2]}px"`:''}>${cdE(c[0])}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr data-row="${key}:${cdE(r.id)}" class="${r.id===selId&&(!CD.isM()||CD.st.tapped?.[key]===r.id)?'sel':''}" aria-selected="${r.id===selId}">${r.cells.map((c,i)=>`<td class="${cols[i][1]||''}">${c}</td>`).join('')}</tr>${r.id===selId&&CD.st.expanded&&detail&&(!CD.isM()||CD.st.tapped?.[key]===r.id)?`<tr class="inline"><td colspan="${cols.length}">${detail}</td></tr>`:''}`).join('')}</tbody></table>`;
};
CD.layout=(main,pane)=>`<div class="work"><div class="main">${main}</div><aside class="pane" aria-label="Details">${pane}</aside></div>`;
CD.pick=function(key,list){const sel=list.find(x=>x.id===CD.st.sel[key])||list[0];if(sel)CD.st.sel[key]=sel.id;return sel;};
CD.basisLabel=id=>{let k='';try{k=RPH.schedule.basis(id).kind;}catch{}return k==='regulation'?'§ Legal':k==='external'?'External date':k==='guidance'?'Guidance':'Your plan';};
CD.by=r=>r&&r.by&&!/unselected/i.test(r.by)?r.by:'';
CD.lastReview=id=>state.reviews.filter(r=>!r.meeting&&r.audit===id).sort(compareAssurance).reverse();
CD.cls=date=>!date?'staff':date<today()?'overdue':date<=addInterval(today(),14,'days')?'soon':'ok';
CD.when=date=>{const t=CD.dueText(date);return /^(Overdue|Today|Tomorrow)/.test(t)?t+' · '+pretty(date):pretty(date);};
CD.dueText=date=>{if(!date)return 'No date';const n=Math.round((D.date(date)-D.date(today()))/864e5);return n<0?'Overdue '+(-n)+(n===-1?' day':' days'):n===0?'Today':n===1?'Tomorrow':n<7?CD.dow(date)+' '+CD.short(date):CD.short(date);};

/* ---------- shell: header, tabs, phone bar ---------- */
CD.shell=function(){
 document.body.classList.add('cdx');
 let bar=$('cd-bar');
 if(!bar){bar=D.el('header',{id:'cd-bar',class:'bar'});document.body.prepend(bar);
  const view=D.el('div',{id:'cd-view',class:'cdv'});$('main').before(view);
  const mob=D.el('nav',{id:'cd-mob',class:'mob','aria-label':'Sections'});document.body.append(mob);}
 const setup=!state.freshSite;
 let sites=[];try{const dir=siteDirectory();sites=(dir.sites||[]).map(e=>{let name=state.pharmacyName;if(e.id!==dir.active){try{name=JSON.parse(localStorage.getItem(e.slot)).pharmacyName;}catch{name='Unavailable location';}}return {id:e.id,name:name||'New pharmacy',active:e.id===dir.active};});}catch{}
 if(!sites.length&&state.pharmacyName)sites=[{id:'here',name:state.pharmacyName,active:true}];
 const late=setup?0:oversightData().late;
 const actor=RPH.actor(),ini=(actor.name||'?').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
 const cur=CD.cur();
 bar.innerHTML=`<div class="row1"><span class="brand">R.</span>${sites.length?`<div class="scope${sites.length===1?' one':''}" role="group" aria-label="Pharmacies" style="--n:${Math.min(sites.length,3)}">${sites.map(s=>`<button data-site="${cdE(s.id)}" aria-pressed="${s.active}"><span class="nmx">${cdE(s.name)}</span>${s.active&&late?`<span class="c" aria-label="${late} overdue">${late} overdue</span>`:''}</button>`).join('')}</div>`:''}${setup?'':`<button class="search" data-cmd aria-label="Search or jump to"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span>Search or jump to…</span><kbd>${navigator.platform?.includes('Mac')?'⌘K':'Ctrl K'}</kbd></button>`}${setup||!RPH.proprietors().length?'':`<button class="me" data-me title="Recording as ${cdE(actor.name)} · tap to change" aria-label="Recording as ${cdE(actor.name)}. Change">${cdE(ini)}</button>`}</div>${setup?'':`<nav class="tabs" aria-label="Sections">${CD.NAV.map(x=>x?`<button data-go="${x[0]}" ${x[0]===cur?'aria-current="page"':''}>${x[1]}</button>`:'<span class="gap" aria-hidden="true"></span>').join('')}</nav>`}`;
 $('cd-mob').innerHTML=setup?'':CD.MOB.map(([k,l])=>`<button data-go="${k}" ${k===cur||(k==='more'&&!CD.MOB.some(m=>m[0]===cur&&m[0]!=='more'))?'aria-current="page"':''}>${l}</button>`).join('');
};
CD.cur=()=>page==='staff-profile'?'staff':page;
/* ---------- paint after every app render ---------- */
CD.paint=function(){
 CD.act={};CD.n=0;CD.shell();
 const view=$('cd-view'),main=$('main');
 const key=CD.key();
 const native=CD.isNative();
 if(!state.freshSite){view.innerHTML='';main.classList.remove('cd-hidden');return;}
 main.classList.toggle('cd-hidden',!!native);document.body.classList.toggle('cd-lib',(key==='policies'||key==='history'||key==='setup')&&!native&&state.freshSite);
 if(!native&&key==='setup'&&state.freshSite){if(CD.st.setupHost&&$('main').querySelector('.rph-menu')){CD.st.setupHost=false;return render();}view.innerHTML=`<div class="main" style="padding-bottom:0"><div class="hd"><h1>${editingIntervals?'Review intervals and starting dates':'Locations, backup & restore'}</h1>${CD.btn('← Pharmacy setup',()=>{CD.st.setupHost=false;if(editingIntervals){editingIntervals=false;}render();})}</div></div>`;document.body.classList.add('cd-lib');return;}
 if(!native&&key==='history'){view.innerHTML=`<div class="main" style="padding-bottom:0"><div class="hd"><h1>History</h1>${CD.btn('← History list',()=>{CD.st.histFull=false;render();})}</div><p class="status">Filters, exports, other pharmacies and backup.</p></div>`;document.body.classList.add('cd-lib');return;}
 if(!native){view.innerHTML=key==='policies'?`<div class="main" style="padding-bottom:0"><div class="hd"><h1>Policies</h1>${CD.btn('← Procedures',()=>{CD.st.lib=false;render();})}</div><p class="status">Library, templates, guidance and evidence.</p></div>`:'';return;}
 CD.after=[];view.replaceChildren();view.innerHTML=(key==='policies'&&CD.st.lib?CD.V.library:key==='setup'&&CD.st.setupHost?CD.V.locations:CD.V[key])();for(const fn of CD.after)try{fn();}catch(e){console.error(e);}
 if(key==='services'){const sw=view.querySelector('.cd-sw');if(sw)try{sw.append(softwareRegister(CD.st.sel.services));}catch{}}
};
document.addEventListener('click',e=>{
 const t=e.target.closest('#cd-bar button,#cd-view button,#cd-view tr,#cd-mob button');if(!t)return;
 if(t.dataset.act){const fn=CD.act[t.dataset.act];if(fn)fn(e);return;}
 if(t.hasAttribute('data-cmd'))return D.jump();
 if(t.hasAttribute('data-me'))return RPH.switchReviewer(()=>render());
 if(t.dataset.site){if(t.getAttribute('aria-pressed')!=='true'&&t.dataset.site!=='here')chooseSite(t.dataset.site);return;}
 if(t.dataset.go){if(t.dataset.go==='more'){page='more';render();return;}return CD.go(t.dataset.go);}
 if(t.dataset.f){const [k,v]=t.dataset.f.split(':');CD.st.f[k]=v;CD.st.moreF=false;render();return;}
 if(t.matches?.('[data-more-today]')){CD.st.allToday=true;render();return;}if(t.dataset.row){const [k,id]=t.dataset.row.split(/:(.*)/s);if(k==='setup'&&CD.isM()&&CD.st.setupOpen&&CD.st.setupOpen[id]){CD.st.setupOpen[id]();return;}const was=(CD.st.tapped??={})[k]===id;CD.st.expanded=was?!CD.st.expanded:true;CD.st.sel[k]=id;CD.st.tapped[k]=CD.st.expanded?id:null;render();return;}
});
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('cdx')||$('editor').open||$('d-jump'))return;
 if(e.target.matches('input,textarea,select'))return;
 const rows=[...document.querySelectorAll('#cd-view .main tr[data-row]')];if(!rows.length)return;
 const ids=rows.map(r=>r.dataset.row),cur=rows.findIndex(r=>r.classList.contains('sel'));
 const sel=i=>{const [k,id]=ids[i].split(/:(.*)/s);CD.st.sel[k]=id;CD.st.expanded=true;(CD.st.tapped??={})[k]=id;render();document.querySelector('#cd-view tr.sel')?.scrollIntoView({block:'nearest'});};
 if(e.key==='j'){sel(Math.min(ids.length-1,cur+1));}
 else if(e.key==='k'){sel(Math.max(0,cur-1));}
 else if(e.key==='Enter'){const b=document.querySelector('#cd-view .pane .btn.primary');if(b){e.preventDefault();b.click();}}
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.q!==undefined&&t.closest('#cd-view')){CD.st.q[t.dataset.q]=t.value;const pos=t.selectionStart;render();const n=document.querySelector('#cd-view [data-q="'+t.dataset.q+'"]');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch{}}}});

/* ---------- pages ---------- */
CD.V={};
/* Today */
CD.todayRows=function(){
 const d=oversightData(),now=d.now,rows=[];
 for(const r of d.rows){
  const late=(r.date&&r.date<now)||r.status==='Expired',task=r.area==='Tasks',legal=r.key.startsWith('review/')&&CD.basisLabel(r.key.slice(7))==='§ Legal';
  const k=late?'overdue':task?'task':r.date&&r.date<=d.end?(legal?'legal':'soon'):r.area==='Staff'?'verify':'later';
  if(k==='later')continue;
  rows.push({id:r.key,k,item:r.label,type:task?'Action':r.area==='Staff'?'Staff':legal?'Legal':r.area==='Policies'?'Policy':r.area==='Meetings'?'Meeting':'Review',due:r.date?CD.dueText(r.date):(r.status==='Expired'?'Expired':'To verify'),date:r.date,owner:task?((r.detail&&[(()=>{try{return siteProfile(state).proprietor}catch{return ''}})(),(()=>{try{return RPH.actor().name}catch{return ''}})()].filter(Boolean).includes(r.detail))?'You':(r.detail||'—')):'You',act:task?'Open':r.area==='Staff'?'Verify':'Start',open:r.open,related:r.related,relatedLabel:r.relatedLabel,src:r});
 }
 for(const u of RPH.schedule.unscheduled())rows.push({id:'nodate/'+u.id,k:'nodate',item:u.label,type:'Review',due:'No date',owner:'You',act:u.external?'Enter date':'Set date',open:()=>RPH.schedule.firstDate(u),why:u.reason,src:u});
 for(const v of fsUnknowns())rows.push({id:'verify/'+v.id,k:'verify',item:v.label,type:'To verify',due:'When you can',owner:'You',act:'Verify',open:v.run,why:'Marked “Needs verification” during setup. Confirm it when you can.'});
 return rows;
};
CD.kinds=rows=>{if(!rows.length)return '';const m={};for(const r of rows){const t=r.type==='Action'?'action':r.type==='Staff'?'staff':r.type==='Policy'?'policy':r.type==='Meeting'?'meeting':'review';m[t]=(m[t]||0)+1;}
 return ' <span class="sub">('+Object.entries(m).map(([t,n])=>n+' '+(n===1?t:t==='policy'?'policies':t==='staff'?'staff':t+'s')).join(', ')+')</span>';};
CD.KW={overdue:['overdue','overdue'],soon:['soon','soon'],legal:['legal','legal'],task:['check','check'],verify:['staff','staff'],nodate:['staff','staff']};
CD.V.today=function(){
 const items=CD.todayRows(),f=CD.st.f.today,c=k=>items.filter(x=>x.k===k).length;
 const prog=x=>/Resume/i.test(x.act||'');
 const list=items.filter(x=>f==='all'||(f==='today'?x.date===today():f==='prog'?prog(x):f==='waiting'?!!x.waiting:x.k===f||(f==='soon'&&x.k==='legal')));
 const shown=RPH.guide?(()=>{const g=RPH.guide.group(list);const jobs=RPH.guide.rank(g.filter(x=>!x.inGroup));const out=[];for(const j of jobs){out.push(j);if(j.members&&CD.st.openGroup[j.subject])out.push(...g.filter(x=>x.inGroup&&j.members.some(m=>m.id===x.id)));}return out;})():list;
 const J=fn=>RPH.guide?RPH.guide.count(items.filter(fn)):items.filter(fn).length;
 const sel=CD.pick('today',shown);
 const detail=sel?CD.todayDetail(sel):'';
 const pending=fsPending(),doneSteps=state.freshSelection?1+state.active.length-pending.length+1:1,steps=2+state.active.length;
 const month=today().slice(0,7),doneM=state.reviews.filter(r=>r.date&&r.date.startsWith(month)).length,dueM=entries().filter(r=>r.active&&r.date&&r.date.startsWith(month)).length;
 const setupBlk=RPH.calm?'':RPH.ob?RPH.ob.card():(!state.freshSelection||pending.length)?`<div class="setupline"><span class="nm">Pharmacy setup</span><div class="meter" style="flex:1;max-width:220px"><i style="width:${Math.round(doneSteps/steps*100)}%"></i></div><span class="sub">${doneSteps} of ${steps} steps</span>${CD.btn('Continue setup',()=>fsNext())}</div>`:'';
 const mName=new Date().toLocaleDateString('en-AU',{month:'long'});
 let sites=[];try{const dir=siteDirectory();sites=(dir.sites||[]).map(e=>{let name=state.pharmacyName;if(e.id!==dir.active){try{name=JSON.parse(localStorage.getItem(e.slot)).pharmacyName;}catch{name='Unavailable location';}}return {id:e.id,name,active:e.id===dir.active};});}catch{}
 if(!sites.length)sites=[{id:'here',name:state.pharmacyName,active:true}];
 const pct=dueM+doneM?Math.round(doneM/(dueM+doneM)*100):0;
 const phs=`<div class="sec">${sites.length>1?'Pharmacies':'This pharmacy'}</div><table class="ph-table fx"><tbody>${sites.map(x=>x.active?`<tr><td class="nm">${cdE(x.name||'')}</td><td style="width:120px"><span class="w ${c('overdue')?'w-overdue':'w-staff'}">${c('overdue')?c('overdue')+' overdue':'Nothing overdue'}</span></td><td class="hide-m" style="width:120px"><span class="w w-soon">${c('soon')+c('legal')} due soon</span></td><td class="hide-m sub" style="width:100px">${c('verify')} to verify</td><td style="width:30%"><div style="display:flex;align-items:center;gap:8px"><div class="meter" style="flex:1"><i style="width:${pct}%"></i></div><span class="sub">${doneM}/${dueM+doneM}</span></div></td></tr>`:`<tr><td class="nm">${cdE(x.name||'')}</td><td colspan="4" class="sub"><button data-site="${cdE(x.id)}" class="verb">Switch to this pharmacy</button></td></tr>`).join('')}</tbody></table><p class="sub" style="margin:6px 0 0">${mName} reviews done${sites.length>1?' for the pharmacy you’re viewing':''}.</p>`;
 const main=`<h1>Today</h1><p class="status">${new Date().toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})} · <b>${J(()=>true)} open job${J(()=>true)===1?'':'s'}</b> · <b class="${c('overdue')?'w-overdue':'sub'}">${c('overdue')} overdue</b>${CD.kinds(items.filter(x=>x.k==='overdue'))} · <b class="${c('soon')+c('legal')?'w-soon':'sub'}">${c('soon')+c('legal')} due soon</b>${c('nodate')?` · <button class="verb cd-nodate" data-f="today:nodate">${J(x=>x.k==='nodate')} need${J(x=>x.k==='nodate')===1?'s':''} a date</button>`:''}</p>
 ${setupBlk}${sites.length>1||!CD.isM()?phs:''}
 ${f==='all'&&RPH.guide?(RPH.guide.howCard?RPH.guide.howCard():'')+RPH.guide.startCard(items):''}
 ${CD.todayFilt([['all','All open',J(()=>true)],['overdue','Overdue',J(x=>x.k==='overdue')],['today','Due today',J(x=>x.date===today())],['prog','In progress',J(prog)],['soon','Upcoming',J(x=>x.k==='soon'||x.k==='legal')],['task','Actions',J(x=>x.k==='task')],['nodate','No date',J(x=>x.k==='nodate')],['verify','To check',J(x=>x.k==='verify')]])}
 ${shown.length?(()=>{let top=[];try{if(!RPH.calm&&CD.isM()&&f==='all'&&RPH.guide&&RPH.guide.count(items)>8)top=RPH.guide.rank(RPH.guide.jobs(items)).slice(0,3).map(x=>x.id);}catch{}const rest=shown.filter(x=>!top.includes(x.id));const restJobs=rest.filter(x=>!x.inGroup).length;const cap=CD.isM()&&!CD.st.allToday&&restJobs>8;const vis=cap?(()=>{const keep=new Set(top);const out=[];let n=0;for(const x of rest){if(!x.inGroup){if(n<8){out.push(x);keep.add(x.id);n++;}}else{const g='group/'+(RPH.guide?RPH.guide.subject(x):'');if(keep.has(g))out.push(x);}}return out;})():rest;return CD.table('today',[['Item'],['Due','',150],['Owner','hide-m',120],['','hide-m',84]],vis.map(x=>({id:x.id,cells:[`${CD.dot(CD.KW[x.k][0])}<span class="nm">${cdE(x.item)}</span><div class="sub" style="margin-left:22px">${cdE(x.type)}</div>`,CD.word(CD.KW[x.k][1],x.due),`<span class="sub">${cdE(x.owner)}</span>`,`<span class="verb">${cdE(x.act)}</span>`]})),sel&&sel.id,detail)+(cap?`<button class="verb cd-more" data-more-today>Show ${restJobs-8} more</button>`:'');})():`<p class="empty">${({today:'Nothing due today.',prog:'Nothing in progress.',overdue:'Nothing overdue.',nodate:'Every review has a date.',soon:'Nothing coming up.',task:'No open actions.',verify:'Nothing to check.',waiting:'You’re not waiting on anyone.'})[f]||'Nothing here.'}</p>`}
 <p class="sub hide-m" style="margin-top:14px">Keyboard: <b>J</b>/<b>K</b> move · <b>Enter</b> open · <b>${navigator.platform?.includes('Mac')?'⌘K':'Ctrl K'}</b> jump anywhere</p>`;
 return CD.layout(main,detail||'<p class="sub">Nothing selected.</p>');
};
CD.todayDetail=function(s){
 const r=s.src||{},kv=[];let why=s.why||'';
 if(s.id.startsWith('review/')){const id=s.id.slice(7),a=catalog().find(x=>x.id===id),last=CD.lastReview(id)[0];kv.push(['Cadence',a?.frequency||'Annual assurance'],['Last done',last?pretty(last.date)+(CD.by(last)?' · '+CD.by(last):''):'Not recorded yet'],['Source',CD.basisLabel(id)]);try{why=RPH.schedule.basis(id).text;}catch{}why=D.why(r,today())+'. '+why;}
 else if(s.id.startsWith('task/')){const t=state.taskLedger?.[s.id.slice(5)];kv.push(['Owner',t?.owner||'—'],['Due',t?.due?pretty(t.due):'—'],['From',(t?.sources||[]).map(taskSourceLabel).join(', ')||'Manual']);why=t&&taskLate(t)?'Past its due date and still open.':'Open action. Only you close it, after you’ve seen the fix.';}
 else if(s.id.startsWith('staff/')){why=r.status==='Expired'?'A credential date in your record has passed.':r.status==='Expiring soon'?'A credential date in your record is coming up.':'Not yet verified in your staff record.';if(r.date)kv.push(['Date',pretty(r.date)]);}
 else if(s.id.startsWith('nodate/')){const id=s.id.slice(7),a=catalog().find(x=>x.id===id);kv.push(['Cadence',a?.frequency||'—'],['Source',CD.basisLabel(id)]);}
 const acts=[CD.btn(s.act==='Start'?'Start now':s.act==='Open'?'Open action':s.act,s.open,true)];
 if(s.related)acts.push(CD.btn(s.relatedLabel,s.related));
 if(s.id.startsWith('review/')){const row={id:s.id.slice(7)};if(D.canReschedule({...row,label:s.item}))acts.push(CD.btn('Plan a date',()=>D.changeDate({...row,label:s.item})));}
 return `<div class="lbl">${cdE(s.type)} · ${cdE(state.pharmacyName||'')}</div><h2>${cdE(s.item)}</h2>${CD.word(CD.KW[s.k][1],s.due)}${kv.length?`<div class="blk kv">${kv.map(([a,b])=>`<span>${cdE(a)}</span><span>${cdE(b)}</span>`).join('')}</div>`:''}${why?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Why it’s here</div><p style="margin:0">${cdE(why)}</p></div>`:''}<div class="blk acts">${acts.join('')}</div>`;
};
/* Reviews */
CD.reviewRows=function(){
 const inc=CD.st.f.reviews==='inactive';
 return entries().filter(r=>(r.active||inc)&&!r.id.startsWith('A1/')).map(r=>{const a=catalog().find(x=>x.id===r.id),last=CD.lastReview(r.id)[0],cls=D.inProgress(r)?'check':r.active?CD.cls(r.date):'staff';
  return {...r,cadence:a?.frequency||(r.id.startsWith('annual-policy/')?'Annual':'—'),last:last?CD.short(last.date):'—',lastRec:last,cls,legal:CD.basisLabel(r.id)==='§ Legal',source:CD.basisLabel(r.id),area:a?.service?serviceName(a.service):r.id.startsWith('annual-policy/')?'Policies':scheduledMeetings[r.id]?'Meetings':'Core oversight',dueLabel:D.inProgress(r)?'In progress':!r.active?'Inactive':CD.dueText(r.date)};});
};
CD.V.reviews=function(){
 const f=CD.st.f.reviews,q=(CD.st.q.reviews||'').toLowerCase();
 if(f==='done')return CD.V.reviewsDone();
 const all=CD.reviewRows(),act=all.filter(r=>r.active),c=k=>act.filter(r=>r.cls===k).length;
 const list=all.filter(r=>(f==='all'||f==='inactive'||r.cls===f||(f==='legal'&&r.legal)||(f==='staff'&&!r.date&&r.active))&&r.label.toLowerCase().includes(q));
 const sel=CD.pick('reviews',list);
 const detail=sel?CD.reviewDetail(sel):'';
 const main=`<div class="hd"><h1>Reviews</h1><div class="tools"><input class="find" type="search" data-q="reviews" aria-label="Search reviews" placeholder="Search reviews" value="${cdE(CD.st.q.reviews||'')}">${CD.btn('Adjust intervals',()=>openIntervals())}</div></div><p class="status">${act.length} in your plan for ${cdE(state.pharmacyName||'')}. · <b class="w-overdue">${c('overdue')} reviews overdue</b> · <b class="w-soon">${c('soon')} reviews due soon</b> <span class="sub">(reviews only; Today also counts staff, policies and actions)</span></p>
 ${CD.filt('reviews',[['all','All',act.length],['overdue','Overdue',c('overdue')],['soon','Due soon',c('soon')],['ok','On track',c('ok')],['staff','No date',act.filter(r=>!r.date).length],['legal','Legal',act.filter(r=>r.legal).length],['done','Completed',state.reviews.length],['inactive','Include inactive',null]])}
 ${list.length?CD.table('reviews',[['Review'],['Cadence','hide-m',130],['Last','hide-m',84],['Next due','',150],['Source','hide-m',120]],list.map(a=>({id:a.id,cells:[`${CD.dot(a.legal&&a.cls!=='overdue'?'legal':a.cls)}<span class="nm">${cdE(a.label)}</span>`,`<span class="sub">${cdE(a.cadence)}</span>`,cdE(a.last),CD.word(a.cls,a.dueLabel),`<span class="sub">${cdE(a.source)}</span>`]})),sel&&sel.id,detail):'<p class="empty">No matching reviews.</p>'}`;
 return CD.layout(main,detail||'<p class="sub">Nothing selected.</p>');
};
CD.reviewDetail=function(a){
 const res=CD.lastReview(a.id).slice(0,3);let basis='';try{basis=RPH.schedule.basis(a.id).text;}catch{}
 const acts=[CD.btn(a.cls==='check'?'Continue':'Start now',()=>D.open(a),true)];if(D.canReschedule(a))acts.push(CD.btn('Plan a date',()=>D.changeDate(a)));
 if(!a.date&&!D.canReschedule(a)&&RPH.schedule.unscheduled().some(u=>u.id===a.id))acts.push(CD.btn('Set a date',()=>RPH.schedule.firstDate(RPH.schedule.unscheduled().find(u=>u.id===a.id))));
 return `<div class="lbl">${cdE(a.area)} · ${cdE(state.pharmacyName||'')}</div><h2>${cdE(a.label)}</h2>${CD.word(a.cls,a.dueLabel+(a.date&&a.cls!=='check'?' · '+pretty(a.date):''))}
 <div class="blk kv"><span>Cadence</span><span>${cdE(a.cadence)}</span><span>Last done</span><span>${a.lastRec?cdE(pretty(a.lastRec.date)):'Not recorded yet'}</span><span>Source</span><span>${cdE(a.source)}</span></div>
 ${basis?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Basis</div><p style="margin:0;font-size:14px">${cdE(basis)}</p></div>`:''}
 <div class="blk"><div class="lbl" style="margin-bottom:4px">Last three results</div><ul class="trail">${res.map(r=>`<li><b>${cdE(CD.short(r.date))}</b>${cdE(CD.by(r)||'Recorded')}${r.at&&r.at.slice(0,10)!==r.date?' · recorded '+cdE(CD.short(r.at.slice(0,10))):''}${r.amends?' · amended':''}${CD.resultFollow?cdE(CD.resultFollow(r)):''}</li>`).join('')||'<li>No reviews recorded yet.</li>'}</ul></div>
 <div class="blk acts">${acts.join('')}</div>`;
};
CD.V.reviewsDone=function(){
 const q=(CD.st.q.reviews||'').toLowerCase();
 const list=[...state.reviews].sort((a,b)=>b.date.localeCompare(a.date)||(b.at||'').localeCompare(a.at||'')).map(r=>({id:r.id,r,name:r.templateName||catalog().find(a=>a.id===auditKey(r.audit))?.name||r.audit})).filter(x=>x.name.toLowerCase().includes(q));
 const sel=CD.pick('done',list);
 const open=x=>x.r.meeting?meetingEditor(x.r.meeting):historyEntries().find(h=>h.type==='Review'&&h.id===x.r.id)?.open();
 const detail=sel?`<div class="lbl">Completed review</div><h2>${cdE(sel.name)}</h2>${CD.word('ok','Recorded '+pretty(sel.r.date))}<div class="blk kv"><span>By</span><span>${cdE(sel.r.by||'—')}</span><span>Saved</span><span>${cdE(sel.r.at?new Date(sel.r.at).toLocaleString('en-AU'):'—')}</span></div><div class="blk acts">${CD.btn('Open record',()=>open(sel),true)}</div>`:'';
 const main=`<div class="hd"><h1>Reviews</h1><div class="tools"><input class="find" type="search" data-q="reviews" aria-label="Search reviews" placeholder="Search reviews" value="${cdE(CD.st.q.reviews||'')}"></div></div><p class="status">${state.reviews.length} completed reviews on record.</p>
 ${CD.filt('reviews',[['all','All',null],['done','Completed',state.reviews.length]])}
 ${list.length?CD.table('done',[['Review'],['Date','',120],['By','hide-m',160]],list.map(x=>({id:x.id,cells:[`${CD.dot('ok')}<span class="nm">${cdE(x.name)}</span>`,cdE(pretty(x.r.date)),`<span class="sub">${cdE(x.r.by||'')}</span>`]})),sel&&sel.id,detail):'<p class="empty">No completed reviews yet.</p>'}`;
 return CD.layout(main,detail||'<p class="sub">Nothing selected.</p>');
};
/* Actions */
CD.V.actions=function(){
 const f=CD.st.f.actions,q=(CD.st.q.actions||'').toLowerCase(),all=taskRows().filter(t=>(t.text+' '+(CD.actionTitle?CD.actionTitle(t):'')+' '+(t.owner||'')).toLowerCase().includes(q));
 const recent=addInterval(today(),-30,'days');
 const groups=[['overdue','Overdue',t=>taskLate(t)],['open','Open',t=>t.status==='Outstanding'&&!taskLate(t)],['closed','Completed'+(f==='all'?'':' recently'),t=>t.status==='Completed'&&(f==='all'||(t.completedAt||'').slice(0,10)>=recent)]];
 const shown=groups.filter(([k])=>f==='all'||f==='open'&&k!=='closed'||f==='closed'&&k==='closed'||f==='overdue'&&k==='overdue');
 const flat=shown.flatMap(([k,,fn])=>all.filter(fn).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(t=>({id:t.id,t,k})));
 const sel=CD.pick('actions',flat);
 const detail=sel?CD.actionDetail(sel):'';
 const cnt=fn=>taskRows().filter(fn).length;
 const main=`<div class="hd"><h1>Actions</h1><div class="tools"><input class="find" type="search" data-q="actions" aria-label="Search actions" placeholder="Search actions" value="${cdE(CD.st.q.actions||'')}">${CD.btn('Add action',()=>taskEditor(),true)}</div></div><p class="status">Only you close an action, after you’ve seen the fix. · <b class="w-overdue">${cnt(taskLate)} overdue</b> · ${cnt(t=>t.status==='Outstanding')} open</p>
 ${CD.filt('actions',[['open','Open',cnt(t=>t.status==='Outstanding')],['overdue','Overdue',cnt(taskLate)],['closed','Completed',cnt(t=>t.status==='Completed')],['all','All',taskRows().length]])}
 ${shown.map(([k,l,fn])=>{const rows=flat.filter(x=>x.k===k);if(!rows.length&&shown.length>1)return '';return `<div class="sec">${l} · ${rows.length}</div>${rows.length?CD.table('actions',[['Action'],['Owner','hide-m',130],['Due','',120],['From','hide-m',190]],rows.map(x=>({id:x.id,cells:[`${CD.dot(k==='overdue'?'overdue':k==='closed'?'ok':'check')}<span class="nm">${cdE(CD.actionTitle?CD.actionTitle(x.t):x.t.text)}</span>`,`<span class="sub">${cdE(x.t.owner||'—')}</span>`,CD.word(k==='overdue'?'overdue':k==='closed'?'ok':'check',k==='closed'?'Closed '+(x.t.completedAt?CD.short(x.t.completedAt.slice(0,10)):''):x.t.due?CD.dueText(x.t.due):'No date'),`<span class="sub">${cdE((x.t.sources||[]).map(taskSourceLabel).join(', ')||'Manual')}</span>`]})),sel&&sel.id,detail):'<p class="empty">None.</p>'}`;}).join('')}`;
 return CD.layout(main,detail||'<p class="sub">No actions yet.</p>');
};
CD.actionDetail=function(x){
 const t=x.t,cls=x.k==='overdue'?'overdue':x.k==='closed'?'ok':'check';
 return `<div class="lbl">${cdE((t.sources||[]).map(taskSourceLabel).join(', ')||'Manual')}</div><h2>${cdE(CD.actionTitle?CD.actionTitle(t):t.text)}</h2>${CD.actionTitle&&CD.actionTitle(t)!==t.text?`<p class="sub" style="margin:4px 0 0">From: ${cdE(t.text)}</p>`:''}${CD.word(cls,x.k==='closed'?'Closed '+(t.completedAt?pretty(t.completedAt.slice(0,10)):''):x.k==='overdue'?'Overdue · due '+pretty(t.due):t.due?'Due '+pretty(t.due):'Open')}
 <div class="blk kv"><span>Owner</span><span>${cdE(t.owner||'—')}</span><span>Due</span><span>${t.due?cdE(pretty(t.due)):'—'}</span>${t.evidence?`<span>Evidence</span><span>${cdE(t.evidence)}</span>`:''}${t.outcome?`<span>Resolution</span><span>${cdE(t.outcome)}</span>`:''}</div>
 <div class="blk"><div class="lbl" style="margin-bottom:4px">Trail</div><ul class="trail">${(t.activity||[]).slice(-6).reverse().map(a=>`<li><b>${cdE(a.at?CD.short(a.at.slice(0,10)):'')}</b><span title="${cdE(a.message)}">${cdE(a.message)}</span></li>`).join('')||'<li>No further history.</li>'}</ul></div>
 <div class="blk acts">${CD.btn(x.k==='closed'?'View or reopen':'Update or close',()=>taskEditor(t.id),true)}</div>`;
};
/* Calendar (three tabs) */
CD.calRows=()=>D.rows();
CD.V.calendar=function(){
 const rows=CD.calRows(),tab=CD.st.cal;
 const c=k=>rows.filter(r=>D.status(r).cls===k).length;
 const head=`<div class="hd"><h1>${tab==='Month'?cdE(D.date(CD.st.month+'-01').toLocaleDateString('en-AU',{month:'long',year:'numeric'})):'Calendar'}</h1>${tab==='Month'?`<div class="acts">${CD.btn('‹',()=>{CD.st.month=addInterval(CD.st.month+'-01',-1,'months').slice(0,7);render();})}${CD.btn('Today',()=>{CD.st.month=today().slice(0,7);CD.st.day=today();render();})}${CD.btn('›',()=>{CD.st.month=addInterval(CD.st.month+'-01',1,'months').slice(0,7);render();})}${CD.btn('Schedule meeting',()=>CD.scheduleMeeting(CD.st.day),true)}</div>`:tab==='Year'?`<div class="acts">${CD.btn('‹ '+(CD.st.year-1),()=>{CD.st.year--;render();})}${CD.btn((CD.st.year+1)+' ›',()=>{CD.st.year++;render();})}</div>`:''}</div>
 <p class="status"><b class="w-overdue">${c('w-overdue')} overdue</b> · <b class="w-soon">${c('w-soon')} due within 7 days</b> · ${rows.filter(r=>r.date&&r.date>=today()&&r.date<=addInterval(today(),28,'days')).length} dates in the next four weeks</p>
 <div class="filters" role="group">${[['Weekly','This week & next'],['Year','Year plan'],['Month','Month']].map(([k,l])=>`<button type="button" ${CD.a(()=>{CD.st.cal=k;render();})} aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
 return tab==='Year'?CD.calYear(head,rows):tab==='Month'?CD.calMonth(head,rows):CD.calWeekly(head,rows);
};
CD.itemPane=function(r,extra=''){
 if(!r)return '<p class="sub">Select an item to see its details.</p>';
 const s=D.status(r),cls=s.cls.replace('w-',''),k={overdue:'overdue',soon:'soon',up:'staff',prog:'check',done:'ok'}[cls]||'staff';
 let basis='';try{if(!r.id.startsWith('A1/'))basis=RPH.schedule.basis(r.id).text;}catch{}
 const a=catalog().find(x=>x.id===r.id),last=CD.lastReview(r.id)[0];
 const acts=[CD.btn(D.inProgress(r)?'Continue':'Open',()=>D.open(r),true)];if(D.canReschedule(r))acts.push(CD.btn('Change date',()=>D.changeDate(r)));
 return `<div class="lbl">${r.meetingType?'Meeting':r.id.startsWith('A1/')?'Staff':'Review'} · ${cdE(state.pharmacyName||'')}</div><h2>${cdE(r.label)}</h2>${CD.word(k,s.word+(r.date?' · '+pretty(r.date):''))}<div class="blk kv"><span>Cadence</span><span>${cdE(a?.frequency||(r.meetingType?'Meeting':r.id.startsWith('A1/')?'Annual':'—'))}</span><span>Last done</span><span>${last?cdE(pretty(last.date)):'—'}</span><span>Source</span><span>${cdE(r.id.startsWith('A1/')?'Staff record':CD.basisLabel(r.id))}</span></div>${basis?`<div class="blk"><p style="margin:0;font-size:14px">${cdE(basis)}</p></div>`:''}${extra}<div class="blk acts">${acts.join('')}</div>`;
};
CD.statusCls=r=>({'w-overdue':'overdue','w-soon':'soon','w-up':'staff','w-prog':'check','w-done':'ok'})[D.status(r).cls]||'staff';
CD.calWeekly=function(head,rows){
 const now=today(),wk=D.weekStart(now),next=D.addDays(wk,7),horizon=D.addDays(wk,56);
 const groups=[];const g=(title,sub,items)=>groups.push({title,sub,items});
 g('Overdue','From earlier weeks',rows.filter(r=>r.date&&r.date<wk));
 const done=D.completedOn().filter(c=>c.date>=wk&&c.date<=now);
 for(let w=wk;w<horizon;w=D.addDays(w,7)){const end=D.addDays(w,6),items=rows.filter(r=>r.date&&r.date>=w&&r.date<=end);const d=w===wk?done:[];if(items.length||d.length||w===wk||w===next)g(w===wk?'This week':w===next?'Next week':'Week of '+CD.short(w),CD.short(w)+' – '+CD.short(end),items,d);if(d.length)groups[groups.length-1].done=d;}
 g('Later','After '+CD.short(D.addDays(horizon,-1)),rows.filter(r=>r.date&&r.date>=horizon));
 g('No date yet','Set a first date',rows.filter(r=>!r.date));
 const all=groups.flatMap(x=>x.items.map(r=>({...r})));all.forEach(r=>r.id=r.id);
 const sel=CD.pick('cal',all.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')));
 const detail=CD.itemPane(sel);
 const body=groups.filter(x=>x.items.length||x.done?.length||['This week','Next week'].includes(x.title)).map(x=>`<div class="sec">${cdE(x.title)} · ${cdE(x.sub)} · ${x.items.length+(x.done?.length||0)}</div>${x.items.length||x.done?.length?CD.table('cal',[['Date'],['Item'],['Status']],[...(x.done||[]).map(c=>({id:'done:'+c.review.id,cells:[`<b>${cdE(CD.short(c.date))}</b> <span class="sub">${cdE(CD.dow(c.date))}</span>`,`<span class="nm">${cdE(c.label)}</span>`,CD.word('ok','Completed')]})),...x.items.sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(r=>({id:r.id,cells:[r.date?`<b>${cdE(CD.short(r.date))}</b> <span class="sub">${cdE(CD.dow(r.date))}</span>`:'<span class="sub">—</span>',`<span class="nm">${cdE(r.label)}</span>${D.legal(r.id)?'<span class="legal" title="Legal or external date">§</span>':''}`,CD.word(CD.statusCls(r),D.status(r).word)]}))],sel&&sel.id,detail,'wk'):'<p class="sub" style="margin:6px 0">Nothing due.</p>'}`).join('');
 return CD.layout(head+body+`<p class="sub" style="margin-top:14px">§ legal or external date. Dates come from your schedule; nothing here changes them.</p>`,detail);
};
CD.calYear=function(head,rows){
 const y=CD.st.year,now=today(),ym=m=>y+'-'+String(m+1).padStart(2,'0'),done=D.completedOn();
 const items=rows.filter(r=>!r.taskType);const load=Array(12).fill(0),mi=[...Array(12)].map(()=>[]);
 const sel=CD.pick('year',items);
 const body=items.map(r=>{const cells=[`${CD.dot(D.legal(r.id)?'legal':CD.statusCls(r))}<span class="nm">${cdE(r.label)}</span>${D.legal(r.id)?'<span class="legal">§</span>':''}`];
  const exp=new Set(CD.expected(r,y));
  for(let m=0;m<12;m++){const k=ym(m),did=done.some(c=>c.id===(r.id.startsWith('A1/')?'A1':r.id)&&c.date.startsWith(k)&&(!r.id.startsWith('A1/')||c.review.personId===r.id.slice(3)||c.review.answers?.some(a=>a.personId===r.id.slice(3))));let h='';if(did)h+='<span class="mk done">Done</span>';if(r.date&&r.date.startsWith(k)){if(r.date<now)h+='<span class="mk overdue">Overdue</span>';else{h+='<span class="mk planned">Planned</span>';load[m]++;mi[m].push(r);}}else if(exp.has(k)&&!did)h+='<span class="ring" role="img" aria-label="Expected repeat" title="Expected repeat, from the review interval. Not a set date."></span>';cells.push(h);}
  return {id:r.id,cells};});
 const peak=Math.max(0,...load),pm=load.indexOf(peak),nz=load.filter(Boolean),avg=nz.length?nz.reduce((a,b)=>a+b,0)/nz.length:0;
 const busy=(peak>=5||peak>=4&&peak>=avg*1.5)?`<div class="note"><b>${cdE(new Date(y,pm,1).toLocaleDateString('en-AU',{month:'long'}))} looks heavy · ${peak} reviews due.</b> <span class="sub">Spread them out if you can. Changing a date uses the usual dialog and asks for a reason when a date moves later.</span><div class="acts" style="margin-top:8px">${mi[pm].map(r=>D.canReschedule(r)?`<button class="chip" ${CD.a(()=>D.changeDate(r))}>${cdE(r.label)} · ${cdE(CD.short(r.date))}</button>`:`<button class="chip" ${CD.a(()=>D.open(r))}>${cdE(r.label)} · ${cdE(CD.short(r.date))}</button>`).join('')}</div></div>`:'';
 const months=[...Array(12)].map((_,m)=>[new Date(y,m,1).toLocaleDateString('en-AU',{month:'short'}),'m']);
 const tbl=`<div class="scroll"><table class="yr fx"><thead><tr><th style="width:210px">Review</th>${months.map(([l],m)=>`<th class="m"${ym(m)===now.slice(0,7)?' style="color:var(--ink)"':''}>${l}</th>`).join('')}</tr></thead><tbody>${body.map(b=>`<tr data-row="year:${cdE(b.id)}" class="${b.id===(sel&&sel.id)?'sel':''}">${b.cells.map((c,i)=>`<td class="${i?'m':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 return CD.layout(head+busy+`<div class="sec">${y}</div>`+tbl+`<p class="sub" style="margin-top:12px"><b class="w-ok">Done</b> review recorded · <b class="w-overdue">Overdue</b> date passed · <b>Planned</b> next due date · <span class="ring"></span> expected repeat, from the review’s interval (not a set date) · <b>§</b> legal or external.</p>`,CD.itemPane(sel));
};
/* Expected repeats: from the next due date, step forward by the review's own interval (your setup interval, else the app's suggested interval). Display only; never a set date. */
CD.expected=function(r,y){
 if(!r.date||r.meetingType)return [];
 let step=null;
 if(r.id.startsWith('A1/'))step={amount:12,unit:'months'};
 else{const a=catalog().find(x=>x.id===r.id);if(!a||a.eventOnly)return [];const c=state.auditSetup?.[r.id];if(c&&Number.isInteger(c.amount)&&c.amount>0&&c.unit)step={amount:c.amount,unit:c.unit};else{try{const sg=suggestion(a);if(sg?.months)step={amount:sg.months,unit:'months'};}catch{}}}
 if(!step)return [];
 const out=[];let d=r.date;for(let i=0;i<60;i++){d=addInterval(d,step.amount,step.unit);if(Number(d.slice(0,4))>y)break;if(d.slice(0,4)===String(y))out.push(d.slice(0,7));}
 return out;
};
CD.calMonth=function(head,rows){
 const [y,m]=CD.st.month.split('-').map(Number),first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),lead=(first.getDay()+6)%7,now=today();
 const iso=d=>D.iso(new Date(y,m-1,d,12));
 const done=D.completedOn();
 let cells=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div style="min-height:0;font-weight:600;color:var(--faint)">${d}</div>`).join('');
 for(let i=0;i<lead;i++){const d=new Date(y,m-1,1-lead+i,12);cells+=`<div class="o"><span class="dn" style="color:#c2c7d2">${d.getDate()}</span></div>`;}
 const colour={overdue:'var(--red)',soon:'var(--amber)',staff:'#687083',check:'var(--accent)',ok:'var(--green)'};
 for(let d=1;d<=days;d++){const date=iso(d),ev=rows.filter(r=>r.date===date),dn=done.filter(c=>c.date===date);
  cells+=`<button ${CD.a(()=>{CD.st.day=date;render();})} aria-pressed="${CD.st.day===date}" aria-label="${cdE(pretty(date))} · ${ev.length} due" class="${date===now?'today':''}"><span class="dn">${d}</span>${ev.slice(0,3).map(r=>`<span class="ev" style="--c:${D.legal(r.id)?'var(--ink)':colour[CD.statusCls(r)]}">${D.legal(r.id)?'§ ':''}${cdE(r.label)}</span>`).join('')}${ev.length>3?`<span class="ev sub">+${ev.length-3} more</span>`:''}${dn.map(c=>`<span class="ev" style="--c:var(--green)">✓ ${cdE(c.label)}</span>`).join('')}</button>`;}
 const dayItems=rows.filter(r=>r.date===CD.st.day);
 const pane=`<div class="lbl">${cdE(D.date(CD.st.day).toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'}))}</div><h2>${dayItems.length?dayItems.length+' due':'Nothing due'}</h2>${dayItems.map(r=>`<div class="blk"><span class="nm">${cdE(r.label)}</span><div class="sub">${D.legal(r.id)?'§ Legal or external date':r.meetingType?'Meeting':r.id.startsWith('A1/')?'Staff assurance':'Review'} · ${cdE(D.status(r).word)}</div><div class="acts" style="margin-top:8px">${CD.btn('Open',()=>D.open(r))}${D.canReschedule(r)?CD.btn('Change date',()=>D.changeDate(r)):''}</div></div>`).join('')}<div class="blk">${CD.btn('Schedule meeting on '+CD.short(CD.st.day),()=>CD.scheduleMeeting(CD.st.day))}</div>${!dayItems.length?CD.planPane(rows):''}`;
 const unsched=rows.filter(r=>!r.date);
 const plain=`<div class="sec">Plan in plain words</div><div class="plain"><input id="cd-plain" aria-label="Describe what to plan, for example: S8 check 1st Dec" placeholder="e.g. S8 check 1st Dec morning" value="${cdE(CD.st.plain||'')}">${CD.btn('Find',()=>{CD.st.plain=$('cd-plain').value;render();})}</div>${CD.plainResult(rows)}`;
 const ag=rows.filter(r=>r.date&&r.date>=now&&r.date<=addInterval(now,28,'days')).sort((a,b)=>a.date.localeCompare(b.date));
 const agenda=`<div class="sec">Next four weeks</div>${ag.length?CD.table('agenda',[['Date','',110],['Item'],['Type','hide-m',110]],ag.map(r=>({id:r.id,cells:[`<b>${cdE(CD.short(r.date))}</b> <span class="sub">${cdE(CD.dow(r.date))}</span>`,`<span class="nm">${cdE(r.label)}</span>`,D.legal(r.id)?CD.word('legal','§ Legal'):CD.word('staff',r.meetingType?'Meeting':r.id.startsWith('A1/')?'Staff':'Review')]})),CD.st.sel.agenda,CD.itemPane(ag.find(r=>r.id===CD.st.sel.agenda))):'<p class="sub">Nothing in the next four weeks.</p>'}${unsched.length?`<div class="sec">Not scheduled · ${unsched.length}</div>${CD.table('unsched',[['Item'],['']],unsched.map(r=>({id:r.id,cells:[`${CD.dot('staff')}<span class="nm">${cdE(r.label)}</span>`,'<span class="verb">Set date</span>']})),CD.st.sel.unsched,CD.itemPane(unsched.find(r=>r.id===CD.st.sel.unsched),RPH.schedule.unscheduled().some(u=>u.id===CD.st.sel.unsched)?`<div class="blk">${CD.btn('Set a first date',()=>RPH.schedule.firstDate(RPH.schedule.unscheduled().find(u=>u.id===CD.st.sel.unsched)),true)}</div>`:''))}`:''}`;
 return CD.layout(head+`<div class="cal">${cells}</div>`+plain+agenda,pane);
};
CD.planPane=function(rows){
 const late=rows.filter(r=>r.date&&r.date<today()),none=RPH.schedule.unscheduled();
 if(!late.length&&!none.length)return '';
 return `<div class="blk"><div class="lbl" style="margin-bottom:6px">Needs planning</div>${late.slice(0,4).map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span><span class="nm" style="font-weight:500">${cdE(r.label)}</span><div class="sub w-overdue">${cdE(CD.dueText(r.date))}</div></span>${D.canReschedule(r)?`<button class="verb" ${CD.a(()=>D.changeDate(r))}>Plan</button>`:`<button class="verb" ${CD.a(()=>D.open(r))}>Open</button>`}</div>`).join('')}${none.slice(0,4).map(u=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span><span class="nm" style="font-weight:500">${cdE(u.label)}</span><div class="sub">${cdE(u.reason)}</div></span><button class="verb" ${CD.a(()=>RPH.schedule.firstDate(u))}>Set date</button></div>`).join('')}</div>`;
};
CD.plainResult=function(rows){
 const q=(CD.st.plain||'').trim();if(!q)return '';
 const r=D.match(q,rows),date=D.parseDate(q),time=/\b(morning|afternoon|evening|\d{1,2}(:\d{2})?\s?(am|pm))\b/i.test(q);
 if(!r)return `<p class="sub" role="status">No matching review or meeting. Try part of its name, for example “S8” or “site visit”.</p>`;
 if(!date)return `<p class="sub" role="status">Found ${cdE(r.label)}. Add a date, for example “1 Dec” or “tomorrow”.</p>`;
 return `<div class="blk" role="status" style="margin-top:12px"><span class="nm">${cdE(r.label)}</span> → <b>${cdE(pretty(date))}</b>${r.date?` <span class="sub">(now ${cdE(pretty(r.date))})</span>`:''}${time?'<div class="sub">Only the date is saved; reviews don’t store a time of day.</div>':''}<div class="acts" style="margin-top:8px">${D.canReschedule(r)?CD.btn('Add',()=>D.changeDate(r,date),true)+'<span class="sub" style="align-self:center">Opens the usual date dialog with this date filled in.</span>':CD.btn('Open '+r.label,()=>D.open(r))+'<span class="sub" style="align-self:center">This date is set from the staff record.</span>'}</div></div>`;
};
/* Schedule a meeting on a day. Same dialog, fields, save and history entry as the Audits calendar in v27 (copied unchanged from calendar()). */
CD.scheduleMeeting=function(day){
 openDialog('<h2 id="dialog-title">Schedule meeting</h2><form id="plan-meeting"><label>Meeting type<select name="type"></select></label><label>Meeting date<input type="date" name="due" required></label><p id="current-meeting-date"></p><button>Save meeting date</button></form>');
 const f=$('plan-meeting');for(const [code,name] of Object.entries(scheduledMeetings))f.elements.type.add(new Option(name,code));f.elements.due.value=day||today();
 function prior(){const saved=state.schedule[f.elements.type.value];$('current-meeting-date').textContent=saved?'Current scheduled date: '+pretty(saved):'No date scheduled.';}prior();f.elements.type.onchange=prior;
 f.onsubmit=e=>{e.preventDefault();const n=clone(),id=f.elements.type.value,previousDue=n.schedule[id]||'';n.schedule[id]=f.elements.due.value;n.history.push({at:new Date().toISOString(),by:fsReviewer(),reviewerId:state.currentReviewer,audit:id,previousDue,nextDue:n.schedule[id],message:'Scheduled '+scheduledMeetings[id]});if(commit(n,'Saved meeting date'))$('editor').close();};
};
/* Staff (Concept B matrix in Concept D) */
CD.V.staff=function(){
 const f=CD.st.f.staff,q=(CD.st.q.staff||'').toLowerCase(),all=state.staff||[];
 const rows=all.map(p=>({id:p.id,p,items:staffItems(p)}));
 const needs=x=>personDue(x.p)&&personDue(x.p)<=today()||x.items.some(i=>i.outcome==='Needs Review');
 const soon=x=>!needs(x)&&(personDue(x.p)&&personDue(x.p)<=addInterval(today(),reminderLead(),'days')||x.items.some(i=>i.soon));
 const filters={Active:x=>x.p.active!==false,'Needs review':x=>x.p.active!==false&&needs(x),'Coming up':x=>x.p.active!==false&&soon(x),Locum:x=>x.p.active!==false&&engagement(x.p)==='Locum',Former:x=>x.p.active===false};
 const list=rows.filter(filters[f]||filters.Active).filter(x=>(x.p.person+' '+x.p.role).toLowerCase().includes(q));
 const sel=CD.pick('staff',list);
 const st=x=>x.p.active===false?['staff','Former']:needs(x)?['overdue','Needs review']:soon(x)?['soon','Coming up']:['ok','Current'];
 const cell=(x,kind)=>{const c=D.staffCell(x.items,kind);return c.word==='—'?'<span class="sub">—</span>':CD.word({'w-overdue':'overdue','w-soon':'soon','w-done':'ok','w-up':'staff'}[c.cls]||'staff',c.word);};
 const ann=x=>{const a=D.annualCell(x.p);return CD.word({'w-overdue':'overdue','w-soon':'soon','w-up':'staff'}[a.cls]||'staff',a.word);};
 const detail=sel?CD.staffDetail(sel,st(sel)):'';
 const main=`<div class="hd"><h1>Staff</h1><div class="tools"><input class="find" type="search" data-q="staff" aria-label="Find staff" placeholder="Find staff" value="${cdE(CD.st.q.staff||'')}">${CD.btn('Add staff member',()=>staffEditor(),true)}</div></div>
 <p class="status">${rows.filter(filters.Active).length} people at ${cdE(state.pharmacyName||'')} · <b class="w-overdue">${rows.filter(filters['Needs review']).length} need review</b> · <b class="w-soon">${rows.filter(filters['Coming up']).length} coming up</b></p>
 ${CD.filt('staff',Object.keys(filters).map(k=>[k,k,rows.filter(filters[k]).length]))}
 ${list.length?CD.table('staff',[['Person'],['Registration','hide-m',118],['Credentials','hide-m',128],['Training','hide-m',100],['Annual','hide-m',118],['Status','',118]],list.map(x=>({id:x.id,cells:[`${CD.dot(st(x)[0])}<span class="nm">${cdE(x.p.person)}</span><div class="sub" style="margin-left:22px">${cdE(x.p.role||'')}</div>`,cell(x,'reg'),cell(x,'cred'),cell(x,'svc'),ann(x),CD.word(...st(x))]})),sel&&sel.id,detail):`<p class="empty">${all.length?'No matching staff.':'No staff recorded yet. Add your team to track registrations, credentials and annual assurance.'}</p>`}
 <p class="sub" style="margin-top:12px">Dates come from your records. Check registrations yourself on the public register.</p>`;
 return CD.layout(main,detail||'<p class="sub">Nothing selected.</p>');
};
CD.staffDetail=function(x,st){
 const p=x.p,items=x.items;
 const w=i=>i.expired?['overdue','Expired']:i.outcome==='Needs Review'?['overdue','To verify']:i.soon?['soon','Check by '+CD.short(i.expiry)]:i.outcome==='Not Applicable'?['staff','N/A']:['ok','OK'];
 const ann=D.annualCell(p);
 return `<div class="lbl">${cdE(p.role||'')}${engagement(p)&&engagement(p)!==p.role?' · '+cdE(engagement(p)):''}</div><h2>${cdE(p.person)}</h2>${CD.word(...st)}
 <div class="blk">${items.map(i=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span><span class="nm" style="font-weight:500">${cdE(i.label)}</span>${i.expiry?`<div class="sub">Expiry ${cdE(pretty(i.expiry))}</div>`:''}</span>${CD.word(...w(i))}</div>`).join('')}<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0"><span class="nm" style="font-weight:500">Annual assurance</span>${CD.word({'w-overdue':'overdue','w-soon':'soon','w-up':'staff'}[ann.cls]||'staff',ann.word)}</div>${p.changePending?`<p class="sub" style="margin:6px 0 0"><b class="w-overdue">Staff change awaiting review.</b></p>`:''}</div>
 <div class="blk acts">${p.active===false?CD.btn('Open record',()=>openStaff(p.id),true):CD.btn('Open record',()=>openStaff(p.id),true)+CD.btn('Annual assurance',()=>staffAssurance(false,p.id))+CD.btn('Add credential',()=>credentialEditor(p.id))}</div>`;
};
/* Policies */
CD.V.policies=function(){
 const f=CD.st.f.policies,q=(CD.st.q.policies||'').toLowerCase();
 let docs=[];try{docs=procedureDocs();}catch{}
 const stat=d=>duePolicy(d)?['check','Review due']:policyStatus(d)==='Approved'?['ok','Approved']:policyStatus(d)==='Draft'?['soon','Draft']:policyStatus(d)==='In review'?['check','In review']:policyStatus(d)==='Archived'?['staff','Archived']:['staff',policyStatus(d)];
 const list=docs.filter(d=>(f==='all'||stat(d)[1]===f)&&(d.title||d.name||'').toLowerCase().includes(q)).map(d=>({id:d.id,d}));
 const sel=CD.pick('policies',list);
 const ver=fsUnknowns();
 const detail=sel?CD.policyDetail(sel.d,stat(sel.d)):'';
 const c=s=>docs.filter(d=>stat(d)[1]===s).length;
 const main=`<div class="hd"><h1>Policies</h1><div class="tools"><input class="find" type="search" data-q="policies" aria-label="Search procedures" placeholder="Search procedures" value="${cdE(CD.st.q.policies||'')}">${CD.btn('Add policy',()=>policyNew(),true)}</div></div>
 <p class="status">${docs.length} procedures · ${c('Approved')} approved · <b class="w-soon">${c('Draft')} draft</b> · <b class="w-check">${c('Review due')} review due</b></p>
 ${CD.filt('policies',[['all','All',docs.length],['Approved','Approved',c('Approved')],['Draft','Draft',c('Draft')],['In review','In review',c('In review')],['Review due','Review due',c('Review due')]])}
 ${list.length?CD.table('policies',[['Procedure'],['Status','',130],['Version','hide-m',90]],list.map(x=>({id:x.id,cells:[`${CD.dot(stat(x.d)[0])}<span class="nm">${cdE(x.d.title||x.d.name)}</span><div class="sub" style="margin-left:22px">${cdE(CD.policySub(x.d))}</div>`,CD.word(...stat(x.d)),`<span class="sub">${cdE(x.d.version?'v'+String(x.d.version).replace(/^v/i,''):policyStatus(x.d))}</span>`]})),sel&&sel.id,detail):`<p class="empty">${docs.length?'No matching procedures.':'No procedures yet. Add one, or start from the template library.'}</p>`}
 <div class="acts" style="margin-top:14px">${CD.btn('Template library & documents',()=>{CD.st.lib=true;render();})}${CD.btn('Annual policy reviews',()=>{try{arQueue();}catch{CD.legacy('Annual policy reviews');}})}</div>
 <div class="sec">Setup answers to verify · ${ver.length}</div>${ver.length?CD.table('verify',[['Answer'],['']],ver.map(v=>({id:v.id,cells:[cdE(v.label),`<span class="verb" ${CD.a(v.run)}>Verify</span>`]})),null,''):'<p class="sub">Nothing to verify.</p>'}`;
 return CD.layout(main,detail||'<p class="sub">Select a procedure to see its details.</p>');
};
CD.policySub=d=>{const l=policyStatus(d);return (duePolicy(d)?'Review due':l)+(d.reviewDate&&!duePolicy(d)?' · next review '+CD.short(d.reviewDate):d.reviewDate?' · was due '+CD.short(d.reviewDate):'')+(d.updatedAt?' · updated '+CD.short(d.updatedAt.slice(0,10)):'');};
CD.policyDetail=function(d,st){
 return `<div class="lbl">${cdE(d.version?'Version '+String(d.version).replace(/^v/i,''):'Procedure')}</div><h2>${cdE(d.title||d.name)}</h2>${CD.word(...st)}
 <div class="blk kv">${d.reference?`<span>Reference</span><span>${cdE(d.reference)}</span>`:''}${d.owner?`<span>Reviewer</span><span>${cdE(d.owner)}</span>`:''}${d.reviewDate?`<span>Review</span><span>${cdE(pretty(d.reviewDate))}</span>`:''}<span>Status</span><span>${cdE(policyStatus(d))}</span></div>
 <div class="blk acts">${CD.btn('Open procedure',()=>policyDetail(d.id),true)}${!d.lifecycle?CD.btn('Edit reference',()=>documentEditor(d.scope,d.group,d.id)):''}${CD.btn('Add action',()=>taskEditor('',taskRef('Policy',d.id)))}</div>`;
};
/* More (phone) */
CD.V.more=function(){
 const items=[['staff','Staff','Credentials, training and annual assurance'],['documents','Policies','Procedures, templates and answers to verify'],['meetings','Meetings','Check-ins, agendas and minutes'],['services','Services','What this pharmacy provides'],['history','History','Every record, with exports'],['setup','Pharmacy setup','Details, proprietors, backups and other pharmacies']];
 return `<div class="main"><h1>More</h1><table><tbody>${items.map(([k,n,m])=>`<tr><td><button data-go="${k}" style="width:100%;text-align:left;min-height:44px"><span class="nm">${n}</span><div class="sub">${m}</div></button></td></tr>`).join('')}${window.innerWidth>700?`<tr><td><button ${CD.a(()=>{D.applyView(!D.phone);render();})} style="width:100%;text-align:left;min-height:44px"><span class="nm">${D.phone?'Laptop view':'Phone view'}</span><div class="sub">UAT: switch layouts on this screen</div></button></td></tr>`:''}</tbody></table></div>`;
};

/* ---------- audit screen: the review editor as Concept D's audit page ---------- */
CD.svize=function(){
 const ed=$('editor'),root=ed.querySelector('#sv-root');if(!root)return false;
 if(!ed.classList.contains('cd-audit')){
  ed.classList.add('cd-audit','cd-sv');CD.svIdx=(()=>{const its=[...root.querySelectorAll('.sv-item')];let i=its.findIndex(it=>!it.querySelector('[role=radio][aria-checked=true]'));let pr=[];try{pr=RPH.sv.problems()||[];}catch{}const keys=new Set(pr.map(x=>Array.isArray(x)?x[0]:x?.key).filter(Boolean));const j=its.findIndex(it=>keys.has(it.dataset.key)&&it.querySelector('[role=radio][aria-checked=true]'));if(j>=0&&(i<0||j<i))i=j;return i<0?Math.max(0,its.length-1):i;})();
  const top=D.el('div',{class:'cd-audit-top'});const back=D.el('button',{type:'button'});back.textContent='← '+({audits:'Reviews',overview:'Today',planner:'Calendar',staff:'Staff'}[page]||'Back');back.onclick=()=>ed.close();top.append(back,D.el('span',{style:'font-size:13px;color:#5b6476',text:'Saved as you go'}));
  root.before(top,D.el('div',{class:'cd-prog','aria-hidden':'true'}));
  ed.append(D.el('aside',{class:'cd-steps','aria-label':'Progress'}));
  const items=root.querySelector('.sv-items');
  const nav=D.el('div',{class:'cd-svnav'});const prev=D.el('button',{type:'button',text:'Previous'});const next=D.el('button',{type:'button',class:'primary',text:'Save and next'});
  prev.onclick=()=>{CD.svIdx=Math.max(0,CD.svIdx-1);CD.svSteps();};next.onclick=()=>{const n=root.querySelectorAll('.sv-item').length;CD.svIdx=Math.min(n-1,CD.svIdx+1);CD.svSteps();root.querySelector('.sv-item.cd-cur [role=radio]')?.focus();};
  nav.append(prev,next);items.after(nav);
  ed.addEventListener('click',()=>setTimeout(CD.svSteps,0));
 }
 for(const g of root.querySelectorAll('.rph-seg[role=radiogroup]'))[...g.querySelectorAll(':scope>button[role=radio]')].forEach((b,i)=>{if(!b.querySelector('kbd')&&i<4)b.append(D.el('kbd',{text:String(i+1)}));});
 CD.svSteps();return true;
};
CD.svSteps=function(){
 const ed=$('editor'),root=ed.querySelector('#sv-root');if(!root||!ed.classList.contains('cd-sv'))return;
 const items=[...root.querySelectorAll('.sv-item')],n=items.length;CD.svIdx=Math.min(CD.svIdx||0,n-1);
 const val=it=>it.querySelector('[role=radio][aria-checked=true]')?.firstChild?.textContent?.trim()||'';
 items.forEach((it,i)=>{it.classList.toggle('cd-cur',i===CD.svIdx);let l=it.querySelector('.cd-checklbl');if(!l){l=D.el('div',{class:'cd-checklbl'});it.prepend(l);}l.textContent='Check '+(i+1)+' of '+n+(it.querySelector('.sv-pill')?.textContent&&val(it)?' · '+it.querySelector('.sv-pill').textContent:'');});
 ed.querySelector('.cd-prog')?.replaceChildren(...items.map((it,i)=>D.el('i',{class:val(it)?'on':i===CD.svIdx?'cur':''})));
 const nav=ed.querySelector('.cd-svnav');if(nav){nav.children[0].disabled=CD.svIdx===0;nav.children[1].textContent=CD.svIdx===n-1?'Last check':'Save and next';nav.children[1].disabled=CD.svIdx===n-1;}
 const pane=ed.querySelector('.cd-steps');if(!pane)return;
 const title=root.querySelector('#dialog-title')?.textContent||'Site visit';
 pane.replaceChildren(D.el('div',{class:'lbl',text:title+' · '+(state.pharmacyName||'')}),D.el('h2',{text:'Progress'}),D.el('p',{class:'lbl',text:items.filter(val).length+' of '+n+' reviewed'}));
 items.forEach((it,i)=>{const v=val(it),b=D.el('button',{type:'button'});if(i===CD.svIdx)b.setAttribute('aria-current','step');const bad=/issue|verify/i.test(v);
  b.append(D.el('span',{class:'n',text:String(i+1)}),D.el('span',{text:it.querySelector('h3')?.textContent||'Check '+(i+1)}),D.el('span',{class:'r',style:'color:'+(v?(bad?'#c0281b':'#1c7a3e'):'#687083'),text:v?(v==='Satisfactory'?'OK':v):''}));
  b.onclick=()=>{CD.svIdx=i;CD.svSteps();};pane.append(b);});
 const ctx=root.querySelector('.sv-context summary')?.textContent;if(ctx){const blk=D.el('div',{class:'lbl',style:'margin-top:18px;padding-top:14px;border-top:1px solid #e6e8ee',text:ctx});pane.append(blk);}
};
CD.auditize=function(){
 const ed=$('editor');if(!ed.open)return;document.documentElement.style.setProperty('--cd-top',(($('cd-bar')?.getBoundingClientRect().height)||97)+'px');
 if(CD.svize())return;
 const form=ed.querySelector('form');const sets=form?[...form.querySelectorAll('fieldset')].filter(fs=>fs.querySelector('input[type=radio]')&&fs.offsetParent!==null||fs.querySelector('input[type=radio]')):[];
 const isReview=sets.length>0&&!ed.querySelector('.fresh-form')&&!ed.querySelector('#task-form');
 if(!isReview){ed.classList.remove('cd-audit','cd-sv','cd-step');return;}
 if(!ed.classList.contains('cd-audit')){
  ed.classList.add('cd-audit');
  const top=D.el('div',{class:'cd-audit-top'});const back=D.el('button',{type:'button'});back.textContent='← '+({audits:'Reviews',overview:'Today',planner:'Calendar',staff:'Staff'}[page]||'Back');back.onclick=()=>ed.close();top.append(back,D.el('span',{class:'sub',style:'font-size:13px;color:#5b6476',text:'Drafts save as you type'}));
  const prog=D.el('div',{class:'cd-prog','aria-hidden':'true'});
  const title=ed.querySelector('#dialog-title');(title||ed.firstElementChild).before(top,prog);
  const pane=D.el('aside',{class:'cd-steps','aria-label':'Progress'});ed.append(pane);
  ed.addEventListener('change',()=>CD.auditSteps());ed.addEventListener('focusin',e=>{if(!e.target.closest('.cd-steps,.cd-revnav'))CD.auditSteps();});
 }
 for(const fs of sets)for(const l of fs.querySelectorAll('label')){const r=l.querySelector(':scope>input[type=radio]');if(r&&!l.classList.contains('cd-opt')){l.classList.add('cd-opt');const i=[...ed.querySelectorAll('input[type=radio]')].filter(x=>x.name===r.name).indexOf(r);if(i>=0&&i<4)l.append(D.el('kbd',{text:String(i+1)}));}}

 /* One question at a time where it suits: two or more questions, each in its own block. */
 const groups=CD.auditSets(),els=new Set(groups.map(x=>x.el));
 if(!ed.classList.contains('cd-step')&&groups.length>=2&&els.size===groups.length){
  ed.classList.add('cd-step');CD.revIdx=(()=>{const sets=CD.auditSets();const i=sets.findIndex(x=>!x.checked());return i<0?Math.max(0,sets.length-1):i;})();
  const nav=D.el('div',{class:'cd-svnav cd-revnav'});const prev=D.el('button',{type:'button',text:'Previous'});const next=D.el('button',{type:'button',class:'primary',text:'Save and next'});
  prev.onclick=()=>{CD.revIdx=Math.max(0,CD.revIdx-1);CD.auditSteps();};next.onclick=()=>{CD.revIdx=Math.min(CD.auditSets().length-1,CD.revIdx+1);CD.auditSteps();CD.auditSets()[CD.revIdx]?.radios()[0]?.focus({preventScroll:true});};
  nav.append(prev,next);groups[groups.length-1].el.after(nav);
  /* A required question left unanswered on a hidden step: show that step instead of failing silently. */
  ed.addEventListener('invalid',e=>{const i=CD.auditSets().findIndex(x=>x.el.contains(e.target));if(i>=0&&i!==CD.revIdx){CD.revIdx=i;CD.auditSteps();}},true);
 }
 CD.auditSteps();
};
CD.auditSets=()=>{const ed=$('editor'),names=[...new Set([...ed.querySelectorAll('label.cd-opt>input[type=radio]')].map(r=>r.name))];return names.map(n=>{const first=ed.querySelector('label.cd-opt>input[type=radio][name="'+CSS.escape(n)+'"]');const fs=first.closest('fieldset');return {name:n,el:fs||first.closest('label').parentElement,checked:()=>!!ed.querySelector('input[type=radio][name="'+CSS.escape(n)+'"]:checked'),radios:()=>[...ed.querySelectorAll('input[type=radio][name="'+CSS.escape(n)+'"]')],legend:()=>{const lg=(fs&&fs.querySelector('legend'))||first.closest('label').parentElement.querySelector('legend,h3,p');return (lg?.textContent||'').trim();}};});};
CD.auditCur=function(){const sets=CD.auditSets();if($('editor').classList.contains('cd-step'))return sets[Math.min(CD.revIdx||0,sets.length-1)];const a=document.activeElement;const byFocus=a&&a.type==='radio'?sets.find(x=>x.name===a.name):null;return byFocus||sets.find(x=>!x.checked())||sets[sets.length-1];};
CD.auditSteps=function(){
 const ed=$('editor');if(!ed.classList.contains('cd-audit'))return;
 const sets=CD.auditSets(),cur=CD.auditCur(),pane=ed.querySelector('.cd-steps'),prog=ed.querySelector('.cd-prog');if(!pane||!cur)return;
 ed.querySelectorAll('.cd-cur').forEach(x=>x.classList.remove('cd-cur'));if(cur.el)cur.el.classList.add('cd-cur');
 const ci=sets.findIndex(x=>x.name===cur.name);const step=ed.classList.contains('cd-step');if(step){sets.forEach((x,i)=>x.el.classList.toggle('cd-off',i!==ci));const nav=ed.querySelector('.cd-revnav');if(nav){const i=ci;nav.children[0].disabled=i===0;nav.children[1].disabled=i===sets.length-1;nav.children[1].textContent=i===sets.length-1?'Last question':'Save and next';}}
 const answered=sets.filter(x=>x.checked()).length;
 prog.replaceChildren(...sets.map(x=>D.el('i',{class:x.checked()?'on':x.name===cur.name?'cur':''})));
 const title=ed.querySelector('#dialog-title')?.textContent||'Review';
 pane.replaceChildren(D.el('div',{class:'lbl',text:title+' · '+(state.pharmacyName||'')}),D.el('h2',{text:'Progress'}),D.el('p',{class:'lbl',text:answered+' of '+sets.length+' answered'}));
 sets.forEach((x,i)=>{const val=x.radios().find(r=>r.checked)?.closest('label')?.textContent.replace(/\d$/,'').trim()||'';const b=D.el('button',{type:'button'});if(x.name===cur.name)b.setAttribute('aria-current','step');
  const bad=/issue|incomplete|outstanding|^yes$|needs/i.test(val);b.append(D.el('span',{class:'n',text:String(i+1)}),D.el('span',{text:(x.legend()||'Question '+(i+1)).slice(0,90)}),D.el('span',{class:'r',style:'color:'+(val?(bad?'#c0281b':'#1c7a3e'):'#687083'),text:val?(bad?val:'OK'):''}));
  b.onclick=()=>{if(ed.classList.contains('cd-step'))CD.revIdx=i;else x.el.scrollIntoView({block:'center',behavior:'smooth'});x.radios()[0]?.focus({preventScroll:true});CD.auditSteps();};pane.append(b);});
};
new MutationObserver(()=>{if($('editor').open)CD.auditize();else $('editor').classList.remove('cd-audit','cd-sv','cd-step');}).observe($('editor'),{childList:true,attributes:true,attributeFilter:['open']});
document.addEventListener('keydown',e=>{
 const ed=$('editor');if(!ed.open||!ed.classList.contains('cd-audit')||!/^[1-4]$/.test(e.key)||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.target.matches('input:not([type=radio]),textarea,select'))return;
 if(ed.classList.contains('cd-sv')){const it=ed.querySelector('.sv-item.cd-cur'),b=it&&it.querySelectorAll('.rph-seg[role=radiogroup]>button[role=radio]')[+e.key-1];if(b){e.preventDefault();b.click();b.focus();setTimeout(CD.svSteps,0);}return;}
 const cur=CD.auditCur();const opt=cur&&cur.radios()[+e.key-1];if(!opt)return;
 e.preventDefault();opt.click();opt.focus();CD.auditSteps();
});

/* ---------- Staff record (person) ---------- */
CD.V.person=function(){
 const p=personRecord(profileId);if(!p)return `<div class="main"><h1>Staff record</h1><p class="empty">This person is no longer on record.</p>${CD.btn('← Staff',()=>CD.go('staff'))}</div>`;
 const f=CD.st.f.person||'req',items=staffItems(p),ann=D.annualCell(p);
 const needs=(personDue(p)&&personDue(p)<=today())||items.some(i=>i.outcome==='Needs Review'),soon=!needs&&(items.some(i=>i.soon)||(personDue(p)&&personDue(p)<=addInterval(today(),reminderLead(),'days')));
 const st=p.active===false?['staff','Former']:needs?['overdue','Needs review']:soon?['soon','Coming up']:['ok','Current'];
 const w=i=>i.expired?['overdue','Expired']:i.outcome==='Needs Review'?['overdue','To verify']:i.soon?['soon','Check by '+CD.short(i.expiry)]:i.outcome==='Not Applicable'?['staff','N/A']:['ok','Verified'];
 const reqs=items.map(i=>({id:i.id,i}));
 const creds=(p.credentials||[]).map((c,k)=>({id:'c'+(c.id||k),c}));
 const hist=priorStaffReviews(p).sort(compareAssurance).reverse().map(r=>({id:r.id,r}));
 const actions=p.active===false?CD.btn('Edit profile',()=>staffEditor(p.id)):CD.btn('Annual assurance',()=>staffAssurance(false,p.id),true)+CD.btn('Review a change',()=>staffAssurance(true,p.id))+CD.btn('Edit profile',()=>staffEditor(p.id))+CD.btn('Departure checklist',()=>departure(p));
 let list='',detail='';
 if(f==='req'){const sel=CD.pick('req',reqs);
  if(sel){const i=sel.i,past=i.past;detail=`<div class="lbl">Requirement</div><h2>${cdE(i.label)}</h2>${CD.word(...w(i))}<div class="blk kv"><span>Last checked</span><span>${past?cdE(pretty(past.answer.verificationDate||past.r.date))+(CD.by(past.r)?' · '+cdE(CD.by(past.r)):''):'Not yet'}</span>${i.expiry?`<span>Expiry</span><span>${cdE(pretty(i.expiry))}</span>`:''}${past?.answer?.answer?`<span>Result</span><span>${cdE(past.answer.answer)}</span>`:''}</div>${p.active!==false?`<div class="blk acts">${CD.btn(past?'Review verification':'Verify now',()=>staffAssurance(true,p.id,i.id),true)}</div>`:''}`;}
  list=reqs.length?CD.table('req',[['Requirement'],['Expiry','hide-m',110],['Status','',140]],reqs.map(x=>({id:x.id,cells:[`${CD.dot(w(x.i)[0])}<span class="nm" style="font-weight:500">${cdE(x.i.label)}</span>`,`<span class="sub">${x.i.expiry?cdE(CD.short(x.i.expiry)):'—'}</span>`,CD.word(...w(x.i))]})),sel&&sel.id,detail):'<p class="empty">No requirements for this role.</p>';}
 else if(f==='cred'){const sel=CD.pick('cred',creds);
  if(sel){const c=sel.c;detail=`<div class="lbl">Credential or training</div><h2>${cdE(c.title)}</h2>${CD.word(c.supersededBy?'staff':c.expiry&&c.expiry<today()?'overdue':c.expiry&&c.expiry<=addInterval(today(),reminderLead(),'days')?'soon':'ok',c.supersededBy?'Replaced':c.expiry?(c.expiry<today()?'Expired ':'Expires ')+pretty(c.expiry):'No expiry')}<div class="blk kv">${c.reference?`<span>Reference</span><span>${cdE(c.reference)}</span>`:''}${c.service?`<span>Service</span><span>${cdE(serviceName(c.service))}</span>`:''}</div>`;}
  list=`<div class="acts" style="margin:14px 0 4px">${p.active!==false?CD.btn('Add credential or training',()=>credentialEditor(p.id)):''}</div>`+(creds.length?CD.table('cred',[['Credential'],['Reference','hide-m',140],['Expiry','',120]],creds.map(x=>({id:x.id,cells:[`${CD.dot(x.c.supersededBy?'staff':x.c.expiry&&x.c.expiry<today()?'overdue':'ok')}<span class="nm" style="font-weight:500">${cdE(x.c.title)}</span>`,`<span class="sub">${cdE(x.c.reference||'—')}</span>`,x.c.expiry?CD.word(x.c.expiry<today()?'overdue':'staff',CD.short(x.c.expiry)):'<span class="sub">—</span>']})),sel&&sel.id,detail):'<p class="empty">No credentials recorded yet.</p>');}
 else {const sel=CD.pick('phist',hist);const open=x=>historyEntries().find(h=>h.type==='Review'&&h.id===x.r.id)?.open();
  if(sel)detail=`<div class="lbl">Assurance review</div><h2>${cdE(pretty(sel.r.date))}</h2>${CD.word('ok','Recorded')}<div class="blk kv"><span>By</span><span>${cdE(CD.by(sel.r)||'—')}</span><span>Answers</span><span>${(sel.r.answers||[]).filter(a=>(a.personId||sel.r.personId)===p.id).length}</span></div><div class="blk acts">${CD.btn('Open record',()=>open(sel),true)}</div>`;
  list=hist.length?CD.table('phist',[['Review'],['Date','',120],['By','hide-m',150]],hist.map(x=>({id:x.id,cells:[`${CD.dot('ok')}<span class="nm" style="font-weight:500">${cdE(x.r.templateName||'Staff assurance')}</span>`,cdE(CD.short(x.r.date)),`<span class="sub">${cdE(CD.by(x.r))}</span>`]})),sel&&sel.id,detail):'<p class="empty">No recorded assurance reviews.</p>';}
 const head=`<button class="verb" data-go="staff">← Staff</button><div class="lbl" style="margin-top:6px">${cdE(p.role||'')}${engagement(p)&&engagement(p)!==p.role?' · '+cdE(engagement(p)):''}</div><div class="hd"><h1>${cdE(p.person)}</h1><div class="acts">${actions}</div></div>
 <p class="status">${CD.word(...st)} · Annual assurance: ${cdE(ann.word)}${(p.services||[]).length?' · '+cdE(p.services.map(serviceName).join(', ')):''}${p.changePending?' · <b class="w-overdue">staff change awaiting review</b>':''}</p>
 ${CD.filt('person',[['req','Requirements',reqs.length],['cred','Credentials',creds.length],['hist','History',hist.length]])}`;
 return CD.layout(head+list,detail||`<div class="lbl">Staff record</div><h2>${cdE(p.person)}</h2>${CD.word(...st)}<div class="blk kv"><span>Role</span><span>${cdE(p.role||'—')}</span>${p.start?`<span>Started</span><span>${cdE(pretty(p.start))}</span>`:''}<span>Annual</span><span>${cdE(ann.word)}</span></div>`);
};
/* ---------- Pharmacy setup ---------- */
/* Phone setup list (owner, 23 Nov): each section is one row with an icon, a one-line summary, a status chip only
   when something needs attention, and a chevron. Tapping a row opens the section straight away. Laptop is unchanged. */
CD.SETUP_ICONS={'Pharmacy details':'<path d="M3 10l9-6 9 6v10H3z"/><path d="M10 20v-6h4v6"/>','Proprietors & oversight':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 015.5 5.5"/>','Pharmacist in charge':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>','Services & configuration':'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>','Review due dates':'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>','Bought, selling or closing':'<path d="M4 7h16M4 12h10M4 17h7"/>','S8 at a glance':'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>','Legal obligations':'<path d="M12 3l8 4v5c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V7z"/>','NSW Health dates and contacts':'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>','Sources':'<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M8 13h8M8 17h6"/>','My log':'<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>','Evidence locations':'<path d="M3 7h7l2 2h9v10H3z"/>','Reminders & preferences':'<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>','Locations, backup & restore':'<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'};
CD.setupIcon=(label,kind)=>`<span class="cd-sic cd-sic-${kind==='soon'||kind==='overdue'?'a':'n'}" aria-hidden="true"><svg viewBox="0 0 24 24">${CD.SETUP_ICONS[label]||'<circle cx="12" cy="12" r="4"/>'}</svg></span>`;
/* Today filters on a phone (owner, 23 Nov): the four used most as segments with counts; the rest under "More filters",
   which slides up from the bottom. Laptop keeps the full row of tabs. */
CD.TODAY_SEG=[['overdue','Overdue'],['today','Today'],['prog','Started'],['all','All']];
CD.todayFilt=function(opts){
 if(!CD.isM())return CD.filt('today',opts);
 const f=CD.st.f.today,by=Object.fromEntries(opts.map(o=>[o[0],o])),segKeys=CD.TODAY_SEG.map(x=>x[0]);
 const rest=opts.filter(o=>!segKeys.includes(o[0]));
 const wk=(()=>{try{const a=new Date(today()+'T00:00'),b=new Date(addInterval(today(),6,'days')+'T00:00');const o={day:'numeric',month:'short'};return a.toLocaleDateString('en-AU',o)+' – '+b.toLocaleDateString('en-AU',o);}catch{return 'next 7 days';}})();
 const MORE={soon:['Upcoming','Next 7 days · '+wk],task:['Actions only','Fixes you close yourself'],nodate:['No date yet','Set a date so they show up on time'],verify:['To check','Answers marked “check later”'],waiting:['Waiting on someone','Things you asked for · with check-back dates']};
 const seg=`<div class="cd-seg" role="group" aria-label="Filter today’s jobs">${CD.TODAY_SEG.map(([k,l])=>{const n=by[k]?.[2];return `<button type="button" data-f="today:${k}" aria-pressed="${f===k}"><span class="n">${n??''}</span>${cdE(l)}</button>`;}).join('')}</div>`;
 const cur=rest.find(o=>o[0]===f);
 const bar=`<div class="cd-segbar">${cur?`<span class="cd-fchip">Showing: ${cdE((MORE[f]||[cur[1]])[0])} <button class="verb" data-f="today:all" aria-label="Clear filter">Clear</button></span>`:''}<button class="verb cd-morefbtn" ${CD.a(CD.toggleMoreF)} aria-expanded="${!!CD.st.moreF}" aria-controls="cd-moref">More filters</button></div>`;
 const sheet=`<div id="cd-moref" class="cd-moref"${CD.st.moreF?'':' hidden'}><div class="cd-scrim" ${CD.a(CD.toggleMoreF)}></div><div class="cd-sheet" role="dialog" aria-modal="true" aria-label="More filters"><div class="cd-grab"></div><h4>More filters</h4>${rest.map(o=>{const [t,d]=MORE[o[0]]||[o[1],''];return `<button type="button" class="cd-mrow" data-f="today:${cdE(o[0])}" aria-pressed="${f===o[0]}"><span class="cd-stx"><b>${cdE(t)}</b>${d?`<small>${cdE(d)}</small>`:''}</span><span class="n cd-mn">${o[2]??''}</span><span class="cd-chev" aria-hidden="true">›</span></button>`;}).join('')}<button class="verb cd-mclose" ${CD.a(CD.toggleMoreF)}>Close</button></div></div>`;
 return seg+bar+sheet;
};
CD.toggleMoreF=function(){CD.st.moreF=!CD.st.moreF;render();if(CD.st.moreF)setTimeout(()=>document.querySelector('#cd-moref .cd-mrow')?.focus(),0);else setTimeout(()=>document.querySelector('#cd-view .cd-morefbtn')?.focus(),0);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&CD.st.moreF){CD.st.moreF=false;render();}});
CD.SETUP_GROUPS=[['Your pharmacy',['Pharmacy details','Proprietors & oversight','Pharmacist in charge','Services & configuration','Review due dates','Bought, selling or closing']],['Law and inspections',['S8 at a glance','Legal obligations','NSW Health dates and contacts']],['Records',['My log','Evidence locations']],['Settings',['Reminders & preferences','Locations, backup & restore']]];
/* Each section opens the app's own window for it (built by siteSetup in v27), so every form, check and save is unchanged. */
CD.V.setup=function(){
 siteSetup();const rows=[...$('main').querySelectorAll('.rph-menu-row')].map(b=>({id:b.querySelector('strong').textContent,label:b.querySelector('strong').textContent,detail:b.querySelector('small')?.textContent||'',b}));$('main').replaceChildren();
 const pending=fsPending(),un=RPH.schedule.unscheduled(),owners=RPH.currentProprietors();
 const info={
  'Pharmacy details':{st:state.pharmacyName&&siteProfile().address?['ok','Set']:['soon','Incomplete'],kv:[['Name',state.pharmacyName||'—'],['Address',siteProfile().address||'—']]},
  'Proprietors & oversight':{st:['ok',owners.length+' proprietor'+(owners.length===1?'':'s')],kv:[['Proprietors',owners.map(o=>o.name).join(', ')||'—'],['Recording as',RPH.actor().name]]},
  'Services & configuration':{st:pending.length?['soon',pending.length+' to set up']:['ok',state.active.length+' active'],kv:[['Active',state.active.map(serviceName).join(', ')||'None'],['Setup incomplete',pending.map(serviceName).join(', ')||'None']],extra:pending.length?CD.btn('Continue service setup',()=>fsNext(true)):''},
  'Review due dates':{st:un.length?['soon',un.length+' need a date']:['ok','All dated'],kv:[['Need a date',un.map(u=>u.label).join(', ')||'None']],extra:CD.btn('Adjust intervals',()=>openIntervals())},
  'Evidence locations':{st:['staff','Where records are kept'],kv:[]},
  'Reminders & preferences':{st:['staff','Reminder '+reminderLead()+' days'],kv:[['Upcoming reminder',reminderLead()+' days before a due date']]},
  'Locations, backup & restore':{st:(RPH.rec?RPH.rec.status():['staff','Storage and backups']),kv:[['Pharmacies',String((()=>{try{return siteDirectory().sites.length;}catch{return 1;}})())],['Storage',storageIssue?'Unavailable · download a backup':'Saving on this device']]}
 };
 const sel=CD.pick('setup',rows);
 const open=r=>r.label==='Locations, backup & restore'?()=>{CD.st.setupHost=true;CD.st.f.loc='sites';render();window.scrollTo(0,0);}:()=>r.b.click();
 CD.st.setupOpen={};for(const r of rows)CD.st.setupOpen[r.id]=open(r);
 const detail=sel?(()=>{const i=info[sel.label]||{st:['staff',''],kv:[]};return `<div class="lbl">Pharmacy setup</div><h2>${cdE(sel.label)}</h2>${CD.word(...i.st)}${i.kv.length?`<div class="blk kv">${i.kv.map(([a,b])=>`<span>${cdE(a)}</span><span>${cdE(b)}</span>`).join('')}</div>`:''}<div class="blk"><p style="margin:0;font-size:14px" class="muted">${cdE(sel.detail)}</p></div><div class="blk acts">${CD.btn('Open',open(sel),true)}${i.extra||''}</div>`;})():'';
 const main=`<h1>Pharmacy setup</h1><p class="status">${cdE(state.pharmacyName||'')}${pending.length?` · <b class="w-soon">${pending.length} service${pending.length===1?'':'s'} to set up</b>`:''}${un.length?` · <b class="w-soon">${un.length} reviews need a date</b>`:''}</p>
 ${CD.SETUP_GROUPS.map(([h,ls])=>{const rs=rows.filter(r=>ls.includes(r.label)||(h==='Settings'&&!CD.SETUP_GROUPS.some(g=>g[1].includes(r.label))));return rs.length?`<div class="sec">${h}</div>`+CD.table('setup',[['Section'],['Status','',190]],rs.map(r=>{const i=info[r.label]||{st:['staff','']};return {id:r.id,cells:[`<div class="cd-srow">${CD.setupIcon(r.label,i.st[0])}<div class="cd-stx"><span class="nm">${cdE(r.label)}</span><div class="sub">${cdE(r.detail)}</div></div></div>`,`<span class="cd-sst cd-sst-${cdE(i.st[0])}">${CD.word(...i.st)}</span>`]};}),sel&&sel.id,detail,'setup-t'):'';}).join('')}`;
 return CD.layout(main,detail||'<p class="sub">Select a section.</p>');
};
/* ---------- Policy library (templates, checklist, supporting records, forms, guidance, evidence) ---------- */
CD.V.library=function(){
 const f=CD.st.f.library||'tpl',q=(CD.st.q.library||'').toLowerCase();
 let docs=[];try{docs=procedureDocs();}catch{}
 const cat=r=>r.category||procedureIndex.find(x=>x.id===r.catalogueId)?.category||'Uncategorised';
 const starter=id=>typeof starterState==='function'?starterState(id):'';
 const groups={forms:'Forms & templates',guide:'Official guidance',evidence:'Audit evidence'};
 let rows=[],cols,cells,detail='',head='';
 const full=!!CD.st.libFull;
 if(f==='tpl'||f==='check'){
  const src=f==='tpl'&&full?procedureIndex:recommendedProcedures();
  rows=src.filter(r=>(r.name+' '+cat(r)).toLowerCase().includes(q)).map(r=>({id:r.id,r,linked:docs.filter(d=>d.catalogueId===r.id)}));
  const sel=CD.pick('lib-'+f,rows);
  if(sel)detail=`<div class="lbl">${cdE(cat(sel.r))}</div><h2>${cdE(sel.r.name)}</h2>${f==='check'?CD.word(sel.linked.length?'ok':'staff',sel.linked.length?'Recorded here':'No linked pharmacy record'):CD.word('staff',starter(sel.r.id)||'Template')}${sel.linked.length?`<div class="blk"><div class="lbl" style="margin-bottom:6px">Your procedures from this template</div><div class="acts">${sel.linked.map(d=>CD.btn((d.title||'Procedure')+' · '+policyStatus(d),()=>policyDetail(d.id))).join('')}</div></div>`:''}<div class="blk acts">${CD.btn('View template',()=>templateInfo(sel.r),true)}</div>`;
  head=f==='tpl'?`<div class="acts" style="margin-top:12px">${['Recommended','Full catalogue'].map((l,i)=>`<button class="chip" aria-pressed="${!!i===full}" ${CD.a(()=>{CD.st.libFull=!!i;render();})}>${l}</button>`).join('')}</div>`:'';
  cols=[['Template'],[f==='check'?'In your pharmacy':'Status','',190]];
  cells=x=>[`<span class="nm" style="font-weight:500">${cdE(x.r.name)}</span><div class="sub">${cdE(cat(x.r))}</div>`,f==='check'?CD.word(x.linked.length?'ok':'staff',x.linked.length?'Recorded here':'Not recorded'):`<span class="sub">${cdE(starter(x.r.id)||'—')}</span>`];
 }else if(f==='support'){
  rows=supportIndex.filter(r=>(r.name+' '+r.category).toLowerCase().includes(q)).map(r=>({id:r.id,r}));
  const sel=CD.pick('lib-support',rows);
  if(sel)detail=`<div class="lbl">${cdE(sel.r.category||'')}</div><h2>${cdE(sel.r.name)}</h2>${CD.word('staff','Supporting record')}${sel.r.source?`<div class="blk kv"><span>Source</span><span>${cdE(sel.r.source)}</span></div>`:''}`;
  cols=[['Supporting record'],['Category','hide-m',260]];
  cells=x=>[`<span class="nm" style="font-weight:500">${cdE(x.r.name)}</span>`,`<span class="sub">${cdE(x.r.category||'')}</span>`];
 }else{
  const g=groups[f];
  rows=(state.documents||[]).filter(d=>d.scope==='pharmacy'&&d.group===g&&(d.title||'').toLowerCase().includes(q)).map(d=>({id:d.id,d}));
  const sel=CD.pick('lib-'+f,rows);
  if(sel){const d=sel.d;detail=`<div class="lbl">${cdE(g)}</div><h2>${cdE(d.title)}</h2>${CD.word('staff',d.version||'Version not recorded')}<div class="blk kv">${d.owner?`<span>Owner</span><span>${cdE(d.owner)}</span>`:''}${d.reference?`<span>Reference</span><span>${cdE(d.reference)}</span>`:''}${d.reviewDate?`<span>Review</span><span>${cdE(pretty(d.reviewDate))}</span>`:''}</div><div class="blk acts">${CD.btn('Edit details',()=>documentEditor('pharmacy',g,d.id),true)}${/^https?:\/\//i.test(d.url||'')?`<a class="btn" style="display:inline-flex;align-items:center;text-decoration:none;color:inherit" href="${cdE(d.url)}" target="_blank" rel="noopener noreferrer">Open document</a>`:''}</div>`;}
  head=`<div class="acts" style="margin-top:12px">${CD.btn('Add document reference',()=>documentEditor('pharmacy',g),true)}</div>`;
  cols=[['Document'],['Version','hide-m',150],['Review','',120]];
  cells=x=>[`<span class="nm" style="font-weight:500">${cdE(x.d.title)}</span><div class="sub">${cdE(x.d.reference||'')}</div>`,`<span class="sub">${cdE(x.d.version||'—')}</span>`,x.d.reviewDate?CD.word(x.d.reviewDate<today()?'overdue':'staff',CD.short(x.d.reviewDate)):'<span class="sub">—</span>'];
 }
 const sel=rows.find(x=>x.id===CD.st.sel['lib-'+f]);
 const counts={tpl:(full?procedureIndex:recommendedProcedures()).length,check:recommendedProcedures().length,support:supportIndex.length};for(const [k,g] of Object.entries(groups))counts[k]=(state.documents||[]).filter(d=>d.scope==='pharmacy'&&d.group===g).length;
 const main=`<div class="hd"><h1>Policy library</h1><div class="tools"><input class="find" type="search" data-q="library" aria-label="Search the library" placeholder="Search the library" value="${cdE(CD.st.q.library||'')}">${CD.btn('← Procedures',()=>{CD.st.lib=false;render();})}</div></div>
 <p class="status">Templates, the procedure checklist, supporting records and your document references.</p>
 ${CD.filt('library',[['tpl','Templates',counts.tpl],['check','Procedure checklist',counts.check],['support','Supporting records',counts.support],['forms','Forms & templates',counts.forms],['guide','Official guidance',counts.guide],['evidence','Audit evidence',counts.evidence]])}
 ${head}${rows.length?CD.table('lib-'+f,cols,rows.slice(0,CD.st.libN||80).map(x=>({id:x.id,cells:cells(x)})),sel&&sel.id,detail):'<p class="empty">Nothing here yet.</p>'}${rows.length>(CD.st.libN||80)?`<div class="acts" style="margin-top:12px">${CD.btn('Show more',()=>{CD.st.libN=(CD.st.libN||80)+80;render();})}</div>`:''}`;
 return CD.layout(main,detail||'<p class="sub">Select an item.</p>');
};
/* ---------- Meetings ---------- */
CD.V.meetings=function(){
 const f=CD.st.f.meetings||'all',q=(CD.st.q.meetings||'').toLowerCase();
 const up=Object.entries(scheduledMeetings).filter(([id])=>state.schedule[id]).map(([id,label])=>({id:'up:'+id,code:id,label,date:state.schedule[id],up:true}));
 const rec=[...state.meetings].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(m=>({id:'m:'+m.id,m,label:m.title||m.type||'Meeting',date:m.date}));
 const list=[...(f!=='rec'?up:[]),...(f!=='up'?rec:[])].filter(x=>(x.label+' '+(x.m?.type||'')).toLowerCase().includes(q));
 const sel=CD.pick('meetings',list);
 const detail=sel?(sel.up?`<div class="lbl">Scheduled meeting</div><h2>${cdE(sel.label)}</h2>${CD.word(CD.cls(sel.date),CD.when(sel.date))}<div class="blk"><p style="margin:0;font-size:14px">${cdE(RPH.schedule.basis(sel.code).text)}</p></div><div class="blk acts">${CD.btn('Record meeting',()=>editMeeting(sel.code),true)}${CD.btn('Change date',()=>D.changeDate({id:sel.code,label:sel.label}))}</div>`
  :`<div class="lbl">${cdE(sel.m.type||'Meeting')}</div><h2>${cdE(sel.label)}</h2>${CD.word('ok','Recorded '+pretty(sel.date))}<div class="blk kv">${sel.m.attendees?`<span>Attendees</span><span>${cdE(sel.m.attendees)}</span>`:''}<span>Actions</span><span>${(sel.m.actions||[]).length}</span><span>Versions</span><span>${(sel.m.versions||[]).length+1}</span>${sel.m.by?`<span>By</span><span>${cdE(sel.m.by)}</span>`:''}</div>${sel.m.notes?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Notes</div><p style="margin:0;font-size:14px">${cdE(String(sel.m.notes).slice(0,400))}</p></div>`:''}<div class="blk acts">${CD.btn('Open meeting',()=>meetingEditor(sel.m.id),true)}</div>`):'';
 const add=()=>{openDialog('<h2 id="dialog-title">Add meeting</h2><div id="meeting-types"></div>');for(const [code,name] of [...Object.entries(scheduledMeetings),['','Other meeting']])$('meeting-types').append(taskButton(name,()=>editMeeting(code)));};
 const main=`<div class="hd"><h1>Meetings</h1><div class="tools"><input class="find" type="search" data-q="meetings" aria-label="Search meetings" placeholder="Search meetings" value="${cdE(CD.st.q.meetings||'')}">${CD.btn('Add meeting',add,true)}</div></div>
 <p class="status">${rec.length} recorded · ${up.length} scheduled${up.some(u=>u.date<today())?` · <b class="w-overdue">${up.filter(u=>u.date<today()).length} overdue</b>`:''}</p>
 ${CD.filt('meetings',[['all','All',up.length+rec.length],['up','Scheduled',up.length],['rec','Recorded',rec.length]])}
 ${list.length?CD.table('meetings',[['Meeting'],['Date','',120],['Status','',120]],list.map(x=>({id:x.id,cells:[`${CD.dot(x.up?CD.cls(x.date):'ok')}<span class="nm">${cdE(x.label)}</span>${x.m?.type&&x.m.type!==x.label?`<div class="sub" style="margin-left:22px">${cdE(x.m.type)}</div>`:''}`,`<b>${cdE(CD.short(x.date))}</b> <span class="sub">${cdE(CD.dow(x.date))}</span>`,x.up?CD.word(CD.cls(x.date),x.date<today()?'Overdue':'Scheduled'):CD.word('ok','Recorded')]})),sel&&sel.id,detail):'<p class="empty">No meetings yet. Add one, or schedule a check-in from the Calendar.</p>'}`;
 return CD.layout(main,detail||'<p class="sub">Select a meeting to see its details.</p>');
};
/* ---------- Services ---------- */
CD.serviceEvents=[['vaccination','vacc-ready','Vaccination launch or scope change'],['vaccination','vacc-storage','Vaccine equipment issue or cold-chain breach'],['prescribing','prescribing-ready','Prescribing service or authority changed'],['complex','service-complex','Complex compounding scope changed'],['vaping','service-vaping','Vaping rules or service changed']];
CD.V.services=function(){
 const f=CD.st.f.services||'all';
 const st=id=>state.active.includes(id)?(state.serviceConfig?.[id]?.complete?['ok','Configured']:['soon','Setup incomplete']):['staff','Inactive'];
 const all=Object.entries(serviceGroups).flatMap(([g,ids])=>ids.map(id=>({id,g,name:serviceName(id),st:st(id)})));
 const list=all.filter(x=>f==='all'||(f==='active'?state.active.includes(x.id):!state.active.includes(x.id)));
 const sel=CD.pick('services',list);
 let detail='';
 if(sel){const active=state.active.includes(sel.id),revs=catalog().filter(a=>a.service===sel.id&&!a.eventOnly);
  /* "Start a review after a change": same behaviour as the v27 Services page (sets today's date if later or unset, then opens the review). */
  const events=active?CD.serviceEvents.filter(([s])=>s===sel.id):[];
  detail=`<div class="lbl">${cdE(sel.g)}</div><h2>${cdE(sel.name)}</h2>${CD.word(...sel.st)}
  ${revs.length?`<div class="blk"><div class="lbl" style="margin-bottom:4px">Reviews for this service</div><ul class="trail">${revs.map(a=>`<li><b>${state.schedule[a.id]?cdE(CD.short(state.schedule[a.id])):'—'}</b>${cdE(a.name)} · ${cdE(a.frequency||'')}</li>`).join('')}</ul></div>`:''}
  ${events.length?`<div class="blk"><div class="lbl" style="margin-bottom:6px">Start a review after a change</div><div class="acts">${events.map(([s,id,title])=>CD.btn(title,()=>{const n=clone();if(!n.schedule[id]||n.schedule[id]>today())n.schedule[id]=today();if(commit(n,'Event review requested · '+title))reviewEditor(id);})).join('')}</div></div>`:''}
  <div class="blk acts">${active?CD.btn('Configure',()=>configureService(sel.id),true)+CD.btn('Disable',()=>serviceDisable(sel.id)):CD.btn('Activate',()=>serviceActivate(sel.id),true)}</div>
  <div class="blk cd-sw"></div>`;}
 const main=`<h1>Services</h1><p class="status">${cdE(state.pharmacyName||'')} · ${state.active.length} active · <b class="w-soon">${state.active.filter(id=>!state.serviceConfig?.[id]?.complete).length} setup incomplete</b></p><p class="sub" style="margin:4px 0 0">Configured means your reported arrangements are saved. It doesn’t mean they’ve been verified, reviewed or approved.</p>
 ${CD.filt('services',[['all','All',all.length],['active','Active',state.active.length],['inactive','Inactive',all.length-state.active.length]])}
 ${Object.keys(serviceGroups).map(g=>{const rows=list.filter(x=>x.g===g);return rows.length?`<div class="sec">${cdE(g)}</div>${CD.table('services',[['Service'],['Status','',150],['Reviews','hide-m',80]],rows.map(x=>({id:x.id,cells:[`${CD.dot(x.st[0])}<span class="nm">${cdE(x.name)}</span>`,CD.word(...x.st),`<span class="sub">${catalog().filter(a=>a.service===x.id&&!a.eventOnly).length||'—'}</span>`]})),sel&&sel.id,detail)}`:'';}).join('')}`;
 return CD.layout(main,detail||'<p class="sub">Select a service.</p>');
};
/* ---------- Locations, backup & restore (sub-page of Pharmacy setup) ----------
   The app's own sections (site switcher, settings forms, storage panel, backup/restore, account copy) are built by
   RPH.locationsPage() and placed into the Concept D layout as they are, so their checks and saves are unchanged. */
CD.after=[];
CD.slot=(name,nodes)=>CD.after.push(()=>{const host=document.querySelector('#cd-view [data-slot="'+name+'"]');if(host)for(const n of nodes)if(n)host.append(n);});
CD.V.locations=function(){
 RPH.locationsPage();const m=$('main');
 const f=CD.st.f.loc||'sites';
 const addBtn=$('add-site'),storage=$('rph-storage-panel'),backup=$('portable-export')?.closest('section'),account=$('account-copy');
 const settings=[...m.querySelectorAll(':scope>details')];
 let sites=[];try{const dir=siteDirectory();sites=(dir.sites||[]).map(e=>{let name=state.pharmacyName;if(e.id!==dir.active){try{name=JSON.parse(localStorage.getItem(e.slot)).pharmacyName;}catch{name='Unavailable location';}}return {id:e.id,name:name||'New pharmacy',active:e.id===dir.active};});}catch{}
 let body='';
 if(f==='sites'){const sel=CD.pick('loc',sites);
  const detail=sel?`<div class="lbl">Pharmacy</div><h2>${cdE(sel.name)}</h2>${CD.word(sel.active?'ok':'staff',sel.active?'You’re viewing this pharmacy':'Separate records')}<div class="blk"><p style="margin:0;font-size:14px" class="muted">Each pharmacy keeps its own records on this device. Switching reloads the app with that pharmacy’s records.</p></div>${sel.active?'':`<div class="blk acts">${CD.btn('Switch to this pharmacy',()=>chooseSite(sel.id),true)}</div>`}`:'';
  body=`<div class="acts" style="margin-top:14px" data-slot="add-site"></div>${CD.table('loc',[['Pharmacy'],['Status','',200]],sites.map(x=>({id:x.id,cells:[`${CD.dot(x.active?'ok':'staff')}<span class="nm">${cdE(x.name)}</span>`,CD.word(x.active?'ok':'staff',x.active?'Current':'Switch to view')]})),sel&&sel.id,detail)}`;
  CD.slot('add-site',[addBtn]);CD.locDetail=detail;}
 else if(f==='backup'){body=`<div class="cd-legacy" data-slot="backup"></div>`;CD.slot('backup',[storage,backup,account]);}
 else {body=`<div class="cd-legacy" data-slot="settings"></div>`;CD.slot('settings',settings);}
 CD.after.push(()=>$('main').replaceChildren());
 const main=`<button class="verb" ${CD.a(()=>{CD.st.setupHost=false;render();})}>← Pharmacy setup</button><h1 style="margin-top:6px">Locations, backup &amp; restore</h1><p class="status">${sites.length} pharmac${sites.length===1?'y':'ies'} on this device · ${storageIssue?'<b class="w-overdue">saving unavailable · download a backup</b>':'saving on this device'}</p>
 ${CD.filt('loc',[['sites','Pharmacies',sites.length],['backup','Storage & backup',null],['settings','Settings',settings.length]])}${body}`;
 return f==='sites'?CD.layout(main,CD.locDetail||'<p class="sub">Select a pharmacy.</p>'):`<div class="main" style="max-width:900px">${main}</div>`;
};
/* ---------- History with its filters and exports ----------
   historyView() builds the app's own filter controls and the PDF/CSV export (which export exactly what the filters select).
   Those controls and buttons are placed into the Concept D page; the list below uses the same filter rule. */
CD.V.history=function(){
 historyView();const m=$('main');
 const qs=CD.st.f.history||'All Activity';
 const qb=[...m.querySelectorAll('.wq-tabs button')].find(b=>b.textContent===qs);if(qb&&qb.getAttribute('aria-pressed')!=='true')qb.click();
 const v=id=>($(id)?.value||'');
 const F={q:v('hist-q').trim().toLowerCase(),from:v('from'),end:v('through'),source:v('hist-source'),type:v('hist-type'),audit:v('hist-audit')};
 const rows=historyEntries();
 const list=rows.filter(r=>(qs==='All Activity'||r.source===qs||qs==='Audits'&&r.source==='Visits')&&(!F.from||r.day>=F.from)&&(!F.end||(r.day&&r.day<=F.end))&&['source','type','audit'].every(k=>!F[k]||F[k]===r[k])&&[r.title,r.type,r.source,r.id,JSON.stringify(r.record)].join(' ').toLowerCase().includes(F.q));
 const shown=list.slice(0,CD.st.histN||60).map(r=>({...r,id:r.key}));
 const sel=CD.pick('history',shown);
 const by=r=>CD.by(r.record)||r.record?.reviewer||'';
 const detail=sel?`<div class="lbl">${cdE(sel.source)} · ${cdE(sel.type)}</div><h2>${cdE(sel.title)}</h2>${CD.word('ok',sel.day?pretty(sel.day):'Undated')}<div class="blk kv">${by(sel)?`<span>By</span><span>${cdE(by(sel))}</span>`:''}${sel.record?.outcome||sel.record?.status?`<span>Outcome</span><span>${cdE(sel.record.outcome||sel.record.status)}</span>`:''}${sel.at?`<span>Saved</span><span>${cdE(new Date(sel.at).toLocaleString('en-AU'))}</span>`:''}</div><div class="blk acts">${CD.btn('Open record',()=>sel.open(),true)}</div>`:'';
 const c=k=>rows.filter(r=>k==='All Activity'||r.source===k||k==='Audits'&&r.source==='Visits').length;
 const search=$('hist-q')?.closest('label'),filters=['hist-source','hist-type','hist-audit','from','through','hist-pharmacy'].map(id=>$(id)?.closest('label')).filter(Boolean),exp=$('hist-export'),csv=$('hist-csv');
 if(search){search.classList.add('cd-histq');const i=search.querySelector('input');if(i){i.placeholder='Search history';i.setAttribute('aria-label','Search history');}}
 CD.slot('hist-search',[search]);CD.slot('hist-filters',filters);CD.slot('hist-exports',[exp,csv]);
 const active=Object.entries(F).filter(([k,x])=>x&&k!=='q').length;
 CD.after.push(()=>{for(const el of document.querySelectorAll('#cd-view [data-slot] input,#cd-view [data-slot] select'))el.addEventListener(el.type==='search'?'input':'change',()=>setTimeout(()=>{const id=el.id,pos=el.selectionStart;render();const n=$(id);if(n&&id==='hist-q'){n.focus();try{n.setSelectionRange(pos,pos);}catch{}}},0));});
 const main=`<div class="hd"><h1>History</h1><div class="tools" data-slot="hist-search"></div></div>
 <p class="status">${list.length} matching entries · records are kept on this device</p>
 ${CD.filt('history',['All Activity','Audits','Tasks','Meetings','Staff'].map(k=>[k,k==='All Activity'?'All':k,c(k)]))}
 <details class="cd-filters"${active?' open':''}><summary>Filters${active?' · '+active+' on':''}</summary><div class="cd-filtergrid" data-slot="hist-filters"></div></details>
 <div class="acts cd-exports" data-slot="hist-exports"><span class="sub">Export what's shown:</span></div>
 ${shown.length?CD.table('history',[['Record'],['Type','hide-m',150],['Date','',90],['By','hide-m',150]],shown.map(r=>({id:r.id,cells:[`<span class="nm">${cdE(r.title)}</span><div class="sub cd-histverb">${cdE(CD.histVerb?CD.histVerb(r):r.type)}</div>`,`<span class="sub">${cdE(r.type)}</span>`,cdE(r.day?CD.short(r.day):'—'),`<span class="sub">${cdE(by(r))}</span>`]})),sel&&sel.id,detail):'<p class="empty">No matching records.</p>'}
 ${list.length>shown.length?`<div class="acts" style="margin-top:12px">${CD.btn('Show more',()=>{CD.st.histN=(CD.st.histN||60)+60;render();})}</div>`:''}
 <p class="sub" style="margin-top:14px">Backups are in Pharmacy setup · Locations, backup &amp; restore.</p>`;
 return CD.layout(main,detail||'<p class="sub">Select a record.</p>');
};
CD.native.setup='setup';CD.native.meetings='meetings';CD.native.services='services';CD.native.history='history';
CD.key=()=>page==='staff-profile'?'person':CD.native[CD.cur()];
CD.isNative=function(){const key=CD.key();return !!(state.freshSite&&key&&!(key==='setup'&&editingIntervals));};
/* Old "Linked calendar record" route (Audits · Calendar tab) now opens the Calendar's Month view. */
CD.route=function(){if(page==='audits'&&reviewTab==='Calendar'){page='planner';CD.st.cal='Month';CD.st.day=calendarDay;CD.st.month=calendarDay.slice(0,7);reviewTab='Due Now';}if(page!=='history')CD.st.histFull=false;if(page!=='setup')CD.st.setupHost=false;};
/* ---------- hook into the app's render ---------- */
const cdRender=render;
/* Concept D pages are drawn by the new frontend only; the old screens are drawn only for pages still hosted
   (Pharmacy setup, a staff record, the policy library, History filters & exports, first use).
   Rendering never changes saved data in v27 (checked by tests/engine-side-effects.js); the storage warning and
   staff expiry check still run on every render. */
render=function(){
 CD.route();
 if(CD.isNative()){document.body.classList.toggle('first-use',!state.freshSite);document.querySelectorAll('.mobilebar,aside,nav').forEach(x=>{if(state.freshSite)x.removeAttribute('inert');else x.setAttribute('inert','');});try{RPH.storageBanner();}catch{}try{if(page==='staff'||page==='staff-profile')checkStaffExpiry(true);}catch{}$('main').replaceChildren();}
 else cdRender();
 try{CD.paint();}catch(e){console.error('Concept D frontend',e);}
};
/* The old Calendar view inside the hidden page area is no longer needed. */
plannerView=function(){};
/* Jump search: keep the existing palette, add Concept D pages */
const cdJump=D.jump;D.jump=function(){cdJump();};
if(D.phone)D.applyView(true);
render();

/* ---------- Onboarding as one focused page (UAT note 19 Nov: "I can see the rest of the app behind") ----------
   Setup steps (pharmacy details, proprietors, services, each service's questions, completion) open full screen
   on a clean page. Other editors keep the side panel. */
CD.FOCUS_TITLES=['Pharmacy details','Proprietors','Services provided','Service setup complete','Pharmacy setup complete','Initial review schedules','Review due dates'];
CD.focusize=function(){
 const ed=$('editor');if(!ed.open){ed.classList.remove('cd-focus');return;}
 const t=(ed.querySelector('#dialog-title')?.textContent||'').trim();
 const on=CD.FOCUS_TITLES.includes(t)||!!ed.querySelector('.rph-question')||!!ed.querySelector('#express-choice');
 ed.classList.toggle('cd-focus',on&&!ed.classList.contains('cd-audit'));
 if(on&&!ed.querySelector('.cd-focus-brand')){const b=D.el('div',{class:'cd-focus-brand'});b.append(D.el('b',{text:'R.'}),D.el('span',{text:'Pharmacy setup'+(state.pharmacyName?' · '+state.pharmacyName:'')}));ed.prepend(b);}
};
new MutationObserver(()=>CD.focusize()).observe($('editor'),{childList:true,attributes:true,attributeFilter:['open']});
