import { importPKCS8, importSPKI, exportJWK, type JWK, type KeyObject } from 'jose';
import { JWT_ALGORITHM } from './config';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v.replace(/\\n/g, '\n');
}

let cachedPrivate: KeyObject | undefined;
let cachedPublic: KeyObject | undefined;
let cachedJwks: { keys: JWK[] } | undefined;

export async function getPrivateKey(): Promise<KeyObject> {
  if (cachedPrivate) return cachedPrivate;
  const pem = requireEnv('OAUTH_PRIVATE_KEY');
  cachedPrivate = (await importPKCS8(pem, JWT_ALGORITHM)) as KeyObject;
  return cachedPrivate;
}

export async function getPublicKey(): Promise<KeyObject> {
  if (cachedPublic) return cachedPublic;
  const pem = requireEnv('OAUTH_PUBLIC_KEY');
  cachedPublic = (await importSPKI(pem, JWT_ALGORITHM)) as KeyObject;
  return cachedPublic;
}

export function getKid(): string {
  return requireEnv('OAUTH_KID');
}

export async function getJwks(): Promise<{ keys: JWK[] }> {
  if (cachedJwks) return cachedJwks;
  const publicKey = await getPublicKey();
  const jwk = await exportJWK(publicKey);
  jwk.kid = getKid();
  jwk.alg = JWT_ALGORITHM;
  jwk.use = 'sig';
  cachedJwks = { keys: [jwk] };
  return cachedJwks;
}
