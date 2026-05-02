# 更新履歴作成ガイドライン

**最終更新日:** 2026-05-02

## 1. 基本設計思想：関心の分離

本プロジェクトでは、更新履歴を「蓄積されるデータ」と「表示されるUI」に分けて管理します。

1.  **データとしての Markdown (`changelog.md`)**:
	*   特定のHTML構造に依存せず、ドキュメントとして正しい階層構造（H2をバージョンとする）で記述します。
	*   GitHubやエディタでの閲覧性を重視した、汎用的な [Keep a Changelog](https://keepachangelog.com/ "Keep a Changelog") 形式を採用します。
2.  **UIとしてのレンダリング (JS/Svelte)**:
	*   Markdownデータをパースし、配置されるページの階層（H1/H2など）に合わせて、見出しレベルを動的にマッピングします。

---

## 2. データ記述基準 (Data Standard)

### 2.1 階層構造

[Keep a Changelog](https://keepachangelog.com/ "Keep a Changelog") に準拠し、Markdownファイル内では以下の階層で固定します。

- **Level 1 (`#`)**: 常に `# Changelog` と記述します（汎用的なデータ形式を維持するため）。
- **Level 2 (`##`)**: バージョン見出し（例: `## [1.21.0] - 2026-04-27`）
- **Level 3 (`###`)**: 変更カテゴリ（例: `### Added`, `### Fixed`）

### 2.2 フォーマット
- **日付形式**: `YYYY-MM-DD` (ISO 8601) に統一します。
- **バージョン番号**: [Semantic Versioning](https://semver.org/) に準拠し、`[MAJOR.MINOR.PATCH]` 形式で記述します。

### 2.3 カテゴリラベル (Keep a Changelog 準拠)

#### カテゴリラベル

以下の6種類に集約します。旧来の `improve`, `clean`, `change` 等はこれらにマッピングし直します。

- `Added`: 新機能。
- `Changed`: 既存機能の変更（リファクタリング等は含めない）。
- `Deprecated`: 将来の廃止予定。
- `Removed`: 廃止された機能。
- `Fixed`: バグ修正。
- `Security`: セキュリティ関連の修正。

#### マッピング

`Keep a Changelog` のカテゴリラベルと `Conventional Commits` の `<type>` との対応関係は以下の通りです。

| Keep a Changelog | Conventional Commits `<type>` | 説明 |
| :--- | :--- | :--- |
| Added | `feat` | 新機能の追加 |
| Changed | `feat`, `perf`, `refactor`, `chore(deps)` | 既存機能の変更、パフォーマンス向上、ユーザーに影響する内部変更、ライブラリ更新 |
| Deprecated | `feat`, `refactor` | 既存機能の非推奨化（`BREAKING CHANGE` を伴う場合が多い） |
| Removed | `feat`, `refactor` | 機能の削除（`BREAKING CHANGE` を伴う場合が多い） |
| Fixed | `fix` | バグ修正 |
| Security | `fix`, `chore(deps)` | セキュリティ脆弱性の修正、セキュリティ関連のライブラリ更新 |

> [!NOTE]
> `style`, `test`, `build`, `ci`, `chore`, `revert` などのタイプは、原則としてエンドユーザー向けの更新履歴（`changelog.md`）には含めません。
>
> **例外的な扱い:**
> - **`docs`**: 内部向け文書（READMEや開発用ドキュメント）の修正は除外しますが、**「ユーザーガイド」や「マニュアル」の大幅な更新・新規追加**は、ユーザーの利便性に直結するため、`Added` や `Changed` として記載します。
> - **`chore(deps)`**: メジャーバージョンの更新や、パフォーマンス・セキュリティに直結する場合に限り `Changed` または `Security` として記載します。通常の細かなパッチ更新は記載を省略してください。

## 3. 執筆ルール (Writing Rules)

### 3.1 ユーザー中心の視点

対象読者はエンドユーザーです。内部的な実装詳細は避け、ユーザーが体験できる変化を記述してください。

- **非推奨 (実装詳細)**: `UrlDelayCalculator.ts をリファクタリングし、非同期処理の待機ロジックを最適化しました。`
- **推奨 (ユーザー体験)**: `大量のURLを一度に開く際の動作を安定させ、ブラウザが一時的にフリーズする問題を解消しました。`

### 3.2 文体と禁止事項

- **文体**: 過去形に統一します（例: `Added`, `Fixed`）。
- **パス・クラス名の禁止**: ソースコードのパス（`project/src/...`）やクラス名は含めないでください。
- **生URLの禁止**: コミットへのリンク等をURL文字列のまま貼り付けないでください。

---

## 4. 表示ロジックへのマッピング

MarkdownデータをHTMLに変換・描画する際のロジックは、**アプリケーション側（Svelteコンポーネント等）の責務**として以下のルールに基づき実装されます。

- **見出しレベルの調整**: 表示箇所のセマンティクス（周囲のHTML構造）に合わせて、バージョン見出し (`##`) やカテゴリ見出し (`###`) を適切な階層にマッピングします。
- **外部リンクの処理**: セキュリティと利便性のため、自動的に `target="_blank" rel="noopener noreferrer"` を付与します。

---


## 5. テンプレート

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
- Default to most recent versions available for each languages.
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
- Improve Spanish (es-ES) transltion (#362).
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

## 6. チェックリスト

- [ ] バージョン見出しは `##` (H2) を使用しているか
- [ ] 日付は `YYYY-MM-DD` 形式か
- [ ] カテゴリは標準の6種類に収まっているか
- [ ] ユーザー視点の記述になっているか（実装詳細が含まれていないか）
- [ ] コミット等の生URLが含まれていないか

---

## 7. コミット (Commit Examples)

更新履歴の修正やガイドラインの更新に関するコミットメッセージの例です。[プロジェクトのコミット規約](./commitlint.ja.md) に準拠してください。

- **データの標準化**: `refactor(changelog): standardize update history to Keep a Changelog format`
- **ガイドラインの作成**: `docs(changelog): create changelog creation guidelines`
- **READMEの更新**: `docs(project): add link to changelog guideline in README`
- **UIラベルの変更**: `feat(ui): update "Update History" labels to "Changelog" for brevity`