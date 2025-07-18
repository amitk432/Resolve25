import { NextResponse } from 'next/server';

let AuthenticationClient;
if (typeof window === 'undefined') {
  // Only import on server side
  AuthenticationClient = require('auth0').AuthenticationClient;
}

const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', ''),
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!
});

export async function POST(req: Request) {
  const { email, password } = await req.json();
  try {
    const response = await auth0.passwordGrant({
      username: email,
      password,
      scope: 'openid profile email'
    });
    // You may want to set a secure cookie here
    return NextResponse.json({ token: response.access_token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid credentials' }, { status: 401 });
  }
}
