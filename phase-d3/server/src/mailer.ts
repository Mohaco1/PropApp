// Sign-in email. Production sends through Amazon SES v2 in Sydney (ap-southeast-2), signed with AWS Signature V4
// using node:crypto and the built-in fetch (no SDK). Tests use the in-memory sink.
import { createHash, createHmac } from 'node:crypto';

export interface Mail { to: string; subject: string; text: string }
export interface Mailer { send(m: Mail): Promise<void> }
export interface MemoryMailer extends Mailer { outbox: Mail[] }

export const memoryMailer = (): MemoryMailer => {
  const outbox: Mail[] = [];
  return { outbox, async send(m) { outbox.push(m); } };
};

const h256 = (s: string) => createHash('sha256').update(s).digest('hex');
const hm = (k: Buffer | string, s: string) => createHmac('sha256', k).update(s).digest();

export interface SigV4Input { method: string; host: string; path: string; region: string; service: string; body: string; accessKeyId: string; secretAccessKey: string; sessionToken?: string; now: Date }
// AWS Signature Version 4 for a JSON request with no query string.
export function signV4(i: SigV4Input): Record<string, string> {
  const amzDate = i.now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const headers: Record<string, string> = { 'content-type': 'application/json', host: i.host, 'x-amz-content-sha256': h256(i.body), 'x-amz-date': amzDate };
  if (i.sessionToken) headers['x-amz-security-token'] = i.sessionToken;
  const names = Object.keys(headers).sort();
  const canonicalReq = [i.method, i.path, '', names.map(n => n + ':' + headers[n].trim() + '\n').join(''), names.join(';'), headers['x-amz-content-sha256']].join('\n');
  const scope = `${day}/${i.region}/${i.service}/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, h256(canonicalReq)].join('\n');
  const kSigning = hm(hm(hm(hm('AWS4' + i.secretAccessKey, day), i.region), i.service), 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(toSign).digest('hex');
  return { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${i.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}` };
}

export interface SesConfig { from: string; accessKeyId: string; secretAccessKey: string; sessionToken?: string; region?: string; fetch?: typeof fetch; clock?: () => number }
export function sesMailer(c: SesConfig): Mailer {
  const region = c.region || 'ap-southeast-2';
  const host = `email.${region}.amazonaws.com`;
  const path = '/v2/email/outbound-emails';
  const doFetch = c.fetch || fetch;
  return {
    async send(m) {
      const body = JSON.stringify({ FromEmailAddress: c.from, Destination: { ToAddresses: [m.to] }, Content: { Simple: { Subject: { Data: m.subject, Charset: 'UTF-8' }, Body: { Text: { Data: m.text, Charset: 'UTF-8' } } } } });
      const headers = signV4({ method: 'POST', host, path, region, service: 'ses', body, accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, sessionToken: c.sessionToken, now: new Date(c.clock ? c.clock() : Date.now()) });
      delete headers.host; // fetch sets it
      const r = await doFetch(`https://${host}${path}`, { method: 'POST', headers, body });
      if (!r.ok) throw new Error('ses_status_' + r.status);
    },
  };
}
