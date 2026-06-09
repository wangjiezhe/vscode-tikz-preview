---
name: release
description: Use when releasing a new version of the vscode-tikz-preview extension. Handles version bump, changelog updates, readme updates, commit, and git tag. Triggers on phrases like "release vX.Y.Z", "bump version", "发布新版本", "release 0.3.0".
---

# Release Workflow

Release a new version of the vscode-tikz-preview extension.

## Steps

Carry out each step in order.

### 1. Determine the new version

The user should specify the version, e.g. `0.3.0`. If they don't, ask.

### 2. Update version in manifest files

Update the `"version"` field in both files to the new version:

- `package.json`
- `package-lock.json` (use `sed` since the file is large)

### 3. Update CHANGELOG files

Review `git log --oneline <last-tag>..HEAD` to identify new features and fixes since the last release.

Prepend a new section to both files:

- `CHANGELOG.md` — in English
- `CHANGELOG.zh-CN.md` — in Chinese

Format:

```markdown
## [<version>] - <YYYY-MM-DD>

### Added
- <feature>

### Fixed
- <fix>
```

### 4. Update README files

Add a one-line release note under `## Release Notes` in both files:

- `README.md`
- `README.zh-CN.md`

### 5. Commit and tag

```bash
git add package.json package-lock.json CHANGELOG.md CHANGELOG.zh-CN.md README.md README.zh-CN.md
git commit -m "🔖 release: v<version>

Co-Authored-By: Claude Code CLI <noreply@anthropic.com>
Co-Authored-By: DeepSeek V4 Pro <noreply@deepseek.com>"
git tag v<version>
```
