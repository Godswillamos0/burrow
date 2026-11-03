import { NextRequest, NextResponse } from 'next/server';
import { BURROW_CONFIG } from '@/lib/config';

interface RouteProps {
  params: {
    code: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const code = params.code;
  const url = req.nextUrl.clone();
  url.pathname = '/';

  const response = NextResponse.redirect(url);

  if (code) {
    response.cookies.set(BURROW_CONFIG.referral.cookieName, code, {
      maxAge: BURROW_CONFIG.referral.cookieMaxAge,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return response;
}
