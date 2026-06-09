import * as path from 'path';
import * as vscode from 'vscode';
import { Compiler } from './compiler';
import { PreviewManager } from './preview';

export function activate(context: vscode.ExtensionContext) {
    console.log('TikZ Preview extension activated');

    const compiler = new Compiler(context.extensionUri);
    const preview = new PreviewManager(context.extensionUri);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let svgActive = false;

    function getAutoExtensions(): Set<string> {
        const cfg = vscode.workspace.getConfiguration('tikz-preview');
        const exts = cfg.get<string[]>('autoOpenExtensions', ['.tikz', '.pgf', '.tkz']);
        return new Set(exts);
    }

    function getConfig() {
        const cfg = vscode.workspace.getConfiguration('tikz-preview');
        return {
            latexCommand: cfg.get<string>('latexCommand', 'pdflatex'),
            shellEscape: cfg.get<boolean>('shellEscape', false),
            templatePath: cfg.get<string>('templatePath', ''),
            placeholder: cfg.get<string>('templatePlaceholder', '<>'),
            autoOpen: cfg.get<boolean>('autoOpen', false),
            previewMode: cfg.get<string>('previewMode', 'pdf'),
            svgConverter: cfg.get<string>('svgConverter', 'pdftocairo'),
        };
    }

    function isTikzFile(editor: vscode.TextEditor | undefined): boolean {
        if (!editor) { return false; }
        const ext = editor.document.fileName.match(/\.\w+$/)?.[0] ?? '';
        return getAutoExtensions().has(ext);
    }

    async function doCompile(editor: vscode.TextEditor) {
        const config = getConfig();
        const text = editor.document.getText();
        const baseName = path.basename(editor.document.fileName, path.extname(editor.document.fileName));
        const result = await compiler.compile(
            text,
            config.templatePath,
            config.placeholder,
            config.latexCommand,
            config.shellEscape,
            baseName
        );

        if ('pdfPath' in result) {
            if (config.previewMode === 'svg') {
                try {
                    const svgPath = await compiler.convertToSvg(result.pdfPath, baseName, config.svgConverter);
                    await vscode.commands.executeCommand('_svg.showSvgByUri', vscode.Uri.file(svgPath));
                } catch (err) {
                    preview.showError((err as Error).message);
                }
            } else {
                preview.render(result.pdfPath);
            }
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
        }, 1000);
    }

    // Command: manual preview toggle
    const previewCommand = vscode.commands.registerCommand('tikz-preview.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const config = getConfig();
        if (config.previewMode === 'pdf') {
            preview.show(editor.document.fileName);
        } else {
            svgActive = true;
        }
        doCompile(editor);
    });
    context.subscriptions.push(previewCommand);

    // Update preview when switching to a TikZ file
    const activeEditorChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && isTikzFile(editor)) {
            const config = getConfig();
            const shouldCompile = config.autoOpen
                || svgActive
                || preview.isVisible();
            if (shouldCompile) {
                if (config.previewMode === 'pdf') {
                    preview.show(editor.document.fileName);
                }
                doCompile(editor);
            }
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
        const config = getConfig();
        const shouldCompile = config.autoOpen
            || svgActive
            || preview.isVisible();
        if (shouldCompile) {
            if (config.previewMode === 'pdf') {
                preview.show(activeEditor.document.fileName);
            }
            doCompile(activeEditor);
        }
    }

    context.subscriptions.push({
        dispose: () => {
            compiler.dispose();
            preview.dispose();
        },
    });
}

export function deactivate() {}
