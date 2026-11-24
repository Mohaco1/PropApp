/* ===== Compact activity history (owner: "looks horrible", 20 Nov 2026) =====
 * One short line per event: date and time (no seconds) · who, then the event in one or two lines.
 * Long events (e.g. a whole checklist) fold behind "Show more". The record itself is unchanged.
 */
RPH.tidy={};
RPH.tidy.activity=function(){const box=$('task-activity');if(!box)return;
 for(const p of [...box.querySelectorAll(':scope>p:not([data-tidy])')]){p.dataset.tidy='1';
  const parts=p.textContent.split(' · '),when=(parts.shift()||'').replace(/(\d{1,2}:\d{2}):\d{2}/,'$1'),who=parts.shift()||'',msg=parts.join(' · ');
  const row=D.el('div',{class:'act-row'});row.append(D.el('span',{class:'act-when',text:when+(who?' · '+who:'')}));
  const m=D.el('span',{class:'act-msg'});const long=msg.length>140;m.textContent=long?msg.slice(0,140).replace(/\s+\S*$/,'')+'…':msg;row.append(m);
  if(long){const b=D.el('button',{type:'button',class:'act-more',text:'Show more'});b.onclick=()=>{const open=b.textContent==='Show more';m.textContent=open?msg:msg.slice(0,140).replace(/\s+\S*$/,'')+'…';b.textContent=open?'Show less':'Show more';};row.append(b);}
  p.replaceWith(row);}};
new MutationObserver(()=>RPH.tidy.activity()).observe($('editor'),{childList:true,subtree:true});
