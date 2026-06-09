# 更新日志

## [0.2.1] - 2026-06-10

### 新增
- 声明 `jock.svg` 为扩展依赖，自动提示安装
- Release skill，支持语义化版本自动发布

### 修复
- 发布时同时更新 package-lock.json 中的两个 version 字段

## [0.2.0] - 2026-06-10

### 新增
- SVG 预览模式，通过 `jock.svg` 扩展（`_svg.showSvgByUri`）显示
- PDF 转 SVG 支持：pdftocairo 和 pdf2svg
- 设置项：`previewMode`（pdf/svg）、`svgConverter`（pdftocairo/pdf2svg）
- 中文 README 和 CHANGELOG
- MIT 许可证

### 修复
- SVG 模式下命令触发不再弹出 PDF 预览窗口
- SVG 预览在内容变化时正确刷新
- SVG 模式下尊重 `autoOpen: false` 设置

## [0.1.0] - 2026-06-09

### 新增
- TikZ 文件（.tikz、.pgf、.tkz）侧边面板实时 PDF 预览
- 模板系统：编译前将占位符替换为文档内容
- 内置默认 LaTeX 模板，支持自定义 `.pgs` 模板
- 可配置的 LaTeX 编译器（pdflatex、lualatex、xelatex）及 shell-escape
- 缩放控制（放大/缩小、适应宽度、手动输入百分比）
- HiDPI/Retina 高分屏画布渲染
- 临时目录编译，不污染工作区
- 从模板目录复制 `\input`/`\include` 引用的文件
- 编译错误内联显示在预览面板中
- 编译错误输出频道（需手动查看）
- 编辑器工具栏闪电图标一键预览
- 设置项：`latexCommand`、`shellEscape`、`templatePath`、`templatePlaceholder`、`autoOpen`、`autoOpenExtensions`
- 文件修改 1 秒防抖，减少不必要的编译
- 焦点保护：预览打开或更新时编辑器保持焦点
