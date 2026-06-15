"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  html: string;
}

/** Extract headings from sanitized HTML */
function extractHeadings(html: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (text) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function TableOfContents({ html }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const headings = extractHeadings(html);
  const listRef = useRef<HTMLUListElement>(null);

  const handleScroll = useCallback(() => {
    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    let currentId = "";
    for (const el of headingElements) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 120) {
        currentId = el.id;
      }
    }
    setActiveId(currentId);
  }, [headings]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll active TOC item into view ONLY within the toc-list container
  // Using scrollTop instead of scrollIntoView to avoid moving the page
  useEffect(() => {
    if (!listRef.current || !activeId) return;

    const list = listRef.current;
    const activeEl = list.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (!activeEl) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();

    // Item is below the visible area — scroll down
    if (itemRect.bottom > listRect.bottom) {
      list.scrollTop += itemRect.bottom - listRect.bottom + 20;
    }
    // Item is above the visible area — scroll up
    else if (itemRect.top < listRect.top) {
      list.scrollTop -= listRect.top - itemRect.top + 20;
    }
  }, [activeId]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="Table of contents">
      <h4 className="toc-title">On This Page</h4>
      <ul className="toc-list" ref={listRef}>
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              data-id={heading.id}
              className={`toc-item ${heading.level === 3 ? "toc-item-nested" : ""} ${
                isActive ? "toc-item-active" : ""
              }`}
            >
              <a
                href={`#${heading.id}`}
                className="toc-link"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(heading.id);
                  if (target) {
                    const headerHeight = 64;
                    const offset = 16;
                    const top =
                      target.getBoundingClientRect().top +
                      window.scrollY -
                      headerHeight -
                      offset;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
