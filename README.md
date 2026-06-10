# TikZ Preview

Live preview for TikZ files in VS Code — like KtikZ, but inside your editor.

[中文说明](README.zh-CN.md)

Edit `.tikz`, `.pgf`, or `.tkz` files and see the compiled PDF update in a side panel.

## Features

- **Live preview** — auto-compiles on file changes (1s debounce)
- **Configurable compiler** — supports `pdflatex`, `lualatex`, `xelatex`, shell-escape
- **Template system** — use custom `.pgs` template files, or the bundled default
- **Zoom controls** — zoom in/out, fit-to-width, or type a percentage manually
- **Error display** — compilation errors shown inline in the preview panel
- **SVG preview** — optional SVG mode via `jock.svg` extension (pdftocairo/pdf2svg conversion)
- **Dark theme** — preview panel matches VS Code's dark interface

## Requirements

- A LaTeX distribution with `pdflatex` (or your chosen compiler) on `PATH`
- VS Code 1.120+

## Extension Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `tikz-preview.latexCommand` | `string` | `pdflatex` | LaTeX compiler command |
| `tikz-preview.shellEscape` | `boolean` | `false` | Pass `-shell-escape` flag |
| `tikz-preview.templatePath` | `string` | `""` | Path to a `.pgs` template file (empty = bundled default) |
| `tikz-preview.templatePlaceholder` | `string` | `<>` | String in template replaced with document content |
| `tikz-preview.autoOpen` | `boolean` | `false` | Auto-open preview when switching to a matching file |
| `tikz-preview.autoOpenExtensions` | `string[]` | `[".tikz", ".pgf", ".tkz"]` | Extensions that trigger auto preview |
| `tikz-preview.previewMode` | `string` | `"pdf"` | Preview mode: `"pdf"` (built-in) or `"svg"` (via jock.svg) |
| `tikz-preview.svgConverter` | `string` | `"pdftocairo"` | PDF-to-SVG converter: `"pdftocairo"` or `"pdf2svg"` |

## Usage

1. Open a `.tikz`, `.pgf`, or `.tkz` file
2. Run `TikZ: Preview` from the command palette, or click the bolt icon in the editor toolbar
3. The preview opens in a side panel and updates as you edit

Templates use a placeholder (default `<>`) that is replaced with your document content before compilation. All compilation happens in a temp directory — your workspace stays clean.

## Known Issues

- PDF.js runs in main-thread mode to avoid CSP restrictions with web workers

## Release Notes

### 0.3.0

Workspace trust guard, smarter recompilation, SVG preview state management.

### 0.2.1

Extension dependency declaration, release skill, minor fixes.

### 0.2.0

SVG preview mode via jock.svg, PDF-to-SVG conversion, Chinese docs.

### 0.1.0

Initial release — live TikZ preview with template support, zoom controls, and configurable compilation.
