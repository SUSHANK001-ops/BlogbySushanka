import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/likes/post { postSlug }
// Toggles a like on a post (requires authentication)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postSlug } = await req.json();
  if (!postSlug) {
    return NextResponse.json({ error: "Missing postSlug" }, { status: 400 });
  }

  const userId = session.user.id;

  // Check if the user already liked this post
  const existing = await prisma.like.findFirst({
    where: {
      postSlug,
      userId,
      commentId: null,
    },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await prisma.like.create({
      data: {
        postSlug,
        userId,
        commentId: null,
      },
    });
    return NextResponse.json({ liked: true });
  }
}
