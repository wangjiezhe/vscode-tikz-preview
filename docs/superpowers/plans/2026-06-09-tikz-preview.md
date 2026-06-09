# TikZ Preview Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that provides live PDF preview for TikZ files (.tikz, .pgf, .tkz) by compiling LaTeX in a temp directory.

**Architecture:** Three modules — Compiler (spawns pdflatex in temp dir, substitutes template), PreviewManager (webview panel + PDF.js rendering), extension.ts (wires config, watchers, debounce). Webview loads pdf.js from bundled copies in media/.

**Tech Stack:** TypeScript, VS Code Extension API, esbuild, pdfjs-dist 5.x (pdf.js for webview rendering)

---

### Task 1: Install pdfjs-dist and add build copy script

**Files:**
- Modify: `package.json` (scripts, dependencies)
- Create: `scripts/copy-pdfjs.js`

- [ ] **Step 1: Install pdfjs-dist**

Run: `npm install --save pdfjs-dist`
Expected: pdfjs-dist added to package.json dependencies

- [ ] **Step 2: Create copy script**

Create `scripts/copy-pdfjs.js`:

```javascript
const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, '..', 'media');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
}

const files = ['pdf.min.js', 'pdf.worker.min.js'];
for (const file of files) {
    const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', file);
    const dest = path.join(mediaDir, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to media/`);
}
```

- [ ] **Step 3: Update package.json scripts**

Add `"copy-pdfjs": "node scripts/copy-pdfjs.js"` to scripts, and chain it into `compile` and `vscode:prepublish`. Update the scripts block:

```json
"scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "npm run check-types && npm run lint && node esbuild.js && npm run copy-pdfjs",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "npm run check-types && npm run lint && node esbuild.js --production && npm run copy-pdfjs",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "npm run compile-tests && npm run compile && npm run lint",
    "check-types": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vscode-test",
    "copy-pdfjs": "node scripts/copy-pdfjs.js"
}
```

- [ ] **Step 4: Run the copy script**

Run: `node scripts/copy-pdfjs.js`
Expected: "Copied pdf.min.js to media/" and "Copied pdf.worker.min.js to media/"

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/copy-pdfjs.js media/pdf.min.js media/pdf.worker.min.js
git commit -m "$(cat <<'EOF'
📦 build: add pdfjs-dist and copy script for webview PDF rendering

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 2: Update package.json and .vscodeignore

**Files:**
- Modify: `package.json`
- Modify: `.vscodeignore`

- [ ] **Step 1: Add `scripts/**` to .vscodeignore**

Append `scripts/**` to the end of `.vscodeignore` (build-only files, not needed at runtime).

- [ ] **Step 2: Replace activationEvents, commands, and add configuration**

Read `package.json`, then replace the `activationEvents` and `contributes` sections:

```json
"activationEvents": [
    "workspaceContains:**/*.tikz",
    "workspaceContains:**/*.pgf",
    "workspaceContains:**/*.tkz",
    "onCommand:tikz-preview.preview"
],
"contributes": {
    "commands": [
        {
            "command": "tikz-preview.preview",
            "title": "TikZ: Preview",
            "icon": "$(open-preview)"
        }
    ],
    "menus": {
        "editor/title": [
            {
                "command": "tikz-preview.preview",
                "when": "resourceExtname == .tikz || resourceExtname == .pgf || resourceExtname == .tkz",
                "group": "navigation"
            }
        ]
    },
    "configuration": {
        "title": "TikZ Preview",
        "properties": {
            "tikz-preview.latexCommand": {
                "type": "string",
                "default": "pdflatex",
                "description": "LaTeX compiler command (pdflatex, lualatex, xelatex, etc.)"
            },
            "tikz-preview.shellEscape": {
                "type": "boolean",
                "default": false,
                "description": "Pass -shell-escape flag to the LaTeX compiler"
            },
            "tikz-preview.templatePath": {
                "type": "string",
                "default": "",
                "description": "Path to a .pgs template file. Leave empty to use the bundled default template."
            },
            "tikz-preview.templatePlaceholder": {
                "type": "string",
                "default": "<>",
                "description": "String in the template that will be replaced with the document content."
            }
        }
    }
}
```

- [ ] **Step 2: Verify package.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo "OK"`
Expected: "OK"

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
✨ feat(config): add TikZ Preview command, activation events, and settings

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 3: Create bundled default template

**Files:**
- Create: `templates/default.pgs`

- [ ] **Step 1: Create templates/default.pgs**

Write `templates/default.pgs`:

```latex
\documentclass{article}
\usepackage{mathptmx}
\usepackage{tikz}
%\usepackage{color}
\usepackage[active,pdftex,tightpage]{preview}
\PreviewEnvironment[]{tikzpicture}
\PreviewEnvironment[]{pgfpicture}
\DeclareSymbolFont{symbolsb}{OMS}{cmsy}{m}{n}
\SetSymbolFont{symbolsb}{bold}{OMS}{cmsy}{b}{n}
\DeclareSymbolFontAlphabet{\mathcal}{symbolsb}
\begin{document}
<>
\end{document}
```

- [ ] **Step 2: Commit**

```bash
git add templates/default.pgs
git commit -m "$(cat <<'EOF'
✨ feat(template): add bundled default LaTeX template for TikZ preview

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 4: Create compiler module

**Files:**
- Create: `src/compiler.ts`

- [ ] **Step 1: Create src/compiler.ts**

```typescript
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export interface CompileSuccess {
    pdfPath: string;
}

export interface CompileFailure {
    error: string;
}

export type CompileResult = CompileSuccess | CompileFailure;

export class Compiler {
    private currentProcess: cp.ChildProcess | null = null;
    private tempDir: string | null = null;

    constructor(private extensionUri: vscode.Uri) {}

    async compile(
        documentText: string,
        templatePath: string,
        placeholder: string,
        latexCommand: string,
        shellEscape: boolean
    ): Promise<CompileResult> {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }

        const template = this.loadTemplate(templatePath);
        const source = template.split(placeholder).join(documentText);

        if (!this.tempDir) {
            this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tikz-preview-'));
        }

        const sourcePath = path.join(this.tempDir, 'source.tex');
        fs.writeFileSync(sourcePath, source);

        const args: string[] = [
            '-interaction=nonstopmode',
            '-halt-on-error',
            '-file-line-error',
        ];
        if (shellEscape) {
            args.push('-shell-escape');
        }
        args.push('source.tex');

        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';

            this.currentProcess = cp.spawn(latexCommand, args, {
                cwd: this.tempDir!,
            });

            this.currentProcess.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            this.currentProcess.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            this.currentProcess.on('close', (code) => {
                this.currentProcess = null;
                const pdfPath = path.join(this.tempDir!, 'source.pdf');
                if (code === 0 && fs.existsSync(pdfPath)) {
                    resolve({ pdfPath });
                } else {
                    resolve({ error: this.extractError(stdout + stderr) });
                }
            });

            const handleError = (err: Error) => {
                this.currentProcess = null;
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                    resolve({ error: `LaTeX command not found: ${latexCommand}` });
                } else {
                    resolve({ error: err.message });
                }
            };

            this.currentProcess.on('error', handleError);
        });
    }

    private loadTemplate(templatePath: string): string {
        if (templatePath && fs.existsSync(templatePath)) {
            return fs.readFileSync(templatePath, 'utf8');
        }

        const bundledPath = path.join(
            vscode.Uri.joinPath(this.extensionUri, 'templates', 'default.pgs').fsPath
        );
        const template = fs.readFileSync(bundledPath, 'utf8');

        if (templatePath) {
            vscode.window.showWarningMessage(
                `TikZ Preview: Template not found at "${templatePath}", using built-in default.`
            );
        }

        return template;
    }

    private extractError(output: string): string {
        const lines = output.split('\n');
        const errorLines: string[] = [];
        let inError = false;
        for (const line of lines) {
            if (line.startsWith('! ')) {
                inError = true;
            }
            if (inError) {
                errorLines.push(line);
                if (line.startsWith('l.') && errorLines.length > 1) {
                    break;
                }
            }
        }
        return errorLines.length > 0
            ? errorLines.join('\n')
            : output.slice(-1000);
    }

    getTempDir(): string | null {
        return this.tempDir;
    }

    dispose(): void {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
        if (this.tempDir) {
            try {
                fs.rmSync(this.tempDir, { recursive: true, force: true });
            } catch {
                // ignore cleanup errors
            }
            this.tempDir = null;
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/compiler.ts
git commit -m "$(cat <<'EOF'
✨ feat(compiler): add LaTeX compilation in temp directory

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 5: Create webview viewer.js

**Files:**
- Create: `media/viewer.js`

- [ ] **Step 1: Create media/viewer.js**

```javascript
(function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC_PLACEHOLDER;

    var pdfDoc = null;
    var currentPage = 1;
    var currentScale = 1;
    var fitWidth = true;

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var viewportEl = document.getElementById('viewport');
    var errorDiv = document.getElementById('error');
    var zoomLevel = document.getElementById('zoomLevel');
    var pageInfo = document.getElementById('pageInfo');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    function renderPage(num) {
        if (!pdfDoc) return;
        pdfDoc.getPage(num).then(function (page) {
            var vp = page.getViewport({ scale: currentScale });
            canvas.width = vp.width;
            canvas.height = vp.height;
            return page.render({ canvasContext: ctx, viewport: vp }).promise;
        }).then(function () {
            currentPage = num;
            updateUI();
        });
    }

    function updateUI() {
        if (!pdfDoc) return;
        zoomLevel.textContent = Math.round(currentScale * 100) + '%';
        pageInfo.textContent = 'Page ' + currentPage + ' / ' + pdfDoc.numPages;
        prevBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
        nextBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
    }

    function fitToWidth() {
        if (!pdfDoc) return;
        pdfDoc.getPage(currentPage).then(function (page) {
            var vp = page.getViewport({ scale: 1 });
            currentScale = (viewportEl.clientWidth / vp.width) * 0.9;
            renderPage(currentPage);
        });
    }

    document.getElementById('zoomIn').addEventListener('click', function () {
        fitWidth = false;
        currentScale = Math.min(5, currentScale * 1.25);
        renderPage(currentPage);
    });

    document.getElementById('zoomOut').addEventListener('click', function () {
        fitWidth = false;
        currentScale = Math.max(0.1, currentScale / 1.25);
        renderPage(currentPage);
    });

    document.getElementById('fitWidth').addEventListener('click', function () {
        fitWidth = true;
        fitToWidth();
    });

    prevBtn.addEventListener('click', function () {
        if (currentPage > 1) renderPage(currentPage - 1);
    });

    nextBtn.addEventListener('click', function () {
        if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
    });

    window.addEventListener('message', function (event) {
        var msg = event.data;
        if (msg.type === 'render') {
            errorDiv.classList.add('hidden');
            viewportEl.classList.remove('hidden');
            pdfjsLib.getDocument(msg.pdfPath).promise.then(function (pdf) {
                pdfDoc = pdf;
                if (fitWidth) {
                    fitToWidth();
                } else {
                    renderPage(1);
                }
            }).catch(function (err) {
                errorDiv.textContent = 'Failed to load PDF: ' + err.message;
                errorDiv.classList.remove('hidden');
                viewportEl.classList.add('hidden');
            });
        } else if (msg.type === 'error') {
            viewportEl.classList.add('hidden');
            errorDiv.textContent = msg.message;
            errorDiv.classList.remove('hidden');
        }
    });

    window.addEventListener('resize', function () {
        if (fitWidth) fitToWidth();
    });
})();
```

- [ ] **Step 2: Commit**

```bash
git add media/viewer.js
git commit -m "$(cat <<'EOF'
✨ feat(webview): add PDF.js viewer script with zoom and page navigation

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 6: Create preview manager

**Files:**
- Create: `src/preview.ts`

- [ ] **Step 1: Create src/preview.ts**

```typescript
import * as fs from 'fs';
import * as vscode from 'vscode';

export class PreviewManager {
    private panel: vscode.WebviewPanel | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private extensionUri: vscode.Uri) {
        this.outputChannel = vscode.window.createOutputChannel('TikZ Preview');
    }

    show(title: string): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'tikzPreview',
            `${title} - Preview`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media'),
                ],
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        this.panel.webview.html = this.buildHtml();
    }

    render(pdfPath: string): void {
        if (!this.panel) return;
        const uri = this.panel.webview.asWebviewUri(vscode.Uri.file(pdfPath));
        this.panel.webview.postMessage({ type: 'render', pdfPath: uri.toString() });
    }

    showError(message: string): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine(message);
        this.outputChannel.show(true);
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${this.panel!.webview.cspSource}; style-src 'unsafe-inline' ${this.panel!.webview.cspSource}; img-src ${this.panel!.webview.cspSource} data:;">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1e1e1e; color: #ccc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #252526; border-bottom: 1px solid #3e3e3e; flex-shrink: 0; }
.toolbar button { background: #3e3e3e; color: #ccc; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 13px; }
.toolbar button:hover { background: #505050; }
.toolbar span { font-size: 13px; }
.viewport { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 16px; }
canvas { box-shadow: 0 0 10px rgba(0,0,0,.5); }
.error { color: #f48771; padding: 16px; white-space: pre-wrap; font-family: monospace; font-size: 12px; flex: 1; overflow: auto; }
.hidden { display: none !important; }
</style>
</head>
<body>
<div class="toolbar">
  <button id="zoomOut">−</button>
  <span id="zoomLevel">100%</span>
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
<script src="${pdfjsUri.toString()}"></script>
<script>var WORKER_SRC_PLACEHOLDER = '${workerUri.toString()}';</script>
<script src="${viewerJsUri.toString()}"></script>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/preview.ts
git commit -m "$(cat <<'EOF'
✨ feat(preview): add webview preview manager with PDF.js integration

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 7: Rewrite extension entry point

**Files:**
- Modify: `src/extension.ts` (complete rewrite)

- [ ] **Step 1: Rewrite src/extension.ts**

```typescript
import * as vscode from 'vscode';
import { Compiler } from './compiler';
import { PreviewManager } from './preview';

const TIKZ_EXTENSIONS = new Set(['.tikz', '.pgf', '.tkz']);

export function activate(context: vscode.ExtensionContext) {
    console.log('TikZ Preview extension activated');

    const compiler = new Compiler(context.extensionUri);
    const preview = new PreviewManager(context.extensionUri);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function getConfig() {
        const cfg = vscode.workspace.getConfiguration('tikz-preview');
        return {
            latexCommand: cfg.get<string>('latexCommand', 'pdflatex'),
            shellEscape: cfg.get<boolean>('shellEscape', false),
            templatePath: cfg.get<string>('templatePath', ''),
            placeholder: cfg.get<string>('templatePlaceholder', '<>'),
        };
    }

    function isTikzFile(editor: vscode.TextEditor | undefined): boolean {
        if (!editor) return false;
        const ext = editor.document.fileName.match(/\.\w+$/)?.[0] ?? '';
        return TIKZ_EXTENSIONS.has(ext);
    }

    async function doCompile(editor: vscode.TextEditor) {
        const config = getConfig();
        const text = editor.document.getText();
        const result = await compiler.compile(
            text,
            config.templatePath,
            config.placeholder,
            config.latexCommand,
            config.shellEscape
        );

        if ('pdfPath' in result) {
            preview.render(result.pdfPath);
        } else {
            preview.showError(result.error);
        }
    }

    function triggerCompile(editor: vscode.TextEditor) {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            doCompile(editor);
        }, 300);
    }

    // Command: manual preview toggle
    const previewCommand = vscode.commands.registerCommand('tikz-preview.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        preview.show(editor.document.fileName);
        doCompile(editor);
    });
    context.subscriptions.push(previewCommand);

    // Auto-open preview when switching to a TikZ file
    const activeEditorChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && isTikzFile(editor)) {
            preview.show(editor.document.fileName);
            doCompile(editor);
        }
    });
    context.subscriptions.push(activeEditorChange);

    // Re-compile on document change
    const textChange = vscode.workspace.onDidChangeTextDocument((e) => {
        const editor = vscode.window.activeTextEditor;
        if (
            editor &&
            e.document === editor.document &&
            isTikzFile(editor)
        ) {
            triggerCompile(editor);
        }
    });
    context.subscriptions.push(textChange);

    // Check if active editor is already a TikZ file on activation
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isTikzFile(activeEditor)) {
        preview.show(activeEditor.document.fileName);
        doCompile(activeEditor);
    }

    context.subscriptions.push({
        dispose: () => {
            compiler.dispose();
            preview.dispose();
        },
    });
}

export function deactivate() {}
```

- [ ] **Step 2: Commit**

```bash
git add src/extension.ts
git commit -m "$(cat <<'EOF'
✨ feat(extension): wire compiler, preview, watchers, and debounce

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>
EOF
)"
```

---

### Task 8: Build and verify

**Files:** none (verification only)

- [ ] **Step 1: Run type check**

Run: `npm run check-types`
Expected: No errors

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors or only pre-existing warnings

- [ ] **Step 3: Build the extension**

Run: `npm run compile`
Expected: "Copied pdf.min.js to media/" and "Copied pdf.worker.min.js to media/" in output, no errors. `dist/extension.js` exists.

- [ ] **Step 4: Verify dist/extension.js was created**

Run: `ls -la dist/extension.js`
Expected: File exists and is non-empty

- [ ] **Step 5: Commit any build artifacts to .gitignore check**

Run: `git status`
Expected: dist/ and out/ are already git-ignored (no files shown). Only tracked files should be modified source files.

- [ ] **Step 6: Final commit if needed**

If any changes from lint fixes or adjustments:
```bash
git add -A && git diff --cached --stat
```
