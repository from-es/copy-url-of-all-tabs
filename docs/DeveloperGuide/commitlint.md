# commitlint: Commit Message Guidelines

**Last Updated:** August 11, 2025

To ensure that our commit history is readable, consistent, and easy to navigate, we adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Overview

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history, which makes it easier to write automated tools on top of.

## Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

1.  **Header (Required):** The first line of the commit message, including the **type**, an optional **scope**, and the **description**.
    - **type**: Describes the kind of change you are committing.
    - **scope**: Refers to the section of the codebase affected by the commit.
    - **description**: A short, imperative-tense summary of the code change.

2.  **Body (Optional):** Provides a more detailed explanation. It offers additional context to explain the "what" and "why" of the change. It should be separated from the Header by a single blank line.

3.  **Footer (Optional):** Used to reference issue tracking system IDs (e.g., `Fixes #123`) or to indicate a breaking change. It should be separated from the Body by a single blank line.
    - **Breaking Change:** Start with `BREAKING CHANGE:` and describe the changes and migration methods.
    - **Closing Issues:** Write as `Closes #123`, `Fixes #456`, etc.

### Type

| Prefix     | Description                                                                                                |
| :--------- | :--------------------------------------------------------------------------------------------------------- |
| `feat!`    | **Breaking Change** (Introduces a breaking API change, correlates with **MAJOR** in Semantic Versioning)   |
| `feat`     | **New Feature** (Adds a new feature, correlates with **MINOR** in Semantic Versioning)                     |
| `fix`      | **Bug Fix** (A bug fix, correlates with **PATCH** in Semantic Versioning)                                    |
| `docs`     | **Documentation only** changes                                                                             |
| `style`    | Changes that do not affect the meaning of the code (formatting, indentation, whitespace, semicolons, etc.) |
| `refactor` | A code change that neither fixes a bug nor adds a feature                                                  |
| `perf`     | A code change that improves performance                                                                    |
| `test`     | Adding or correcting tests                                                                                 |
| `build`    | Changes that concern the build system or external dependencies (e.g., npm, webpack)                        |
| `ci`       | Changes to CI (Continuous Integration) configuration or scripts (e.g., GitHub Actions)                     |
| `chore`    | Miscellaneous changes that do not fit into any of the above categories (e.g., updating build tasks, package management) |
| `revert`   | Changes that revert a previous commit                                                                      |

### Scope

The scope is intended to specifically indicate the section of the codebase that the commit affects.

**Importantly, there is no fixed list of scopes defined by the convention.** The choice of scope is defined by each project or team. To maintain consistency, it is a good practice for the team to agree on a common list of scopes.

Below are examples of commonly used scopes. Please use appropriate ones according to the project's structure.

- **Page or screen names**
  - `login`, `profile`, `settings`, `home`
- **Features or concerns**
  - `api`, `auth`, `ui`, `db`, `routes`, `search`
- **Library or package names**
  - `core`, `utils`, `components`, `shared`, `design-system`
- **Configuration files, etc.**
  - `config`, `ci`, `build`, `deps`

**Examples:**
- `feat(login): Add password reset functionality`
- `fix(api): Enhance null checks on user retrieval endpoint`
- `docs(readme): Update setup instructions`

## Commit Message Examples

### Example 1: Adding a New Feature (feat)
Including a scope and a detailed body makes the change clearer.

```
feat(options): add custom delay rules for pasting URLs

This allows users to configure specific delays for different URL
patterns, providing more granular control over tab opening behavior.
```

```
feat(auth): Add biometric authentication to login feature

Allows users to log in with fingerprints or facial recognition instead of passwords.
This improves security and convenience.

Closes #42
```

### Example 2: Bug Fix (fix)
From simple fixes to fixes that close issues.

```
fix: Fix profile image display corruption

Fixed an issue where image corners were not rounded under certain conditions,
causing them to appear square.
```

```
fix(popup): prevent crash when clipboard is empty

Closes #42
```

### Example 3: Breaking Change
Including `BREAKING CHANGE:` in the footer or `!` in the header's `type` indicates an incompatible change.

**Example using footer:**
```
refactor(storage): change settings data structure

BREAKING CHANGE: The structure of the settings object stored in
`chrome.storage.local` has been updated. Old settings are no longer
compatible and require a migration script.
```

**Example using `!`:**
```
refactor!(storage): change settings data structure

The structure of the settings object stored in
`chrome.storage.local` has been updated. Old settings are no longer
compatible and require a migration script.
```

### Example 4: Message Violating Rules
If a commit message violates the rules, the commit will fail and an error will be displayed.

**Error Example:**
```
husky - commit-msg hook exited with code 1 (error)
⧗   input: Fix profile image
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

This error indicates that the message lacks a `type` and the `subject` format is incorrect.
Correct the message according to the error content and commit again.

**Corrected Example:**
To fix the error, add a `type` and format the message according to the convention.

```
fix: Fix profile image
```

### Other Commit Examples

#### Documentation Update (docs)
```
docs(readme): Update setup instructions
```

#### Refactoring (refactor)
Used when improving code structure, not adding features or fixing bugs.
```
refactor(auth): Improve authentication logic to a more efficient method
```

#### Style Fix (style)
Fixes to formatting or indentation that do not affect code behavior.
```
style(all): Standardize formatting across the project
```

#### Typo or Minor Fix (fix)
`fix` can also be used for correcting typos in text or other minor corrections that are not functional bugs.
```
fix(settings): Fix typo in settings screen label
```

## How to Commit with Sourcetree

After understanding the above rules, commit as usual from Sourcetree.

1.  Stage the changed files.
2.  Enter `<type>[(scope)]: <description>` in the first line of the commit message.
3.  If necessary, add a blank line on the second line, and write the detailed Body or Footer from the third line onwards.
4.  Click the commit button.

## Q&A

### Q. Is there a way to commit messages that do not follow the rules defined by commitlint after it has been applied?

Yes, there are several ways to commit messages that do not follow the rules, even in a repository where commitlint is applied.

#### Using the `--no-verify` option

The most common and easiest method is to add the `--no-verify` option to the `git commit` command.

```bash
git commit -m "This is a commit message that does not follow the rules" --no-verify
```

Using this option skips all Git pre-commit hooks and commit message hooks, including the `commit-msg` hook. Since `commitlint` typically uses the `commit-msg` hook to validate commit messages, this command allows you to bypass `commitlint` checks.

#### Temporarily disabling hooks

In certain situations, it is also possible to temporarily disable Git hooks and commit. However, in most cases, the `--no-verify` option is more convenient and safer.

#### Caution

The `--no-verify` option bypasses not only `commitlint` but also all configured commit-related hooks (e.g., `pre-commit` hooks that run static code analysis or tests). Therefore, when using this option, care must be taken to avoid unintended degradation of quality.

Fundamentally, team-defined commit message rules are important for maintaining a consistent and clean commit history. Bypassing rules should be limited to unavoidable cases.

### Q. When adding an explanatory image to the UI, is the type `docs`?

Using `feat` is more appropriate.

The `docs` type is generally used for changes to developer documentation files (e.g., `README.md`).

Adding an image directly to the application's UI (e.g., an options screen) is considered a user-visible enhancement or feature. Therefore, `feat` is the recommended type.

**Bad Example:**
```
docs(options): Add explanatory image to options screen
```
> This could be misinterpreted as a change to a documentation file named `options`.

**Good Example:**
```
feat(options): Add explanatory image to options screen
```
> This clearly communicates that a new feature (`feat`) was added to the options screen (`options`).

### Q. What `type` should be used for changes to `package.json` or `manifest.json`?

This depends on the nature of the change. Here are common scenarios:

#### 1. Updating dependencies in `package.json`
Use `build` or `chore`.
- `build`: For updates to packages that affect the build process (e.g., `vite`, `eslint`).
  ```
  build(deps): update vite to v5.0.0
  ```
- `chore`: For updates to other libraries or development tools.
  ```
  chore(deps): update lodash to v4.17.21
  ```

#### 2. Bumping the version in `manifest.json`
This is part of the release process, so `chore` is the most appropriate type.
```
chore(release): bump version to 2.1.0
```

#### 3. Adding permissions to `manifest.json`
The `type` depends on *why* the permission was added.
- **`feat`:** If the permission is required for a new feature (most common).
  ```
  feat(permissions): add storage permission to enable settings persistence
  ```
- **`fix`:** If a missing permission was causing a bug.
  ```
  fix(permissions): correct error caused by missing activeTab permission
  ```

### Q. How should I create a commit to mark a point in history, like a release, without any code changes?

The most recommended method is to combine the `chore` type with `git commit --allow-empty`.

For example, if you want to record the fact that "version 1.0.0 has been released" in the commit history, there are no actual code changes. Such a commit can be created as an **empty commit**.

**Recommended command:**
```bash
git commit --allow-empty -m "chore(release): v1.0.0"
```

#### Key Points
- **Why use `chore`?**: The `chore` type is used for miscellaneous tasks that do not involve source code or test changes, such as build process or auxiliary tool modifications. A release record falls into this category.
- **Why use `--allow-empty`?**: This option allows you to create a commit even if there are no file changes.
- **Why is this format good?**:
  - It complies with `commitlint` conventions, so it won't cause errors.
  - The intent of the commit is clear (the `release` scope indicates it's related to a release).
  - It integrates smoothly with automation tools like `semantic-release`.

**Format to avoid:**
```
# This will cause an error because it violates commitlint rules
git commit --allow-empty -m "Version 1.0.0 has been released."
```
Messages that do not follow the convention should be avoided as they undermine consistency.

## Official Resources

For more detailed information, please refer to the official commitlint documentation and the Conventional Commits specification.

- [commitlint Official Documentation](https://commitlint.js.org/#/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
