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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase());
  }, []);

  // Collect all unique labels from posts
  const allCategories = useMemo(() => {
    const labelSet = new Set<string>();
    posts.forEach((p) => p.labels.forEach((l) => labelSet.add(l)));
    return Array.from(labelSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) =>
        p.labels.some(
          (l) => l.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

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
  }, [posts, searchQuery, sort, selectedCategory]);

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

        {/* Mobile toggle for sort/filter controls */}
        <button
          className="mobile-controls-toggle"
          id="mobile-controls-toggle"
          onClick={() => setShowMobileControls((v) => !v)}
          aria-expanded={showMobileControls}
          aria-label="Toggle filter controls"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          <span>Filters</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showMobileControls ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Desktop controls (always visible) + mobile collapsible */}
        <div
          className={`blog-controls${showMobileControls ? " blog-controls-open" : ""}`}
        >
          <SortToggle sort={sort} onSortChange={setSort} />

          {/* Category filter */}
          {allCategories.length > 0 && (
            <div className="category-filter">
              <button
                className={`category-filter-btn${selectedCategory ? " category-filter-btn-active" : ""}`}
                id="category-filter-btn"
                onClick={() => setShowCategoryDropdown((v) => !v)}
                aria-expanded={showCategoryDropdown}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                {selectedCategory ? selectedCategory : "Category"}
                {selectedCategory && (
                  <span
                    className="category-clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                    }}
                    title="Clear filter"
                  >
                    ✕
                  </span>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: showCategoryDropdown
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showCategoryDropdown && (
                <div className="category-dropdown" id="category-dropdown">
                  <button
                    className={`category-dropdown-item${!selectedCategory ? " category-dropdown-item-active" : ""}`}
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    All Categories
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      className={`category-dropdown-item${selectedCategory === cat ? " category-dropdown-item-active" : ""}`}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active category badge */}
      {selectedCategory && (
        <div className="active-category-bar">
          <span className="active-category-label">
            Showing:&nbsp;<strong>{selectedCategory}</strong>
          </span>
          <button
            className="active-category-clear"
            onClick={() => setSelectedCategory(null)}
          >
            Clear
          </button>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="blog-list-empty">
          <p>No posts found{searchQuery ? ` for "${searchQuery}"` : ""}{selectedCategory ? ` in "${selectedCategory}"` : ""}.</p>
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
