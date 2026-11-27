// Production entry (bundled to dist/server.mjs). Configuration comes only from the environment (Fly secrets).
import { createServerApp, sesMailer, memoryMailer } from './app.ts';

const env = process.env;
const need = (k: string) => { const v = env[k]; if (!v) { process.stderr.write(JSON.stringify({ level: 'error', event: 'missing_env', reason: k }) + '\n'); process.exit(1); } return v; };

const mailer = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.MAIL_FROM
  ? sesMailer({ from: env.MAIL_FROM, accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, sessionToken: env.AWS_SESSION_TOKEN, region: env.SES_REGION || 'ap-southeast-2' })
  : env.ALLOW_MEMORY_MAILER === '1' ? memoryMailer() : (need('SES_CREDENTIALS_AND_MAIL_FROM'), memoryMailer());

const app = createServerApp({
  dbPath: env.DB_PATH || '/data/pharmledger.db',
  emailIndexKey: need('EMAIL_INDEX_HMAC_KEY'),
  logHmacKey: need('LOG_HMAC_KEY'),
  appUrl: env.APP_URL || 'https://mohaco1.github.io/PropApp/',
  trustProxy: env.TRUST_PROXY !== '0',
  mailer,
});

app.listen(Number(env.PORT || 8080), env.HOST || '0.0.0.0').catch(() => process.exit(1));
const stop = () => { app.close().then(() => process.exit(0)); setTimeout(() => process.exit(0), 8000).unref(); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
