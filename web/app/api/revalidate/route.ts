import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");
  const token = request.nextUrl.searchParams.get("token");

  // Optional: Simple security check
  if (process.env.REVALIDATE_TOKEN && token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ message: "Missing tag param" }, { status: 400 });
  }

  if (tag === "all") {
    revalidateTag("products", "max");
    revalidateTag("categories", "max");
    revalidateTag("brands", "max");
    return NextResponse.json({
      revalidated: true,
      type: "all",
      now: Date.now(),
    });
  }

  revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
