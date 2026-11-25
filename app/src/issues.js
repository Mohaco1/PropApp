// R03: one rule for "is this answer an issue?", used by History, the CSV, the evidence pack and the record view.
// New answers carry their own isIssue flag (set from the question's definition when saved). Older ones are judged by
// their review's own question definitions; only if the question can't be matched is a fixed list of issue words used.
// "Yes" is never an issue on its own: on some questions it is the good answer (e.g. vaccine fridge records kept).
import { questionsFor } from './views/reviews.js';
const FALLBACK = /^(Issue|Outstanding|Gap identified|Unable to verify|Incomplete|Completed with issues|Not yet|Fault or gap|issue)$/;
export function answerIsIssue(rec, a) {
  if (typeof a?.isIssue === 'boolean') return a.isIssue;
  if (rec.kind === 'review' || rec.kind === undefined) {
    const qs = questionsFor(rec.type), q = qs.find(x => x.text === a.text) || null;
    const o = q?.options.find(x => x.value === a.answer); if (o) return !!o.issue;
  }
  return FALLBACK.test(String(a?.answer || ''));
}
export const issueCount = rec => (rec.answers || []).filter(a => answerIsIssue(rec, a)).length;
