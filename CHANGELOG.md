# Change Log

[中文更新日志](CHANGELOG.zh-CN.md)

## [0.3.2] - 2026-06-10

### Changed
- Screenshot links use `raw.githubusercontent.com` instead of local paths
- Exclude `screenshots/` from extension bundle via `.vscodeignore`

## [0.3.1] - 2026-06-10

### Added
- Screenshots of PDF and SVG preview
- `tkz-elements.pgs` template content in README
- SVG converter (`pdftocairo` / `pdf2svg`) dependency note in README
- KtikZ reference for configuration and usage guidance

### Changed
- README tagline now highlights both PDF and SVG preview modes
- Chinese README: "Release Notes" translated to Chinese

### Fixed
- Correct bugs URL in `package.json`

## [0.3.0] - 2026-06-10

### Added
- Workspace trust guard — compilation is blocked in untrusted workspaces

### Changed
- Preview panel respects active preview state — no unnecessary recompilation
- SVG preview state resets when the preview tab is closed

### Fixed
- Stale compilation results are ignored when a new compile starts

## [0.2.1] - 2026-06-10

### Added
- Declare `jock.svg` as extension dependency for automatic installation prompt
- Release skill for automated version bump workflows

### Fixed
- Both `version` fields in package-lock.json are now updated during release

## [0.2.0] - 2026-06-10

### Added
- SVG preview mode via `jock.svg` extension (`_svg.showSvgByUri`)
- PDF-to-SVG conversion: pdftocairo and pdf2svg support
- Settings: `previewMode` (pdf/svg), `svgConverter` (pdftocairo/pdf2svg)
- Chinese README and CHANGELOG
- MIT license

### Fixed
- SVG mode no longer opens PDF preview panel on command
- SVG preview refreshes correctly on content changes
- `autoOpen: false` respected in SVG mode

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
