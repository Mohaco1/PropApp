/* ===== In-app confirm when the browser's confirm box is blocked (20 Nov 2026) =====
 * The claude.ai artifact viewer (and other sandboxed frames) silently answer "no" to window.confirm().
 * When that happens (a "no" in under 60 ms, faster than any person), the same question is shown in an
 * in-app dialog. "Yes" repeats the action the person started (the same click, or closing the window
 * they pressed Escape on), and the repeated confirm() answers yes once for that exact question.
 * Where the browser box works, nothing changes.
 */
(()=>{
 const nativeConfirm=window.confirm.bind(window);let last=null;const approved=new Map();
 document.addEventListener('click',e=>{if(!e.target.closest?.('#rph-confirm'))last={type:'click',target:e.target};},true);
 document.addEventListener('cancel',e=>{if(e.target.id!=='rph-confirm')last={type:'cancel',target:e.target};},true);
 function ask(message,onYes){
  let d=document.getElementById('rph-confirm');
  if(!d){d=document.createElement('dialog');d.id='rph-confirm';d.setAttribute('aria-labelledby','rph-confirm-text');
   d.innerHTML='<p id="rph-confirm-text"></p><div class="rph-confirm-row"><button type="button" class="rph-confirm-no">Cancel</button><button type="button" class="rph-confirm-yes">Yes, continue</button></div>';
   const st=document.createElement('style');st.textContent='#rph-confirm{border:1px solid #d5d9e2;border-radius:14px;padding:20px;max-width:420px;width:calc(100% - 32px);box-shadow:0 20px 60px rgba(15,23,42,.25);font:inherit;color:#111827}#rph-confirm::backdrop{background:rgba(15,23,42,.35)}#rph-confirm p{margin:0 0 16px;font-size:16px;line-height:1.45;white-space:pre-line}#rph-confirm .rph-confirm-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}#rph-confirm button{min-height:44px;padding:0 16px;border-radius:10px;border:1px solid #d5d9e2;background:#f3f4f6;font:inherit;font-weight:600;cursor:pointer}#rph-confirm .rph-confirm-yes{background:#111827;color:#fff;border-color:#111827}';
   document.head.append(st);document.body.append(d);}
  d.querySelector('#rph-confirm-text').textContent=message;
  const yes=d.querySelector('.rph-confirm-yes'),no=d.querySelector('.rph-confirm-no');
  yes.onclick=()=>{d.close();onYes();};no.onclick=()=>d.close();
  if(!d.open)d.showModal();yes.focus();
 }
 window.confirm=function(message){
  message=String(message??'');
  const ok=approved.get(message);if(ok&&Date.now()-ok<5000){approved.delete(message);return true;}
  const t=performance.now(),answer=nativeConfirm(message);
  if(answer||performance.now()-t>60)return answer;
  const ev=last;
  ask(message,()=>{approved.set(message,Date.now());
   if(/^Some changes have not been saved/.test(message)){location.reload();return;}
   if(ev?.type==='cancel'&&ev.target?.open){ev.target.close();return;}
   const el=ev?.target?.closest?.('button,a,[role=button],summary')||ev?.target;
   if(ev?.type==='click'&&el?.isConnected){el.click();return;}
   approved.delete(message);if(typeof notify==='function')notify('Please do that again.');});
  return false;
 };
 window.RPH_confirmFallback=true;
})();
