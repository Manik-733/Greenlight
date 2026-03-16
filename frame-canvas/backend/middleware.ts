import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://greenlight-4jt7-efvrx64bu-manik-singhs-projects.vercel.app",
  "https://greenlight-4jt7.vercel.app",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Check if origin is allowed (allow all for now since we have * in CORS)
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) || true;

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
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

  // For other requests, add CORS headers
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin || "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
