import type { RequestContext } from '@vercel/edge';

export const config = {
  matcher: ['/((?!_vercel|favicon\\.ico|icons\\.svg).*)'],
};

const COOKIE = '__site_auth';
const COOKIE_MAX = 60 * 60 * 24 * 7; // 7 days

export default async function middleware(
  request: Request,
  _ctx: RequestContext
): Promise<Response | undefined> {
  const password = process.env.SITE_PASSWORD?.trim();
  if (!password) return undefined;

  const url = new URL(request.url);
  const cookie = parseCookie(request.headers.get('cookie') ?? '', COOKIE);

  if (cookie === password) return undefined;

  if (request.method === 'POST') {
    const form = await request.formData();
    const submitted = form.get('password') as string;
    if (submitted === password) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: url.pathname,
          'Set-Cookie': `${COOKIE}=${password}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX}`,
        },
      });
    }
    return loginPage(true);
  }

  return loginPage(false);
}

function parseCookie(header: string, name: string): string | undefined {
  return header
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1];
}

function loginPage(wrongPassword: boolean): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Portfolio Tracker</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #030712; color: #f9fafb; font-family: system-ui, -apple-system, sans-serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 1rem; padding: 2rem;
            width: 100%; max-width: 360px; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; letter-spacing: -0.01em; }
    input { width: 100%; background: #1f2937; border: 1px solid #374151; border-radius: 0.5rem;
            padding: 0.625rem 1rem; font-size: 0.875rem; color: #f9fafb; outline: none;
            margin-bottom: 0.75rem; }
    input:focus { border-color: #3b82f6; }
    button { width: 100%; background: #2563eb; color: #fff; font-weight: 500; border: none;
             border-radius: 0.5rem; padding: 0.625rem 1rem; font-size: 0.875rem; cursor: pointer; }
    button:hover { background: #3b82f6; }
    .error { color: #f87171; font-size: 0.8rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Portfolio Tracker</h1>
    <form method="POST">
      <input type="password" name="password" placeholder="Password" autofocus />
      <button type="submit">Unlock</button>
      ${wrongPassword ? '<p class="error">Incorrect password.</p>' : ''}
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
