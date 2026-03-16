import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    `Missing Supabase environment variables: URL=${!!supabaseUrl}, Key=${!!supabaseServiceKey}`,
  );
}

// Use service role key to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName } = await request.json();

    console.log("Signup request data:", {
      email,
      username,
      displayName,
      password_length: password?.length,
    });

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Create auth user (email confirmation disabled in Supabase settings)
    let { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
      });

    // If user already exists, try to confirm their email
    if (authError && authError.message.includes("already exists")) {
      // Get the existing user by listing users and filtering
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === email);

      if (existingUser) {
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
        });

        // Manually confirm email by updating auth.users table directly
        try {
          await supabaseAdmin.rpc("confirm_email", {
            user_id: existingUser.id,
          });
        } catch (err) {
          // If RPC doesn't exist, that's ok
          console.warn("RPC confirm_email not available:", err);
        }

        authData = { user: existingUser };
        authError = null;
      }
    }

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400, headers: corsHeaders },
      );
    }

    // Ensure user was created
    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500, headers: corsHeaders },
      );
    }

    // Create profile using service role
    console.log("Creating profile with normalized username:", {
      user_id: authData.user!.id,
      username: normalizedUsername,
      display_name: displayName,
    });

    // Insert profile directly with service role (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authData.user!.id,
        username: normalizedUsername,
        display_name: displayName,
      });

    console.log("Profile insert result:", {
      error: profileError,
      errorMessage: profileError?.message,
      errorCode: profileError?.code,
    });

    if (profileError) {
      console.error("Profile insert error details:", {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500, headers: corsHeaders },
      );
    }

    console.log("Profile created successfully for user:", authData.user!.id);

    return NextResponse.json(
      {
        user: authData.user!,
        message: "Account created successfully",
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
