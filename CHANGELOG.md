# Change Log

## [0.1.0] - 2026-06-09

### Added
- Live PDF preview for TikZ files (.tikz, .pgf, .tkz) in a side panel
- Template system: replace a placeholder with document content before compilation
- Bundled default LaTeX template, support for custom `.pgs` templates
- Configurable LaTeX compiler (pdflatex, lualatex, xelatex), shell-escape flag
- Zoom controls (in/out buttons, fit-to-width, manual percentage input)
- HiDPI/Retina-aware canvas rendering
- Compilation in temp directory (no workspace pollution)
- `\input`/`\include` file copying from template directory
- Compilation error display inline in the preview panel
- Output channel for compilation errors (manual check only)
- Editor toolbar button (zap icon) for quick preview toggle
- Settings: `latexCommand`, `shellEscape`, `templatePath`, `templatePlaceholder`, `autoOpen`, `autoOpenExtensions`
- 1-second debounce on file changes to reduce unnecessary compilations
- Focus preservation: editor keeps focus when preview opens or updates
