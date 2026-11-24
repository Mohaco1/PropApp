// One Copy helper for every Copy button (F-P06-01). The clipboard API first; where it's missing or refused (the app
// file opened from the phone's files, file://), a hidden text box and the older copy command. Returns true if copied.
export async function copyText(t) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(String(t)); return true; } } catch {}
  // F-P06-02: off-screen (not 1 px or transparent, which older iOS Safari won't copy from), 16 px so iOS doesn't zoom,
  // and briefly editable so iOS lets the selection be made.
  const ta = document.createElement('textarea');
  ta.value = String(t); ta.setAttribute('aria-hidden', 'true'); ta.tabIndex = -1;
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
  document.body.appendChild(ta); const keep = document.activeElement;
  try { ta.contentEditable = 'true'; ta.readOnly = false; ta.focus({ preventScroll: true }); ta.select(); ta.setSelectionRange(0, 999999);
    return document.execCommand('copy') === true; }
  catch { return false; } finally { ta.remove(); keep?.focus?.({ preventScroll: true }); }
}
