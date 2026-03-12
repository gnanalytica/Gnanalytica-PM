import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  try {
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            } catch (err) {
              console.error("Cookie set error:", err);
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
    }

    // Successful auth - redirect to dashboard
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", origin));

    // Manually copy set-cookie headers if they exist
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    setCookieHeaders.forEach(cookie => {
      redirectResponse.headers.append("set-cookie", cookie);
    });

    return redirectResponse;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
  }
}
