import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
  }

  try {
    // Collect cookies to set from Supabase
    const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      },
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("exchangeCodeForSession error:", {
        message: error.message,
        status: error.status,
        code,
      });
      return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
    }

    if (!data?.session) {
      console.error("No session returned from exchangeCodeForSession");
      return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
    }

    // Successful auth - create redirect response with cookies
    const response = NextResponse.redirect(new URL("/dashboard", origin));

    // Apply all cookies Supabase collected
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
  }
}
