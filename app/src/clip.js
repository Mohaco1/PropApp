// One Copy helper for every Copy button (F-P06-01). The clipboard API first; where it's missing or refused (the app
// file opened from the phone's files, file://), a hidden text box and the older copy command. Returns true if copied.
export async function copyText(t) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(String(t)); return true; } } catch {}
  const ta = document.createElement('textarea');
  ta.value = String(t); ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(ta); const keep = document.activeElement;
  try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); return document.execCommand('copy') === true; }
  catch { return false; } finally { ta.remove(); keep?.focus?.({ preventScroll: true }); }
}
