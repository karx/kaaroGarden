Tag and publish a new release of ebrain-gardener.

The target version is: $ARGUMENTS

## Steps

### 1. Determine version
If $ARGUMENTS is empty, read the current version from `package.json` and ask the user what the new version should be (patch / minor / major, or an explicit semver string). Otherwise use $ARGUMENTS as the new version exactly as provided.

Validate that the version string matches `X.Y.Z` semver format before proceeding.

### 2. Build
Run `npm run build` and confirm it exits cleanly. If it fails, stop and report the error.

### 3. Update version files
Update the `"version"` field to the new version in both:
- `package.json`
- `manifest.json`

### 4. Update CHANGELOG.md
Inspect commits since the last git tag (`git log <last-tag>..HEAD --oneline`) to compile a list of changes. Add a new entry at the top of the `## [Unreleased]` section (or directly below the `# Changelog` header if no such section exists), using this format:

```
## [X.Y.Z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

Only include sections that have relevant entries. Use today's date.

### 5. Commit
Stage `package.json`, `manifest.json`, and `CHANGELOG.md`, then commit with the message:
```
chore: release vX.Y.Z
```

### 6. Tag
Create an annotated git tag:
```
git tag -a X.Y.Z -m "Release vX.Y.Z"
```

### 7. Push
Push the current branch and the new tag:
```
git push origin <current-branch> --tags
```

### 8. GitHub release
Create a GitHub release using `gh release create`:
- Tag: `X.Y.Z`
- Title: `vX.Y.Z`
- Body: the CHANGELOG entry for this version (the bullet points, not the header)
- Attach `main.js`, `manifest.json`, and `styles.css` as release assets (these are the files Obsidian BRAT and manual installers need)

Use:
```
gh release create X.Y.Z main.js manifest.json styles.css \
  --title "vX.Y.Z" \
  --notes "<changelog body>"
```

### 9. Confirm
Report the tag, the GitHub release URL, and the list of attached assets.
