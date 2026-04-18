import { createElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { CollapsibleSections } from "./collapsible";

export interface RendererOptions {
  imageBaseUrl?: string;
  collapsibleHeadings?: boolean;
  skipHtml?: boolean;
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function isResolvedImageSrc(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("/")
  );
}

function buildComponents(imageBaseUrl: string | undefined): Components {
  return {
    a: ({ children, href }) => {
      const value = typeof href === "string" ? href : "";
      if (!value) return <a>{children}</a>;
      const external = isExternalHref(value);
      return (
        <a
          href={value}
          className="hlt-md-link"
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      const srcStr = typeof src === "string" ? src : "";
      const resolved =
        srcStr && imageBaseUrl && !isResolvedImageSrc(srcStr)
          ? `${imageBaseUrl.replace(/\/$/, "")}/${srcStr.replace(/^\.\//, "")}`
          : srcStr;
      return (
        <img
          src={resolved}
          alt={alt ?? ""}
          loading="lazy"
          className="hlt-md-image"
        />
      );
    },
    code: ({ children, className, node, ...props }) => {
      const text = String(children).replace(/\n$/, "");
      const isMultiline =
        node?.position?.start.line !== undefined &&
        node.position.end.line !== undefined &&
        node.position.start.line !== node.position.end.line;
      const isBlock = className?.includes("language-") || isMultiline;
      if (isBlock) {
        return createElement(
          "code",
          { ...props, className: `hlt-md-code-block ${className ?? ""}` },
          text
        );
      }
      return createElement(
        "code",
        { ...props, className: "hlt-md-code-inline" },
        children
      );
    },
  };
}

export function createMarkdownRenderer(
  options: RendererOptions = {}
): (content: string) => ReactNode {
  const {
    imageBaseUrl,
    collapsibleHeadings = false,
    skipHtml = true,
  } = options;
  const components = buildComponents(imageBaseUrl);

  const renderPart = (content: string) => (
    <div className="hlt-md">
      <ReactMarkdown
        skipHtml={skipHtml}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (!collapsibleHeadings) {
    return renderPart;
  }

  return (content: string) => (
    <CollapsibleSections content={content} renderPart={renderPart} />
  );
}

export const markdownRenderer = createMarkdownRenderer();

export { CollapsibleSections, parseArticleSections } from "./collapsible";
export type { ArticleSection } from "./collapsible";
