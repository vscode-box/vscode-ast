// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { COMMAND_SELECTION, COMMAND_REFRESH, AstTreeDataProvider, posToLine } from './astExplorer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const treeDataProvider = new AstTreeDataProvider(context);
  vscode.window.createTreeView('ast.views.explorer', {
    treeDataProvider,
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_REFRESH, () => treeDataProvider.refresh())
  );
  treeDataProvider.didChange();
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_SELECTION, (pos, end) => {
      const editor = vscode.window.activeTextEditor;
      if (editor !== undefined) {
        const code: string = editor.document.getText();
        const posStart = posToLine(code, pos);
        const posEnd = posToLine(code, end);
        editor.selection = new vscode.Selection(posStart, posEnd);
        editor.revealRange(
          new vscode.Range(posStart, posEnd),
          vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );
        editor.show();
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
