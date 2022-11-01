import * as t from '@babel/types';
import generator from '@babel/generator';
import { parse } from '@babel/parser';
import path from 'path';

import _traverse from '@babel/traverse';

const traverse = _traverse.default;

const code = 'import {\n' +
  '  resolveComponent as h,\n' +
  '  openBlock as W,\n' +
  '  createElementBlock as U,\n' +
  '  createVNode as y,\n' +
  '  withCtx as T,\n' +
  '  createElementVNode as i,\n' +
  '  createTextVNode as X,\n' +
  '  defineComponent as q\n' +
  '} from \'vue\';';

const ast = parse(code, { sourceType: 'module' });

traverse(ast, {
  ImportDeclaration(path) {
    const { node } = path;

    function getImportedValue(importedNode) {
      return t.isStringLiteral(importedNode) ? importedNode.value : importedNode.name;
    }

    function fromIdentifier() {
      return t.identifier(node.source.value);
    }

    path.insertAfter(
      node.specifiers.map(specifier => {
        if (t.isImportSpecifier(specifier)) {
          return t.variableDeclaration('const', [
            t.variableDeclarator(
              t.objectPattern([
                t.objectProperty(
                  t.identifier(getImportedValue(specifier.imported)),
                  t.identifier(specifier.local?.name ?? getImportedValue(specifier.imported))
                )
              ]),
              fromIdentifier()
            )
          ]);
        } else {
          return t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(specifier.local.name), fromIdentifier())
          ]);
        }
      })
    );

    path.remove();
  }
});

console.log(generator.default(ast).code);
