/* ===== Plain words, one name per thing (design review #3 and #6, owner approved 20 Nov 2026) =====
 * Display only: rewrites the words people see. Saved data, history entries, exports and the logic that
 * reads labels are unchanged. Typed text (inputs, text areas) and the UAT notes panel are never touched.
 *   Task → Action · Audit → Review (not "self-audit") · Overview → Today
 *   Cadence → How often · Source → Set by · Basis → Why it's here (in detail panels)
 *   § / § Legal / Legal → Legal limit
 *   Verify → Check (buttons) / Check later (review answer) · to verify → to check
 *   Review buttons: Save and next → Next · Save & finish later → Finish later · Review & complete → Finish review
 */
RPH.words={};
RPH.words.EXACT={'Overview':'Today','§':'Required by law','§ Legal':'Required by law','Legal':'Required by law','Legal limit':'Required by law','To verify':'To check','Verify':'Check',
 'Save and next':'Next','Save & finish later':'Finish later','Save & Finish Later':'Finish later','Review & complete':'Finish review',
 'Tasks':'Actions','Task':'Action','Audits':'Reviews','Audit':'Review'};
RPH.words.KV={'Cadence':'How often','Source':'Set by','Basis':'Why it’s here'};
RPH.words.RULES=[
 [/\b([Aa]) (Task|task|Audit|audit)\b/g,(m,a,w)=>(a==='A'?'An ':'an ')+(w[0]==='T'?'Action':w[0]==='t'?'action':w[0]==='A'?'Review':'review')],
 [/\b[Aa]n audit\b/g,m=>m[0]+' review'],
 [/\bTasks\b/g,'Actions'],[/\bTask\b/g,'Action'],[/\btasks\b/g,'actions'],[/\btask\b/g,'action'],
 [/\bAudits\b/g,'Reviews'],[/\bAudit\b/g,'Review'],[/(?<!self-)\baudits\b/g,'reviews'],[/(?<!self-)\baudit\b/g,'review'],
 [/\b(\d+) to verify\b/g,'$1 to check'],[/\bTo verify\b/g,'To check'],
 [/\bYour reported arrangements are saved\./g,'Your answers are saved.'],[/\breported arrangements saved\b/g,'answers saved'],[/^Saved reported arrangements · /g,'Saved · '],
 [/§ legal or external date\./g,'Legal limit: a date set by law or by someone outside the pharmacy.']
];
RPH.words.skip=el=>!!el.closest('input,textarea,select,script,style,[contenteditable=""],[contenteditable=true],#uat-dlg,.uat-q,.cd-raw');
RPH.words.fix=function(node){
 if(node.nodeType!==3)return;const el=node.parentElement;if(!el||RPH.words.skip(el))return;
 const raw=node.nodeValue,t=raw.trim();if(!t)return;let out=raw;
 if(Object.hasOwn(RPH.words.KV,t)&&el.closest('.kv'))out=raw.replace(t,RPH.words.KV[t]);
 else if(t==='Basis'&&el.closest('.lbl,.sec,.why'))out=raw.replace(t,RPH.words.KV.Basis);
 else if(t==='Verify'&&el.closest('#editor')&&(!el.closest('button')||el.closest('.rph-seg')))out=raw.replace(t,'Check later');
 else if(Object.hasOwn(RPH.words.EXACT,t))out=raw.replace(t,RPH.words.EXACT[t]);
 else for(const [re,to] of RPH.words.RULES)out=out.replace(re,to);
 if(out!==raw)node.nodeValue=out;
};
RPH.words.walk=function(root){
 if(!root)return;if(root.nodeType===3)return RPH.words.fix(root);if(root.nodeType!==1||RPH.words.skip(root))return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))RPH.words.fix(n);
 for(const e of root.querySelectorAll?.('[aria-label],[title],[placeholder]')||[])for(const a of ['aria-label','title','placeholder']){const v=e.getAttribute(a);if(!v||RPH.words.skip(e)&&a!=='aria-label')continue;let o=v;for(const [re,to] of RPH.words.RULES)o=o.replace(re,to);if(o!==v)e.setAttribute(a,o);}
};
(()=>{let busy=false;const obs=new MutationObserver(ms=>{if(busy)return;busy=true;try{for(const m of ms){if(m.type==='characterData')RPH.words.fix(m.target);else for(const n of m.addedNodes)RPH.words.walk(n);}}finally{busy=false;}});
 obs.observe(document.body,{subtree:true,childList:true,characterData:true});RPH.words.walk(document.body);
 // Mutations from our own rewrites are delivered later; fix() is idempotent, so a second pass changes nothing.
})();
