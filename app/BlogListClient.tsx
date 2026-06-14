"use client";

import { useState, useCallback, useMemo } from "react";
import type { BlogPost } from "@/lib/blogger";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { SortToggle } from "@/components/SortToggle";

interface BlogListClientProps {
  posts: BlogPost[];
}

export function BlogListClient({ posts }: BlogListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase());
  }, []);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery) ||
          p.excerpt.toLowerCase().includes(searchQuery) ||
          p.labels.some((l) => l.toLowerCase().includes(searchQuery))
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.published).getTime();
      const dateB = new Date(b.published).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [posts, searchQuery, sort]);

  // Group posts by year
  const groupedPosts = useMemo(() => {
    const groups: Record<string, BlogPost[]> = {};
    filteredPosts.forEach((post) => {
      const year = new Date(post.published).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });

    // Sort years
    const sortedYears = Object.keys(groups).sort((a, b) =>
      sort === "newest" ? Number(b) - Number(a) : Number(a) - Number(b)
    );

    return sortedYears.map((year) => ({ year, posts: groups[year] }));
  }, [filteredPosts, sort]);

  return (
    <div className="blog-list-page">
      <div className="blog-list-header">
        <SearchBar onSearch={handleSearch} />
        <SortToggle sort={sort} onSortChange={setSort} />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="blog-list-empty">
          <p>No posts found{searchQuery ? ` for "${searchQuery}"` : ""}.</p>
        </div>
      ) : (
        <div className="blog-list-groups">
          {groupedPosts.map(({ year, posts: yearPosts }) => (
            <div key={year} className="blog-list-year-group">
              <h2 className="blog-list-year">{year}</h2>
              <div className="blog-list-posts">
                {yearPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
