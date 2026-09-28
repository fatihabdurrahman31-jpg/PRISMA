import { env } from 'cloudflare:workers';

export function getD1() {
  if (!env.DB) throw new Error('D1 DB binding unavailable');
  return env.DB;
}
