interface HtmlNode {
  type: 'element' | 'text' | 'comment';
  tag?: string;
  attrs?: Record<string, string>;
  children?: HtmlNode[];
  content?: string;
}

function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { type: 'element', tag: 'root', children: [] };
  let current = root;
  const stack: HtmlNode[] = [root];

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\s*([^>]*)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray;

  while ((match = tagRegex.exec(html)) !== null) {
    const text = html.slice(lastIndex, match.index);
    if (text.trim()) {
      stack[stack.length - 1].children!.push({
        type: 'text',
        content: text,
      });
    }

    const [fullMatch, tagName, attrsStr] = match;
    const isClosing = fullMatch.startsWith('</');
    const isSelfClosing = fullMatch.endsWith('/>') || ['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName.toLowerCase());

    if (isClosing) {
      stack.pop();
      current = stack[stack.length - 1];
    } else {
      const attrs: Record<string, string> = {};
      const attrRegex = /([a-zA-Z-]+)(?:="([^"]*)"|='([^']*)')?/g;
      let attrMatch: RegExpExecArray;
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2] || attrMatch[3] || '';
      }

      const node: HtmlNode = {
        type: 'element',
        tag: tagName.toLowerCase(),
        attrs,
        children: [],
      };

      current.children!.push(node);
      if (!isSelfClosing) {
        stack.push(node);
        current = node;
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  const remainingText = html.slice(lastIndex);
  if (remainingText.trim()) {
    root.children!.push({ type: 'text', content: remainingText });
  }

  return root;
}

function generateHtml(node: HtmlNode): string {
  if (node.type === 'text') {
    return node.content || '';
  }

  if (node.type === 'element') {
    const attrs = node.attrs
      ? Object.entries(node.attrs)
        .map(([k, v]) => (v ? `${k}="${v}"` : k))
        .join(' ')
      : '';
    const attrStr = attrs ? ` ${attrs}` : '';
    const children = (node.children || []).map(generateHtml).join('');

    if (['br', 'hr', 'img', 'input', 'meta', 'link'].includes(node.tag!)) {
      return `<${node.tag}${attrStr} />`;
    }

    return `<${node.tag}${attrStr}>${children}</${node.tag}>`;
  }

  return '';
}

export function injectScriptBeforeClosingTag(html: string, scriptContent: string, targetTag: string = 'body'): string {
  const ast = parseHtml(html);

  function traverse(node: HtmlNode): boolean {
    if (node.type === 'element' && node.tag === targetTag) {
      const scriptNode: HtmlNode = {
        type: 'element',
        tag: 'script',
        children: [{ type: 'text', content: scriptContent }],
      };
      node.children = node.children || [];
      node.children.push(scriptNode);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (traverse(child)) return true;
      }
    }

    return false;
  }

  traverse(ast);
  return generateHtml(ast);
}
