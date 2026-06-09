---
name: release
description: Use when releasing a new version of the vscode-tikz-preview extension. Handles version bump, changelog updates, readme updates, commit, and git tag. Triggers on phrases like "release vX.Y.Z", "bump version", "bump major/minor/patch version", "发布新版本", "release 0.3.0".
---

# Release Workflow

Release a new version of the vscode-tikz-preview extension.

## Steps

Carry out each step in order.

### 1. Determine the new version

Read the current version from `package.json` (`"version"` field).

Interpret the user's request:

| Command | Action |
|---|---|
| `bump major version` | Increment X in X.Y.Z, reset Y and Z to 0 |
| `bump minor version` | Increment Y in X.Y.Z, reset Z to 0 |
| `bump patch version` | Increment Z in X.Y.Z |
| `bump version` | Default to bumping the patch version (increment Z) |
| `release vX.Y.Z` or explicit version | Use the version directly |

Examples:
- Current `0.2.0` + `bump major` → `1.0.0`
- Current `0.2.0` + `bump minor` → `0.3.0`
- Current `0.2.0` + `bump patch` → `0.2.1`

### 2. Update version in manifest files

Update the `"version"` field in both files to the new version:

- `package.json`
- `package-lock.json` — has TWO places: the root `"version"` field and inside the `"packages"."".version"` entry. Update both. Verify with `grep -n '"version": "<old>"' package-lock.json` that no old version remains.

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
