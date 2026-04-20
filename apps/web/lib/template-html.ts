function collectFragments(content: string, pattern: RegExp): string {
    const matches = content.match(pattern);
    if (!matches || matches.length === 0) return '';
    return matches.join('\n').trim();
}

export function stripHtmlScripts(raw: string): string {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') // Remove <script> blocks
        .replace(/\son\w+="[^"]*"/gi, '') // Remove inline handlers like onclick="..."
        .replace(/\son\w+='[^']*'/gi, '') // Remove inline handlers like onclick='...'
        .trim();
}

/**
 * Converts a full HTML document into page-content HTML that can be rendered
 * inside the public page container and edited in GrapesJS.
 */
export function normalizeTemplateHtml(
    raw: string,
    options?: { includeScripts?: boolean },
): string {
    const source = typeof raw === 'string' ? raw.trim() : '';
    if (!source) return '';
    const includeScripts = options?.includeScripts !== false;

    const headMatch = source.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch ? headMatch[1] : '';
    const stylesFromHead = collectFragments(headContent, /<style[\s\S]*?<\/style>/gi);
    const scriptsFromHead = collectFragments(headContent, /<script[\s\S]*?<\/script>/gi);
    const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    if (bodyMatch) {
        const bodyContent = bodyMatch[1].trim();
        const combined = [stylesFromHead, bodyContent, includeScripts ? scriptsFromHead : '']
            .filter(Boolean)
            .join('\n\n')
            .trim();
        return includeScripts ? combined : stripHtmlScripts(combined);
    }

    const normalized = source
        .replace(/<!doctype[^>]*>/gi, '')
        .replace(/<\/?html[^>]*>/gi, '')
        .replace(/<\/?head[^>]*>/gi, '')
        .replace(/<\/?body[^>]*>/gi, '')
        .trim();

    return includeScripts ? normalized : stripHtmlScripts(normalized);
}

/**
 * Normalizes HTML specifically for the GrapesJS editor canvas.
 * It removes document wrappers and strictly strips scripts/event handlers.
 */
export function normalizeForEditor(raw: string): string {
  if (!raw) return "";
  return normalizeTemplateHtml(raw, { includeScripts: false });
}

export const DEFAULT_HTML = `
<section style="padding:80px 20px;text-align:center;background:#f8fafc;">
  <h1 style="font-size:48px;line-height:1.1;margin:0 0 12px 0;">Build Your Front Page</h1>
  <p style="max-width:680px;margin:0 auto 20px auto;font-size:18px;color:#475569;">
    Start with a template, then drag, edit, and publish your page.
  </p>
  <a href="#contact" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#0f172a;color:#fff;text-decoration:none;">Get Started</a>
</section>
`;

export type CodeDraft = {
  html: string;
  css: string;
  js: string;
};

/**
 * Splits a single HTML string into separate HTML, CSS, and JS chunks.
 * Useful for code editors and runtime previews.
 */
export function splitBuilderCode(input: string): CodeDraft {
  if (!input || !input.trim() ) {
    debugger
    return { html: "", css: "", js: "" };
  }

  const cssChunks: string[] = [];
  const jsChunks: string[] = [];

  // Extract styles
  let html = input.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css: string) => {
      const value = css.trim();
      if (value) cssChunks.push(value);
      return "";
    },
  );

  // Extract scripts
  html = html.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (_, js: string) => {
      const value = js.trim();
      if (value) jsChunks.push(value);
      return "";
    },
  );

  return {
    html: html || DEFAULT_HTML.trim(),
    css: cssChunks.join("\n\n").trim(),
    js: jsChunks.join("\n\n").trim(),
  };
}

/**
 * Re-composes a CodeDraft back into a single HTML string.
 */
export function composeBuilderCode(draft: CodeDraft): string {
  const html = draft.html || DEFAULT_HTML.trim();
  const css = draft.css.trim();
  const js = draft.js.trim();
  const cssBlock = css ? `<style>\n${css}\n</style>\n` : "";
  const jsBlock = js ? `\n<script>\n${js}\n</script>` : "";
  return `${cssBlock}${html}${jsBlock}`;
}
