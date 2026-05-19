import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production',
);

export async function signToken(user) {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
}
