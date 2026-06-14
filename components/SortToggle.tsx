"use client";

interface SortToggleProps {
  sort: "newest" | "oldest";
  onSortChange: (sort: "newest" | "oldest") => void;
}

export function SortToggle({ sort, onSortChange }: SortToggleProps) {
  return (
    <div className="sort-toggle">
      <button
        className={`sort-btn ${sort === "newest" ? "sort-btn-active" : ""}`}
        onClick={() => onSortChange("newest")}
        id="sort-newest"
      >
        Newest
      </button>
      <button
        className={`sort-btn ${sort === "oldest" ? "sort-btn-active" : ""}`}
        onClick={() => onSortChange("oldest")}
        id="sort-oldest"
      >
        Oldest
      </button>
    </div>
  );
}
