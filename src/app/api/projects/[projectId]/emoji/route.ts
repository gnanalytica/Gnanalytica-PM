import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server component — ignore
          }
        },
      },
    },
  );
}

/**
 * PATCH /api/projects/:projectId/emoji
 * Update project emoji
 * Body: { emojiSlug: string }  // e.g., "rocket", "chart", "people"
 * Verify user owns project (via workspace membership)
 * Return: Updated project with emoji_slug
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await getServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { emojiSlug } = body;

    if (!emojiSlug || typeof emojiSlug !== "string") {
      return NextResponse.json(
        { error: "emojiSlug is required and must be a string" },
        { status: 400 }
      );
    }

    // Verify user has access to the project (via workspace membership or project ownership)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is project creator or project member
    const { data: membership } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    if (project.created_by !== user.id && !membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update project emoji
    const { data, error } = await supabase
      .from("projects")
      .update({ emoji_slug: emojiSlug })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project emoji:", error);
      return NextResponse.json(
        { error: "Failed to update project emoji" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Project emoji PATCH error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
