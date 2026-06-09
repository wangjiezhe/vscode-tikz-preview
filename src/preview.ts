import * as vscode from 'vscode';

export class PreviewManager {
    private panel: vscode.WebviewPanel | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private extensionUri: vscode.Uri) {
        this.outputChannel = vscode.window.createOutputChannel('TikZ Preview');
    }

    show(title: string): void {
        if (this.panel) {
            this.panel.title = `${title} - Preview`;
            this.panel.reveal(vscode.ViewColumn.Beside, true);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'tikzPreview',
            `${title} - Preview`,
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media'),
                    vscode.Uri.file('/tmp'),
                ],
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        this.panel.webview.html = this.buildHtml();
    }

    isVisible(): boolean {
        return this.panel !== null;
    }

    render(pdfPath: string): void {
        if (!this.panel) { return; }
        const uri = this.panel.webview.asWebviewUri(vscode.Uri.file(pdfPath));
        this.panel.webview.postMessage({ type: 'render', pdfPath: uri.toString() });
    }

    showError(message: string): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine(message);
        if (this.panel) {
            this.panel.webview.postMessage({ type: 'error', message });
        }
    }

    private buildHtml(): string {
        const pdfjsUri = this.panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'pdf.min.js')
        );
        const workerUri = this.panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'pdf.worker.min.js')
        );
        const viewerJsUri = this.panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'viewer.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${this.panel!.webview.cspSource}; connect-src ${this.panel!.webview.cspSource}; worker-src ${this.panel!.webview.cspSource}; style-src 'unsafe-inline' ${this.panel!.webview.cspSource}; img-src ${this.panel!.webview.cspSource} data:;">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1e1e1e; color: #ccc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #252526; border-bottom: 1px solid #3e3e3e; flex-shrink: 0; }
.toolbar button { background: #3e3e3e; color: #ccc; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 13px; }
.toolbar button:hover { background: #505050; }
.toolbar span { font-size: 13px; }
.toolbar input { background: #3e3e3e; color: #ccc; border: none; padding: 4px 6px; border-radius: 3px; font-size: 13px; text-align: center; width: 55px; }
.toolbar input:focus { outline: 1px solid #007acc; }
.viewport { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 16px; }
canvas { box-shadow: 0 0 10px rgba(0,0,0,.5); flex-shrink: 0; }
.error { color: #f48771; padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 12px; flex: 1; overflow: auto; }
.hidden { display: none !important; }
</style>
</head>
<body>
<div class="toolbar">
  <button id="zoomOut">−</button>
  <input id="zoomLevel" type="text" value="100%" size="5">
  <button id="zoomIn">+</button>
  <button id="fitWidth">Fit Width</button>
  <span id="pageInfo" style="margin-left:auto"></span>
  <button id="prevPage" class="hidden">◀</button>
  <button id="nextPage" class="hidden">▶</button>
</div>
<div class="viewport" id="viewport">
  <canvas id="canvas"></canvas>
</div>
<div id="error" class="error hidden"></div>
<script type="module" src="${pdfjsUri.toString()}"></script>
<script>globalThis.WORKER_SRC_PLACEHOLDER = '${workerUri.toString()}';</script>
<script type="module" src="${viewerJsUri.toString()}"></script>
</body>
</html>`;
    }

    dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
        this.outputChannel.dispose();
    }
}
