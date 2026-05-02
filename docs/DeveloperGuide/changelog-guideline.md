# Changelog Creation Guideline

**Last Updated:** 2026-05-02

## 1. Core Philosophy: Separation of Concerns

In this project, the changelog is managed by separating "accumulated data" from the "displayed UI."

1. **Markdown as Data (`changelog.md`)**:
	- Describes the content in a correct hierarchical structure (using H2 for versions) without depending on specific HTML structures.
	- Adopts the versatile [Keep a Changelog](https://keepachangelog.com/ "Keep a Changelog") format, prioritizing readability on GitHub and in editors.
2.  **Rendering as UI (JS/Svelte)**:
	- Parses the Markdown data and dynamically maps heading levels to match the hierarchy of the page (H1/H2, etc.) where it is placed.

## 2. Data Standard

### 2.1 Hierarchy

Fixed to the following hierarchy within the Markdown file, in compliance with [Keep a Changelog](https://keepachangelog.com/ "Keep a Changelog").

- **Level 1 (`#`)**: Always `# Changelog` (to maintain a versatile data format).
- **Level 2 (`##`)**: Version heading (e.g., `## [1.21.0] - 2026-04-27`)
- **Level 3 (`###`)**: Change category (e.g., `### Added`, `### Fixed`)

### 2.2 Format
- **Date Format**: Standardized to `YYYY-MM-DD` (ISO 8601).
- **Version Number**: Complies with [Semantic Versioning](https://semver.org/), written in `[MAJOR.MINOR.PATCH]` format.

### 2.3 Category Labels (Keep a Changelog Compliant)

#### Categories

Consolidated into the following 6 types. Legacy labels like `improve`, `clean`, or `change` should be remapped to these.

- `Added`: For new features.
- `Changed`: For changes in existing functionality (excluding refactoring).
- `Deprecated`: For soon-to-be removed features.
- `Removed`: For now removed features.
- `Fixed`: For any bug fixes.
- `Security`: In case of vulnerabilities.

#### Mapping

The relationship between `Keep a Changelog` categories and `Conventional Commits` `<type>` is as follows:

| Keep a Changelog | Conventional Commits `<type>` | Description |
| :--- | :--- | :--- |
| **Added** | `feat` | Adding new features |
| **Changed** | `feat`, `perf`, `refactor`, `chore(deps)` | Changes to existing features, performance improvements, user-facing internal changes, dependency updates |
| **Deprecated** | `feat`, `refactor` | Deprecating existing features (often accompanied by `BREAKING CHANGE`) |
| **Removed** | `feat`, `refactor` | Removing features (often accompanied by `BREAKING CHANGE`) |
| **Fixed** | `fix` | Bug fixes |
| **Security** | `fix`, `chore(deps)` | Security vulnerability fixes, security-related dependency updates |

> [!NOTE]
> Types such as `style`, `test`, `build`, `ci`, `chore`, and `revert` are generally not included in the end-user-facing changelog (`changelog.md`).
>
> **Exceptional cases:**
> - **`docs`**: While internal documentation (README, dev docs) is excluded, **significant updates or new additions to the "User Guide" or "Manual"** should be listed as `Added` or `Changed` as they directly benefit the user.
> - **`chore(deps)`**: Include as `Changed` or `Security` only for major version updates or those directly impacting performance or security. Omit minor patch updates.

## 3. Writing Rules

### 3.1 User-Centric Perspective

The target audience is the end-user. Avoid internal implementation details and describe changes that the user can experience.

- **NOT Recommended (Implementation Detail)**: `Refactored UrlDelayCalculator.ts to optimize wait logic for asynchronous processing.`
- **Recommended (User Experience)**: `Improved stability when opening a large number of URLs at once, resolving the issue where the browser would occasionally freeze.`

### 3.2 Style and Prohibitions

- **Tense**: Standardized to past tense for categories (e.g., `Added`, `Fixed`).
- **No Paths or Class Names**: Do not include source code paths (`project/src/...`) or class names.
- **No Raw URLs**: Do not paste raw URL strings for commit links or others.

## 4. Mapping to Display Logic

The logic for converting and rendering Markdown data into HTML is the responsibility of the **application side (Svelte components, etc.)**, based on the following rules:

- **Heading Level Adjustment**: Maps version headings (`##`) and category headings (`###`) to the appropriate hierarchy based on the surrounding HTML structure.
- **External Link Handling**: Automatically adds `target="_blank" rel="noopener noreferrer"` for security and convenience.

## 5. Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2023-03-05

### Added

- Arabic translation (#444).
- v1.1 French translation.
- v1.1 Dutch translation (#371).
- v1.1 Russian translation (#410).
- v1.1 Japanese translation (#363).
- v1.1 Norwegian Bokmål translation (#383).
- v1.1 "Inconsistent Changes" Turkish translation (#347).
- Default to most recent versions available for each language.
- Display count of available translations (26 to date!).
- Centralize all links into `/data/links.json` so they can be updated easily.

### Fixed

- Improve French translation (#377).
- Improve id-ID translation (#416).
- Improve Persian translation (#457).
- Improve Russian translation (#408).
- Improve Swedish title (#419).
- Improve zh-CN translation (#359).
- Improve French translation (#357).
- Improve zh-TW translation (#360, #355).
- Improve Spanish (es-ES) translation (#362).
- Foldout menu in Dutch translation (#371).
- Missing periods at the end of each change (#451).
- Fix missing logo in 1.1 pages.
- Display notice when translation isn't for most recent version.
- Various broken links, page versions, and indentations.

### Changed

- Upgrade dependencies: Ruby 3.2.1, Middleman, etc.

### Removed

- Unused normalize.css file.
- Identical links assigned in each translation file.
- Duplicate index file for the english version.
```

## 6. Checklist

- [ ] Does the version heading use `##` (H2)?
- [ ] Is the date in `YYYY-MM-DD` format?
- [ ] Are categories restricted to the standard 6 types?
- [ ] Is the description user-centric (no implementation details)?
- [ ] Are there no raw URLs for commits or other links?