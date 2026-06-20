import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getKid, getPrivateKey, getPublicKey } from './keys';
import { ACCESS_TOKEN_TTL_SECONDS, JWT_ALGORITHM } from './config';

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  client_id: string;
  scope: string;
}

export async function signAccessToken(opts: {
  userId: string;
  clientId: string;
  scope: string;
  issuer: string;
  audience: string;
}): Promise<{ token: string; expiresIn: number }> {
  const privateKey = await getPrivateKey();
  const kid = getKid();
  const token = await new SignJWT({
    client_id: opts.clientId,
    scope: opts.scope,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, kid, typ: 'at+jwt' })
    .setSubject(opts.userId)
    .setIssuer(opts.issuer)
    .setAudience(opts.audience)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(privateKey);
  return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function verifyAccessToken(
  token: string,
  expectedAudience: string,
): Promise<AccessTokenClaims> {
  const publicKey = await getPublicKey();
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: [JWT_ALGORITHM],
    audience: expectedAudience,
  });
  if (typeof payload.sub !== 'string' || typeof payload.client_id !== 'string') {
    throw new Error('Invalid token payload');
  }
  return payload as AccessTokenClaims;
}
