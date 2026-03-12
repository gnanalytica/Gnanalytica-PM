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
 * GET /api/dashboard/layouts
 * List all layouts for current user
 * Query params: ?isDefault=true to get default layout
 */
export async function GET(req: NextRequest) {
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

    const isDefault = req.nextUrl.searchParams.get("isDefault") === "true";
    let query = supabase
      .from("dashboard_layouts")
      .select("*")
      .eq("user_id", user.id);

    if (isDefault) {
      query = query.eq("is_default", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching dashboard layouts:", error);
      return NextResponse.json(
        { error: "Failed to fetch layouts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ layouts: data || [] }, { status: 200 });
  } catch (err) {
    console.error("Dashboard layouts GET error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/layouts
 * Create new layout
 * Body: { name?: string, widgets: Widget[], userRole?: string }
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name = "My Dashboard", widgets = [], userRole = "user" } = body;

    // Validate widgets
    if (!Array.isArray(widgets)) {
      return NextResponse.json(
        { error: "Invalid widgets format" },
        { status: 400 }
      );
    }

    // Check if user has a default layout
    const { data: existingLayouts } = await supabase
      .from("dashboard_layouts")
      .select("is_default")
      .eq("user_id", user.id);

    const hasDefault = (existingLayouts || []).some((l: any) => l.is_default);
    const isDefault = !hasDefault;

    // Create layout
    const { data, error } = await supabase
      .from("dashboard_layouts")
      .insert({
        user_id: user.id,
        name,
        widgets,
        user_role: userRole,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating dashboard layout:", error);
      return NextResponse.json(
        { error: "Failed to create layout" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Dashboard layouts POST error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/layouts/:id
 * Update existing layout
 * Body: { widgets: Widget[], name?: string }
 */
export async function PUT(req: NextRequest) {
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

    // Extract ID from URL
    const segments = req.nextUrl.pathname.split("/");
    const layoutId = segments[segments.length - 1];

    if (!layoutId) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { widgets, name } = body;

    // Validate widgets if provided
    if (widgets !== undefined && !Array.isArray(widgets)) {
      return NextResponse.json(
        { error: "Invalid widgets format" },
        { status: 400 }
      );
    }

    // Check ownership
    const { data: layout, error: fetchError } = await supabase
      .from("dashboard_layouts")
      .select("user_id")
      .eq("id", layoutId)
      .single();

    if (fetchError || !layout) {
      return NextResponse.json(
        { error: "Layout not found" },
        { status: 404 }
      );
    }

    if (layout.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update layout
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (widgets !== undefined) updateData.widgets = widgets;
    if (name !== undefined) updateData.name = name;

    const { data, error } = await supabase
      .from("dashboard_layouts")
      .update(updateData)
      .eq("id", layoutId)
      .select()
      .single();

    if (error) {
      console.error("Error updating dashboard layout:", error);
      return NextResponse.json(
        { error: "Failed to update layout" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Dashboard layouts PUT error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/layouts/:id
 * Delete layout
 * Prevent deleting default layout (return 409 Conflict)
 */
export async function DELETE(req: NextRequest) {
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

    // Extract ID from URL
    const segments = req.nextUrl.pathname.split("/");
    const layoutId = segments[segments.length - 1];

    if (!layoutId) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    // Check ownership and default status
    const { data: layout, error: fetchError } = await supabase
      .from("dashboard_layouts")
      .select("user_id, is_default")
      .eq("id", layoutId)
      .single();

    if (fetchError || !layout) {
      return NextResponse.json(
        { error: "Layout not found" },
        { status: 404 }
      );
    }

    if (layout.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (layout.is_default) {
      return NextResponse.json(
        { error: "Cannot delete default layout" },
        { status: 409 }
      );
    }

    // Delete layout
    const { error } = await supabase
      .from("dashboard_layouts")
      .delete()
      .eq("id", layoutId);

    if (error) {
      console.error("Error deleting dashboard layout:", error);
      return NextResponse.json(
        { error: "Failed to delete layout" },
        { status: 500 }
      );
    }

    return NextResponse.json({}, { status: 204 });
  } catch (err) {
    console.error("Dashboard layouts DELETE error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
