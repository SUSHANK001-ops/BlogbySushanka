import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateAnonymousName } from "@/lib/name-generator";

// GET /api/comments?slug=<postSlug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    include: {
      user: { select: { id: true, name: true, image: true, provider: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

// POST /api/comments { postSlug, content }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { postSlug, content } = body;

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

  const comment = await prisma.comment.create({
    data: {
      postSlug,
      content: content.trim(),
      userId,
    },
    include: {
      user: { select: { id: true, name: true, image: true, provider: true } },
      _count: { select: { likes: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
