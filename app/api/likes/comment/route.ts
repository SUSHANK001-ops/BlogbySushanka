import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/likes/comment { postSlug, commentId }
// Toggles a like on a comment (requires authentication)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postSlug, commentId } = await req.json();
  if (!postSlug || !commentId) {
    return NextResponse.json(
      { error: "Missing postSlug or commentId" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // Check if the user already liked this comment
  const existing = await prisma.like.findFirst({
    where: {
      postSlug,
      userId,
      commentId,
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
        commentId,
      },
    });
    return NextResponse.json({ liked: true });
  }
}
