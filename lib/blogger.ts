// =============================================================================
// Blogger API v3 — Content fetching layer with ISR
// =============================================================================

const API_KEY = process.env.NEXT_PUBLIC_BLOGGER_API_KEY!;
const BLOG_ID = process.env.NEXT_PUBLIC_BLOGGER_BLOG_ID!;
const BASE = "https://www.googleapis.com/blogger/v3/blogs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogAuthor {
  displayName: string;
  url?: string;
  image?: { url: string };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string | null;
  published: string;
  updated: string;
  author: BlogAuthor;
  labels: string[];
  url: string;
  readingTime: number;
}

interface BloggerPost {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  url: string;
  author: BlogAuthor;
  labels?: string[];
}

interface BloggerListResponse {
  items?: BloggerPost[];
  nextPageToken?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a slug from a Blogger URL like /2025/06/my-post-title.html */
export function extractSlug(url: string): string {
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  return last.replace(/\.html$/, "");
}

/** Strip HTML tags and return plain text */
function stripHtml(html: string): string {
  let text = html.replace(/<[^>]*>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  return text.replace(/\s+/g, " ").trim();
}

/** Extract the first <img> src from HTML */
function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/** Estimate reading time (words per minute) */
function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Transform a raw Blogger post into our BlogPost type */
function transformPost(raw: BloggerPost): BlogPost {
  const plainText = stripHtml(raw.content);
  return {
    id: raw.id,
    title: raw.title,
    slug: extractSlug(raw.url),
    content: raw.content,
    excerpt: plainText.slice(0, 160) + (plainText.length > 160 ? "…" : ""),
    thumbnail: extractFirstImage(raw.content),
    published: raw.published,
    updated: raw.updated,
    author: raw.author,
    labels: raw.labels ?? [],
    url: raw.url,
    readingTime: estimateReadingTime(raw.content),
  };
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch all posts with pagination. Results are cached with ISR (60 s).
 */
export async function fetchAllPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/${BLOG_ID}/posts`);
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("fetchImages", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`Blogger API error: ${res.status} ${res.statusText}`);
      break;
    }

    const data: BloggerListResponse = await res.json();
    if (data.items) {
      posts.push(...data.items.map(transformPost));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return posts;
}

/**
 * Fetch a single post by its slug.
 * We fetch all posts and find the one matching the slug.
 */
export async function fetchPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const posts = await fetchAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/**
 * Fetch posts filtered by a specific label.
 */
export async function fetchPostsByLabel(label: string): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/${BLOG_ID}/posts`);
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("labels", label);
    url.searchParams.set("fetchImages", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`Blogger API error: ${res.status} ${res.statusText}`);
      break;
    }

    const data: BloggerListResponse = await res.json();
    if (data.items) {
      posts.push(...data.items.map(transformPost));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return posts;
}

/**
 * Get all unique labels across posts.
 */
export async function fetchAllLabels(): Promise<string[]> {
  const posts = await fetchAllPosts();
  const labelSet = new Set<string>();
  posts.forEach((p) => p.labels.forEach((l) => labelSet.add(l)));
  return Array.from(labelSet).sort();
}
