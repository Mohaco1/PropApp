// Small shared helpers. Every piece of text that reaches the page goes through esc() or the h`` tag.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// h`<p>${x}</p>`: interpolations are escaped unless wrapped with raw().
const RAW = Symbol('raw');
export const raw = s => ({ [RAW]: true, s: String(s ?? '') });
export function h(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += part(v) + strings[i + 1]; });
  return raw(out);
}
function part(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(part).join('');
  if (typeof v === 'object' && v[RAW]) return v.s;
  return esc(v);
}
export const html = v => part(v);
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
export const clone = o => JSON.parse(JSON.stringify(o));
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const byDate = (a, b) => (a || '9999').localeCompare(b || '9999');
