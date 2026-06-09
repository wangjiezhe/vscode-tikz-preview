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
    private templateDir: string | null = null;
    private svgCounter = 0;

    constructor(private extensionUri: vscode.Uri) {}

    async compile(
        documentText: string,
        templatePath: string,
        placeholder: string,
        latexCommand: string,
        shellEscape: boolean,
        baseName: string
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

        const texFile = baseName + '.tex';
        const sourcePath = path.join(this.tempDir, texFile);
        fs.writeFileSync(sourcePath, source);

        if (this.templateDir) {
            this.copyInputFiles(source, this.templateDir);
        }

        const args: string[] = [
            '-interaction=nonstopmode',
            '-halt-on-error',
            '-file-line-error',
        ];
        if (shellEscape) {
            args.push('-shell-escape');
        }
        args.push(texFile);

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
                const pdfFile = baseName + '.pdf';
                const pdfPath = path.join(this.tempDir!, pdfFile);
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
        this.templateDir = null;

        if (templatePath && fs.existsSync(templatePath)) {
            this.templateDir = path.dirname(templatePath);
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

    private copyInputFiles(source: string, dir: string): void {
        const re = /\\(?:input|include)\s*\{([^}]+)\}|\\(?:input|include)\s+(\S+)/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(source)) !== null) {
            const filename = match[1] ?? match[2];
            const src = path.resolve(dir, filename);
            if (fs.existsSync(src) && fs.statSync(src).isFile()) {
                const dest = path.join(this.tempDir!, path.basename(src));
                if (!fs.existsSync(dest)) {
                    fs.copyFileSync(src, dest);
                    const subSource = fs.readFileSync(src, 'utf8');
                    this.copyInputFiles(subSource, dir);
                }
            }
        }
    }

    async convertToSvg(pdfPath: string, baseName: string, converter: string): Promise<string> {
        // Walk counter to produce unique filename each time so jock.svg
        // detects it as a new file and refreshes its preview.
        do { this.svgCounter++; } while (
            fs.existsSync(path.join(this.tempDir!, `${baseName}-${this.svgCounter}.svg`))
        );
        const svgPath = path.join(this.tempDir!, `${baseName}-${this.svgCounter}.svg`);

        // Remove previous SVG to avoid accumulating files
        const prevSvgPath = path.join(this.tempDir!, `${baseName}-${this.svgCounter - 1}.svg`);
        if (fs.existsSync(prevSvgPath)) {
            try { fs.unlinkSync(prevSvgPath); } catch { /* ignore */ }
        }

        const args = converter === 'pdf2svg'
            ? [pdfPath, svgPath]
            : ['-svg', pdfPath, svgPath];
        const cmd = converter === 'pdf2svg' ? 'pdf2svg' : 'pdftocairo';

        return new Promise((resolve, reject) => {
            const proc = cp.spawn(cmd, args);
            let stderr = '';

            proc.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0 && fs.existsSync(svgPath)) {
                    resolve(svgPath);
                } else {
                    reject(new Error(`${cmd} failed: ${stderr || 'unknown error'}`));
                }
            });

            proc.on('error', (err) => {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                    reject(new Error(`SVG converter not found: ${cmd}`));
                } else {
                    reject(err);
                }
            });
        });
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
