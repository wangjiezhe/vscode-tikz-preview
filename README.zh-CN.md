# TikZ Preview

在 VS Code 中实时预览 TikZ 文件 — 类似 KtikZ，但集成在编辑器内。

编辑 `.tikz`、`.pgf` 或 `.tkz` 文件，在侧边面板中查看编译后的 PDF。

## 功能

- **实时预览** — 文件修改后自动编译（1 秒防抖）
- **可配置编译器** — 支持 `pdflatex`、`lualatex`、`xelatex`，可开启 shell-escape
- **模板系统** — 使用自定义 `.pgs` 模板文件，或使用内置默认模板
- **缩放控制** — 放大/缩小、适应宽度、手动输入百分比
- **错误显示** — 编译错误直接显示在预览面板中
- **SVG 预览** — 可选 SVG 模式，通过 `jock.svg` 扩展显示（pdftocairo/pdf2svg 转换）
- **深色主题** — 预览面板与 VS Code 深色界面一致

## 依赖

- 系统需安装 LaTeX 发行版，`pdflatex`（或你选择的编译器）需在 `PATH` 中
- VS Code 1.120+

## 扩展设置

| 设置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `tikz-preview.latexCommand` | `string` | `pdflatex` | LaTeX 编译器命令 |
| `tikz-preview.shellEscape` | `boolean` | `false` | 传递 `-shell-escape` 参数 |
| `tikz-preview.templatePath` | `string` | `""` | `.pgs` 模板文件路径（留空使用内置默认模板） |
| `tikz-preview.templatePlaceholder` | `string` | `<>` | 模板中将被替换为文档内容的字符串 |
| `tikz-preview.autoOpen` | `boolean` | `false` | 切换到匹配文件时自动打开预览 |
| `tikz-preview.autoOpenExtensions` | `string[]` | `[".tikz", ".pgf", ".tkz"]` | 触发自动预览的文件扩展名 |
| `tikz-preview.previewMode` | `string` | `"pdf"` | 预览模式：`"pdf"`（内置预览）或 `"svg"`（通过 jock.svg） |
| `tikz-preview.svgConverter` | `string` | `"pdftocairo"` | PDF 转 SVG 工具：`"pdftocairo"` 或 `"pdf2svg"` |

## 使用方法

1. 打开一个 `.tikz`、`.pgf` 或 `.tkz` 文件
2. 在命令面板中运行 `TikZ: Preview`，或点击编辑器工具栏的闪电图标
3. 预览将在侧边面板中打开，并随编辑实时更新

模板使用占位符（默认为 `<>`），编译前会被替换为你的文档内容。所有编译工作在临时目录中进行，不会污染工作区。

## 已知问题

- PDF.js 在主线程模式下运行，以规避 CSP 对 Web Worker 的限制

## Release Notes

### 0.3.0

工作区信任保护、智能重编译、SVG 预览状态管理。

### 0.2.1

扩展依赖声明、Release skill、小修复。

### 0.2.0

SVG 预览模式、PDF 转 SVG 支持、中文文档。

### 0.1.0

初始版本 — Live TikZ Preview，支持模板系统、缩放控制和可配置编译。
