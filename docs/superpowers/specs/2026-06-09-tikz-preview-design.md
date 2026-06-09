# TikZ Preview - VS Code Extension Design Spec

**Date:** 2026-06-09
**Status:** Approved

## Overview

A VS Code extension that provides live PDF preview for TikZ files (`.tikz`, `.pgf`, `.tkz`).
Replaces a configurable placeholder in a LaTeX template with the document content,
compiles in a temp directory, and renders the resulting PDF in a side-panel webview using PDF.js.

## Configuration

Four settings contributed under the `TikZ Preview` heading in VS Code Settings:

| Setting | Type | Default | Description |
|---|---|---|---|
| `tikz-preview.latexCommand` | `string` | `pdflatex` | LaTeX compiler command (pdflatex, lualatex, xelatex, etc.) |
| `tikz-preview.shellEscape` | `boolean` | `false` | Pass `-shell-escape` flag to the compiler |
| `tikz-preview.templatePath` | `string` | `""` (empty = use built-in) | Path to `.pgs` template file |
| `tikz-preview.templatePlaceholder` | `string` | `<>` | String in template replaced with document content |

When `templatePath` is empty or the file is not found, a built-in default template
bundled with the extension at `templates/default.pgs` is used as fallback.

## Architecture

```
src/extension.ts     — entry point, registers command + settings, wires modules
src/compiler.ts      — template substitution + latex compilation in temp dir
src/preview.ts       — webview panel manager, PDF.js rendering
media/viewer.html    — webview HTML shell (canvas, controls)
media/viewer.js      — PDF.js loading, rendering, zoom
media/pdf.worker.min.js — PDF.js worker (bundled from pdfjs-dist)
```

### Data Flow

```
File change (.tikz/.pgf/.tkz)
    ↓ (debounce 300ms)
Compiler (temp dir, template substitution, latex)
    ↓
Success? ─── Yes → Send PDF path → Webview (PDF.js render)
    │
    No → Show error in output channel + webview
```

## Module Details

### extension.ts

- Activates on workspace open if any `.tikz`/`.pgf`/`.tkz` files exist (`workspaceContains` activation events)
- Registers the `tikz-preview.preview` command to manually open/toggle the preview panel
- Listens to `vscode.window.onDidChangeActiveTextEditor` to auto-open preview for matching file types
- Listens to `vscode.workspace.onDidChangeTextDocument` to trigger re-compilation on edits
- Passes configuration values to compiler and preview modules

### compiler.ts

Inputs: document text, template path (from config), placeholder (from config), latex command, shell-escape flag.

Steps:
1. Load template from `templatePath` or fall back to built-in template
2. Replace placeholder string with document text: `template.replace(placeholder, documentText)`
3. Create temp directory: `os.tmpdir()/tikz-preview-XXXXX/`
4. Write `source.tex` to temp directory
5. Build LaTeX arguments:
   - `-interaction=nonstopmode`
   - `-halt-on-error`
   - `-file-line-error`
   - `-shell-escape` (only if `shellEscape` config is true)
   - `source.tex`
6. Spawn child process: `child_process.spawn(latexCmd, args, { cwd: tempDir })`
7. Capture stdout and stderr
8. Resolve: `{ pdfPath: string }` on success, `{ error: string }` on failure

Error extraction: parse LaTeX output for lines starting with `! ` and the following context
lines (up to the next line beginning with `l.` or end of error block).

### preview.ts

Manages a `vscode.WebviewPanel`:

- Panel title: document filename with "Preview" suffix
- Revealed in `ViewColumn.Beside` (split next to editor)
- Content loaded from `media/viewer.html`
- Communication via `postMessage`:
  - Host → Webview: `{ type: 'render', pdfPath: string }` and `{ type: 'error', message: string }`
- Uses `vscode.Uri.file()` with the panel's webview `asWebviewUri` for local PDF access
- Retains panel across compilations; only creates a new one if the existing one was closed

### Webview (viewer.html + viewer.js)

- Loads `pdf.js` (bundled `pdfjs-dist`) and configures the worker path
- On `render` message: `pdfjsLib.getDocument(uri)` → render first page to `<canvas>`
- Controls: zoom in/out, fit-to-width, page indicator (supports multi-page PDFs)
- Dark background for contrast with typical white PDF pages
- On `error` message: show red error text inline

## Activation Events

```json
"activationEvents": [
  "workspaceContains:**/*.tikz",
  "workspaceContains:**/*.pgf",
  "workspaceContains:**/*.tkz",
  "onCommand:tikz-preview.preview"
]
```

## Error Handling

- **Missing template:** if `templatePath` file doesn't exist, fall back to built-in template and show a warning
- **LaTeX not found:** catch `ENOENT` spawn error, show "LaTeX command not found: <cmd>" in output channel
- **Compilation error:** extract error lines from LaTeX output, show in output channel + webview
- **PDF.js worker not found:** show error in webview
- **Temp dir cleanup:** delete old temp dirs on extension deactivation; keep current one for PDF.js access during the session

## Edge Cases

- **Untitled (unsaved) files:** use the editor's in-memory content directly
- **Multi-page PDFs:** PDF.js supports pagination — the viewer includes page navigation
- **File outside workspace:** treat as any other file (use its full content)
- **Rapid edits:** 300ms debounce prevents excessive compilation
- **Concurrent compilations:** if a new compilation starts before the previous finishes, kill the previous process

## Dependencies

- **Runtime:** `pdfjs-dist` (bundled, for PDF rendering in webview)
- **System:** LaTeX distribution (`pdflatex`, `lualatex`, or `xelatex` must be on PATH)
- **Dev only:** existing devDependencies (esbuild, typescript, eslint, mocha, etc.)

## File Structure After Implementation

```
src/
├── extension.ts      — entry point
├── compiler.ts       — latex compilation logic
├── preview.ts        — webview panel manager
media/
├── viewer.html       — webview HTML
├── viewer.js         — PDF.js rendering logic
├── pdf.worker.min.js — PDF.js worker (copied from pdfjs-dist)
templates/
└── default.pgs       — bundled default template
```
