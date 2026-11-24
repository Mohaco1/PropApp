/* ===== Backups accept the answers setup actually saves (found 20 Nov 2026, also in v27) =====
 * The backup check only accepted a single answer from each question's original option list, so a backup
 * failed ("Invalid service procedure configuration") as soon as a setup answer had more than one tick,
 * an "Other (describe)" answer, or one of the newer options. The check now accepts exactly what the setup
 * cards can save, and still rejects anything else:
 *   - each ticked part must be a known option for that question (current list, original list or an old
 *     value that is mapped on read), or "Option: description" where that option asks for a description;
 *   - checklist answers must be known checklist items (or "None confirmed yet");
 *   - "Needs verification" is always allowed; free-text questions accept any text up to 220 characters.
 * Everything else in the backup is still checked by the existing rules.
 */
RPH.bk={};
RPH.bk.valid=function(id,f,v,answers={}){
 if(typeof v!=='string'||v.length>220)return false;if(v==='Needs verification')return true;
 const k=f[0],m=RPH.qm.metaFor(id,k);
 if(m.type==='checklist'){const items=new Set(RPH.qm.checkItems?RPH.qm.checkItems(id,k,answers).map(i=>i.v):[]);return v==='None confirmed yet'||RPH.qm.split(v).every(p=>items.has(p)||items.size===0);}
 const known=new Set([...(f[2]||[]),...(RPH.qm.optionsFor(id,f)||[]),...Object.keys(m.legacy||{}),...Object.values(m.legacy||{}).flatMap(x=>RPH.qm.split(x))]);
 if(!known.size)return true;
 if(known.has(v))return true;
 return RPH.qm.split(v).every(p=>{if(known.has(p))return true;const i=p.indexOf(':');if(i<=0)return false;const base=p.slice(0,i).trim();return known.has(base)&&RPH.qm.describes(id,k,base)&&p.slice(i+1).trim().length>0;});
};
const bkValidate=validateBackup;
validateBackup=function(input){
 const saved={};
 for(const id of Object.keys(sopFields)){const rows=sopFields[id];if(!Array.isArray(rows))continue;saved[id]=rows;sopFields[id]=rows.map(f=>f[2]?[f[0],f[1],null,...f.slice(3)]:f);}
 let out;try{out=bkValidate(input);}finally{for(const [id,rows] of Object.entries(saved))sopFields[id]=rows;}
 const data=(out&&out.data)||(input&&input.data)||{};
 for(const [id,c] of Object.entries(data.serviceConfig||{})){const a=c?.procedureProfile?.answers;if(!a)continue;const fields=sopFieldsFor(id);
  for(const [k,v] of Object.entries(a)){const f=fields.find(x=>x[0]===k);if(!f||sopIsSoftware(k))continue;if(!RPH.bk.valid(id,f,v,a))throw new Error('Invalid service procedure configuration.');}}
 return out;
};
