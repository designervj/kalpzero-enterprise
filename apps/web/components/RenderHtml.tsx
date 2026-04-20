"use client";

import { useEffect, useRef, useState } from "react";
import { NavigationRenderer } from "./NavigationRenderer";

type RenderHtmlProps = {
  html: string;
  className?: string;
};

export function RenderHtml({ html, className }: RenderHtmlProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    if (!html) {
      setElements([]);
      return;
    }

    // Regex to find: <style>...</style>
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
    // Regex for nav tags
    const navRegex =
      /<nav[^>]*class="[^"]*kalp-navigation[^"]*"[^>]*nav-id="([^"]*)"[^>]*>[\s\S]*?<\/nav>/g;

    const parts = [];
    let lastIndex = 0;

    // We'll process the HTML to find both navs and styles
    // Simplest way: combine them or process iteratively. 
    // Let's stick to a robust way of finding both.
    const allMatches = [];

    let match;
    while ((match = navRegex.exec(html)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'nav', match });
    }
    navRegex.lastIndex = 0; // reset for next use

    while ((match = styleRegex.exec(html)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, type: 'style', match });
    }
    styleRegex.lastIndex = 0;

    // Sort matches by index
    allMatches.sort((a, b) => a.index - b.index);

    lastIndex = 0;
    for (const item of allMatches) {
      if (item.index > lastIndex) {
        parts.push({
          type: "html",
          content: html.substring(lastIndex, item.index),
        });
      }

      if (item.type === 'nav') {
        const fullTag = item.match[0];
        const navId = item.match[1];
        const layoutMatch = fullTag.match(/layout="([^"]*)"/);
        const alignMatch = fullTag.match(/align="([^"]*)"/);
        const stickyMatch = fullTag.match(/sticky="([^"]*)"/);

        parts.push({
          type: "nav",
          navId,
          layout: (layoutMatch ? layoutMatch[1] : "horizontal") as any,
          align: (alignMatch ? alignMatch[1] : "left") as any,
          sticky: stickyMatch ? stickyMatch[1] === "true" : false,
        });
      } else if (item.type === 'style') {
        parts.push({
          type: "style",
          content: item.match[1],
        });
      }

      lastIndex = item.index + item.length;
    }

    // Push the remaining HTML
    if (lastIndex < html.length) {
      parts.push({ type: "html", content: html.substring(lastIndex) });
    }

    setElements(parts);
  }, [html]);

  // We still have the script execution logic for the static HTML parts
  useEffect(() => {
    if (!containerRef.current) return;

    const scripts = Array.from(containerRef.current.querySelectorAll("script"));
    scripts.forEach((script) => {
      const replacement = document.createElement("script");
      Array.from(script.attributes).forEach((attr) => {
        replacement.setAttribute(attr.name, attr.value);
      });
      replacement.text = script.text;
      script.parentNode?.replaceChild(replacement, script);
    });
  }, [elements]);

  return (
    <div ref={containerRef} className={className}>
      {elements.map((el, i) => {
        if (el.type === "style") {
          return <style key={i} dangerouslySetInnerHTML={{ __html: el.content }} />;
        }
        if (el.type === "html") {
          return (
            <div key={i} dangerouslySetInnerHTML={{ __html: el.content }} />
          );
        }
        return null;
      })}
    </div>
  );
}
