"use client";

import parse, {
  type HTMLReactParserOptions,
  Element,
  domToReact,
  type DOMNode,
} from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import Image from "next/image";
import { CodeBlock } from "@/components/CodeBlock";
import { useState } from "react";

interface PostContentProps {
  html: string;
}

/** Generate a URL-friendly ID from heading text */
function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Extract text content from DOM nodes */
function extractText(nodes: DOMNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return (node as unknown as { data: string }).data;
      if (node instanceof Element && node.children) {
        return extractText(node.children as DOMNode[]);
      }
      return "";
    })
    .join("");
}

function ImageWithLightbox({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span className="post-image-wrapper" onClick={() => setIsOpen(true)}>
        <Image
          src={src}
          alt={alt || "Blog image"}
          width={800}
          height={450}
          className="post-image"
          style={{ width: "100%", height: "auto", cursor: "zoom-in" }}
          unoptimized
        />
      </span>
      {isOpen && (
        <div className="lightbox-overlay" onClick={() => setIsOpen(false)}>
          <button
            className="lightbox-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close lightbox"
          >
            ×
          </button>
          <img src={src} alt={alt || "Blog image"} className="lightbox-image" />
        </div>
      )}
    </>
  );
}

export function PostContent({ html }: PostContentProps) {
  // Sanitize HTML
  const clean = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "pre",
      "code",
      "span",
      "div",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "br",
      "hr",
      "iframe",
      "video",
      "source",
      "details",
      "summary",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height", "loading"],
      code: ["class"],
      pre: ["class"],
      span: ["class", "style"],
      div: ["class", "style"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "data"],
  });

  // Parse options to replace elements
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) return;

      // Replace <pre><code> with CodeBlock
      if (domNode.name === "pre") {
        const codeChild = domNode.children.find(
          (child) => child instanceof Element && child.name === "code"
        ) as Element | undefined;

        if (codeChild) {
          const langClass =
            codeChild.attribs?.class?.match(/language-(\w+)/)?.[1] || "text";
          const code = extractText(codeChild.children as DOMNode[]);
          return <CodeBlock language={langClass}>{code}</CodeBlock>;
        }
      }

      // Replace standalone <code> (inline) — leave as is but add class
      if (domNode.name === "code" && domNode.parent) {
        const parent = domNode.parent as Element;
        if (parent.name !== "pre") {
          return (
            <code className="inline-code">
              {domToReact(domNode.children as DOMNode[], options)}
            </code>
          );
        }
      }

      // Replace <img> with Next.js Image + lightbox
      if (domNode.name === "img") {
        const src = domNode.attribs?.src;
        const alt = domNode.attribs?.alt || "";
        if (src) {
          return <ImageWithLightbox src={src} alt={alt} />;
        }
      }

      // Add IDs to headings for TOC
      if (/^h[2-3]$/.test(domNode.name)) {
        const text = extractText(domNode.children as DOMNode[]);
        const id = headingId(text);
        const Tag = domNode.name as "h2" | "h3";
        return (
          <Tag id={id} className={`post-heading post-${domNode.name}`}>
            {domToReact(domNode.children as DOMNode[], options)}
          </Tag>
        );
      }
    },
  };

  return (
    <div className="post-content prose">
      {parse(clean, options)}
    </div>
  );
}
