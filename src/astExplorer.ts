import * as vscode from 'vscode';
import * as ts from 'typescript';

export const SELECTION_CODE = 'ast.views.explorer.selection-code';

export function syntaxKindToName(kind: ts.SyntaxKind) {
  return ts.SyntaxKind[kind];
}

export function getNodes(node: ts.Node) {
  const nodes: ts.Node[] = [];
  ts.forEachChild(node, cbNode => {
    nodes.push(cbNode);
  });
  return nodes;
}

export function posToLine(scode: string, pos: number) {
  const code = scode.slice(0, pos).split('\n');
  return new vscode.Position(code.length - 1, code[code.length - 1].length);
}

export interface AstNode {
  indexs: number[];
  kind: ts.SyntaxKind;
  pos: number;
  end: number;
  isDirectory: boolean;
}

export class AstModel {
  private sfile: ts.SourceFile = ts.createSourceFile('ast.ts', ``, ts.ScriptTarget.Latest);
  constructor() {}
  private _getAst() {
    const editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
      this.sfile = ts.createSourceFile(
        editor.document.uri.toString(),
        editor.document.getText(),
        ts.ScriptTarget.Latest
      );
    }
  }

  public get roots(): AstNode[] {
    this._getAst();
    return getNodes(this.sfile).map((node, index) => {
      return {
        indexs: [index],
        kind: node.kind,
        pos: node.pos,
        end: node.end,
        isDirectory: getNodes(node).length > 0,
      };
    });
  }

  public getChildren(parent: AstNode): AstNode[] {
    const childNodes = parent.indexs.reduce((childs, index) => {
      return getNodes(childs[index]);
    }, getNodes(this.sfile));
    return childNodes.map((node, index) => {
      return {
        indexs: parent.indexs.concat([index]),
        kind: node.kind,
        pos: node.pos,
        end: node.end,
        isDirectory: getNodes(node).length > 0,
      };
    });
  }
}

export class AstTreeDataProvider implements vscode.TreeDataProvider<AstNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
  constructor(private readonly model: AstModel) {}
  public refresh(): any {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: AstNode): vscode.TreeItem {
    return {
      label: `${syntaxKindToName(element.kind)} (${element.pos},${element.end})`,
      collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
      command: {
        title: 'Selection',
        command: SELECTION_CODE,
        arguments: [element.pos, element.end],
      },
    };
  }

  public getChildren(element?: AstNode): AstNode[] | Thenable<AstNode[]> {
    return element ? this.model.getChildren(element) : this.model.roots;
  }
}
