import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/likes?slug=<postSlug>
// Returns like counts for the post and all its comments, plus user's own likes
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Count post likes (likes where commentId is null)
  const postLikeCount = await prisma.like.count({
    where: { postSlug: slug, commentId: null },
  });

  // Get all comment like counts for this post
  const commentLikes = await prisma.like.groupBy({
    by: ["commentId"],
    where: { postSlug: slug, commentId: { not: null } },
    _count: true,
  });

  const commentLikeCounts: Record<string, number> = {};
  commentLikes.forEach((cl) => {
    if (cl.commentId) {
      commentLikeCounts[cl.commentId] = cl._count;
    }
  });

  // Get current user's likes for this post
  let userPostLiked = false;
  let userCommentLikes: string[] = [];

  if (userId) {
    const userPostLike = await prisma.like.findFirst({
      where: { postSlug: slug, userId, commentId: null },
    });
    userPostLiked = !!userPostLike;

    const userCLikes = await prisma.like.findMany({
      where: { postSlug: slug, userId, commentId: { not: null } },
      select: { commentId: true },
    });
    userCommentLikes = userCLikes
      .map((l) => l.commentId)
      .filter(Boolean) as string[];
  }

  return NextResponse.json({
    postLikeCount,
    commentLikeCounts,
    userPostLiked,
    userCommentLikes,
  });
}
