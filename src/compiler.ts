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
