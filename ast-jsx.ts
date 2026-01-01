import { parse } from '@babel/parser';
import _traverse, { NodePath } from '@babel/traverse';
import { generate } from '@babel/generator';
import { ReturnStatement } from '@babel/types';

const traverse = (_traverse as any).default;

export function getHtml(tsxContent: string): string {
  const ast = parse(tsxContent, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  let result = '';

  traverse(ast, {
    ReturnStatement(path: NodePath<ReturnStatement>) {
      const { argument } = path.node;
      if (!argument) return;

      const isJSX = argument.type === 'JSXElement' || argument.type === 'JSXFragment';
      if (isJSX && !result) {
        result = generate(argument).code;
        path.stop();
      }
    }
  });

  return result || '';
}
