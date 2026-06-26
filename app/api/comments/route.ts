import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateAnonymousName } from "@/lib/name-generator";

const commentInclude = {
  user: { select: { id: true, name: true, image: true, provider: true } },
  _count: { select: { likes: true } },
} as const;

type CommentRow = {
  id: string;
  postSlug: string;
  content: string;
  createdAt: Date;
  userId: string;
  parentCommentId: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
    provider: string;
  };
  _count: {
    likes: number;
  };
};

type CommentWithReplies = CommentRow & {
  replies?: CommentWithReplies[];
};

function buildCommentTree(comments: CommentRow[]): CommentWithReplies[] {
  const repliesByParent = new Map<string, typeof comments>();
  const rootComments: typeof comments = [];

  for (const comment of comments) {
    if (comment.parentCommentId) {
      const replyList = repliesByParent.get(comment.parentCommentId) ?? [];
      replyList.push(comment);
      repliesByParent.set(comment.parentCommentId, replyList);
    } else {
      rootComments.push(comment);
    }
  }

  return rootComments.map((comment) => ({
    ...comment,
    replies: (repliesByParent.get(comment.id) ?? []).sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    ),
  }));
}

// GET /api/comments?slug=<postSlug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    include: commentInclude,
    orderBy: { createdAt: "desc" },
  }) as CommentRow[];

  return NextResponse.json(buildCommentTree(comments));
}

// POST /api/comments { postSlug, content, parentCommentId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postSlug, content, parentCommentId } = body;

    if (!postSlug || !content?.trim()) {
      return NextResponse.json(
        { error: "Missing postSlug or content" },
        { status: 400 }
      );
    }

    const session = await auth();
    let userId: string;

    if (session?.user?.id) {
      // Authenticated user
      userId = session.user.id;
    } else {
      if (parentCommentId) {
        return NextResponse.json(
          { error: "Guests cannot reply to comments" },
          { status: 403 }
        );
      }

      // Anonymous user — create a temporary user record
      const anonName = generateAnonymousName();
      const anonUser = await prisma.user.create({
        data: {
          name: anonName,
          email: `anon-${Date.now()}-${Math.random().toString(36).slice(2)}@anonymous.local`,
          provider: "anonymous",
        },
      });
      userId = anonUser.id;
    }

    if (parentCommentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentCommentId, postSlug },
        select: { id: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const commentData: Prisma.CommentCreateInput = {
      postSlug,
      content: content.trim(),
      user: { connect: { id: userId } },
      ...(parentCommentId
        ? { parentComment: { connect: { id: parentCommentId } } }
        : {}),
    };

    const comment = await prisma.comment.create({
      data: commentData,
      include: commentInclude,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments { commentId }
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { commentId } = body;

  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      user: { select: { provider: true } },
    },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.user.provider === "anonymous") {
    return NextResponse.json(
      { error: "Guest comments cannot be deleted" },
      { status: 403 }
    );
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
