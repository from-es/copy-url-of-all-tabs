# commitlint: コミットメッセージのガイドライン

**最終更新日:** 2025年8月11日

コミット履歴が読みやすく、一貫性があり、ナビゲートしやすいものであることを保証するために、私たちは [Conventional Commits](https://www.conventionalcommits.org/) 仕様に準拠します。

## 概要

Conventional Commits仕様は、コミットメッセージの上に成り立つ軽量な規約です。明確なコミット履歴を作成するための簡単なルールセットを提供し、その上に自動化ツールを構築しやすくします。

## コミットメッセージのフォーマット

各コミットメッセージは、**ヘッダー**、**ボディ**、**フッター**で構成されます。

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

1.  **Header (必須):** コミットメッセージの最初の行で、**type**、オプションの**scope**、そして**description**を含みます。
    - **type**: コミットの種類を説明します。
    - **scope**: コミットが影響するコードベースのセクションを指します。
    - **description**: コード変更の短く、命令形の要約です。

2.  **Body (任意):** より詳細な説明を記述します。変更の「何を」と「なぜ」を説明するために、追加のコンテキストを提供します。Header とは1行の空行を挟んで記述します。

3.  **Footer (任意):** 課題追跡システムのIDを参照するため（例: `Fixes #123`）や、破壊的変更を示すために使用されます。Body とは1行の空行を挟みます。
    - **破壊的変更:** `BREAKING CHANGE:` から始めて、変更内容と移行方法などを記述します。
    - **Issueのクローズ:** `Closes #123`, `Fixes #456` のように記述します。

### Type

| プレフィックス | 説明                                                                          |
| :------------- | :-------------------------------------------------------------------------- |
| `feat!`    | **破壊的変更** (APIに破壊的な変更を導入し、セマンティックバージョニングの**MAJOR**に相当します) |
| `feat`     | **新機能**の追加 (セマンティックバージョニングの**MINOR**に相当します) |
| `fix`      | **バグ修正** (セマンティックバージョニングの**PATCH**に相当します)         |
| `docs`     | **ドキュメントのみ**の変更                                                    |
| `style`    | **コードの動作に影響しない**変更（フォーマット、インデント、空白、セミコロンなど）     |
| `refactor` | バグ修正でも機能追加でもない**コードのリファクタリング**                         |
| `perf`     | **パフォーマンスを改善**するコードの変更                                        |
| `test`     | **テストの追加・修正**                                                        |
| `build`    | ビルドシステムや外部依存関係（npm, webpackなど）に関する変更                     |
| `ci`       | CI（継続的インテグレーション）の設定やスクリプトに関する変更（GitHub Actionsなど） |
| `chore`    | 上記のいずれにも当てはまらない雑多な変更（ビルドタスクの更新、パッケージ管理など）  |
| `revert`   | 以前のコミットを取り消す変更                                                   |

### Scope

スコープは、コミットが影響を与えるコードベースのセクションを具体的に示すためのものです。

**重要な点として、スコープには規約で定められた固定のリストは存在しません。** どのスコープを使うかは、プロジェクトやチームごとに定義します。一貫性を保つために、チーム内で共通のスコープ一覧を決めておくと良いでしょう。

以下は、一般的に使われるスコープの例です。プロジェクトの構成に合わせて適切なものを利用してください。

- **ページや画面名**
	- `login`, `profile`, `settings`, `home`
- **機能や関心事**
	- `api`, `auth`, `ui`, `db`, `routes`, `search`
- **ライブラリやパッケージ名**
	- `core`, `utils`, `components`, `shared`, `design-system`
- **設定ファイルなど**
	- `config`, `ci`, `build`, `deps`

**例:**
- `feat(login): パスワードリセット機能を追加`
- `fix(api): ユーザー取得エンドポイントのnullチェックを強化`
- `docs(readme): セットアップ手順を更新`

## コミットメッセージの例

### 例1: 新機能の追加 (feat)
スコープと詳細なボディを含めることで、変更内容がより明確になります。

```
feat(options): add custom delay rules for pasting URLs

This allows users to configure specific delays for different URL
patterns, providing more granular control over tab opening behavior.
```

```
feat(auth): ログイン機能に生体認証を追加

ユーザーがパスワードの代わりに指紋や顔認証でログインできるようにした。
これによりセキュリティが向上し、利便性も高まる。

Closes #42
```

### 例2: バグ修正 (fix)
単純な修正から、Issueをクローズする修正まで様々です。

```
fix: プロフィール画像の表示崩れを修正

特定の条件下で画像の角丸が適用されず、四角く表示される問題を修正した。
```

```
fix(popup): prevent crash when clipboard is empty

Closes #42
```

### 例3: 破壊的変更 (BREAKING CHANGE)
フッターに `BREAKING CHANGE:` を含めるか、ヘッダーの `type` に `!` を付けることで、互換性のない変更を示します。

**フッターを使用する例:**
```
refactor(storage): change settings data structure

BREAKING CHANGE: The structure of the settings object stored in
`chrome.storage.local` has been updated. Old settings are no longer
compatible and require a migration script.
```

**`!` を使用する例:**
```
refactor!(storage): change settings data structure

The structure of the settings object stored in
`chrome.storage.local` has been updated. Old settings are no longer
compatible and require a migration script.
```

### 例4: 規約違反のメッセージ
もしコミットメッセージが規約に違反していた場合、コミットは失敗し、エラーが表示されます。

**エラー例:**
```
husky - commit-msg hook exited with code 1 (error)
⧗   input: プロフィール画像を修正
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

このエラーは、メッセージに `type` がなく、`subject` の形式も正しくないことを示しています。
エラー内容に従ってメッセージを修正し、再度コミットしてください。

**修正例:**
エラーを修正するには、`type` を追加し、規約に従ったフォーマットで記述します。

```
fix: プロフィール画像を修正
```

### その他のコミット例

#### ドキュメントの更新 (docs)
```
docs(readme): セットアップ手順を更新
```

#### リファクタリング (refactor)
機能の追加やバグ修正ではなく、コードの構造を改善した場合に使用します。
```
refactor(auth): 認証ロジックをより効率的な方法に改善
```

#### スタイル修正 (style)
コードの動作に影響しない、フォーマットやインデントの修正など。
```

style(all): プロジェクト全体のフォーマットを統一
```

#### タイプミスや軽微な修正 (fix)
機能的なバグとは言えないような、テキストの誤字などを修正する場合にも `fix` を使用できます。
```
fix(settings): 設定画面のラベルのタイポを修正
```

## Sourcetree でのコミット方法

上記ルールを理解した上で、Sourcetree から通常通りコミットを実行してください。

1.  変更したファイルをステージングします。
2.  コミットメッセージの1行目に `<type>[(scope)]: <description>` を入力します。
3.  必要であれば、2行目に空行を入れ、3行目以降に詳細な Body や Footer を記述します。
4.  コミットボタンを押します。

## Q&A

### Q. commitlint 適用後に、commitlint で定義したルールに従っていないメッセージをコミットする方法はありますか？

はい、あります。commitlint が適用されているリポジトリでも、ルールに従わないコミットメッセージでコミットする方法はいくつか存在します。

#### `--no-verify` オプションを使用する

最も一般的で簡単な方法は、`git commit` コマンドに `--no-verify` オプションを追加することです。

```bash
git commit -m "これはルールに従わないコミットメッセージです" --no-verify
```

このオプションを使用すると、`commit-msg` フックを含む、Git のプレコミットフックやコミットメッセージフックがすべてスキップされます。`commitlint` は通常 `commit-msg` フックを使用してコミットメッセージを検証するため、このコマンドによって `commitlint` のチェックを回避できます。

#### フックを一時的に無効化する

特定の状況下で、Git フックを一時的に無効にしてコミットすることも可能です。しかし、多くの場合 `--no-verify` オプションの方が手軽で安全です。

#### 注意点

`--no-verify` オプションは、`commitlint` だけでなく、設定されているすべてのコミット関連フック（例：コードの静的解析やテストを実行する `pre-commit` フックなど）をバイパスします。そのため、このオプションを使用する際は、意図しない品質の低下を招かないよう注意が必要です。

基本的には、チームで定められたコミットメッセージのルールは、一貫性のあるクリーンなコミット履歴を維持するために重要です。ルールの例外的なバイパスは、やむを得ない場合に限定して使用することが推奨されます。

### Q. UIに説明画像を追加する場合、typeは`docs`ですか？

`feat` を使用するのがより適切です。

`docs` タイプは、`README.md` のような**開発者向けドキュメント**の変更に限定して使用します。

アプリケーションのUI（例：オプション画面）に直接画像を追加する行為は、ユーザーに見える**機能の追加・改善**と捉えられます。そのため、`type` は `feat` を使うことをお勧めします。

**悪い例:**
```
docs(options): オプション画面に説明用の画像を追加
```
> このメッセージだと、`options` という名前のドキュメントファイルを変更した、と誤解される可能性があります。

**良い例:**
```
feat(options): オプション画面に説明用の画像を追加
```
> これにより、「オプション画面（`options`）に新しい機能（`feat`）として画像が追加された」という意図が、より正確に伝わります。

### Q. `package.json` や `manifest.json` の変更はどの `type` になりますか？

これは変更の内容によって異なります。以下に一般的なケースを示します。

#### 1. `package.json` の依存関係の更新
`build` または `chore` を使用します。
- `build`: ビルドプロセスに影響するパッケージ（例: `vite`, `eslint`）の更新。
  ```
  build(deps): vite を v5.0.0 に更新
  ```
- `chore`: その他のライブラリや開発ツールの更新。
  ```
  chore(deps): lodash を v4.17.21 に更新
  ```

#### 2. `manifest.json` のバージョンアップ
リリース作業の一環であり、機能追加やバグ修正とは異なるため、`chore` が最も適切です。
```
chore(release): version 2.1.0 に更新
```

#### 3. `manifest.json` への権限の追加
「なぜ権限を追加したか」で `type` を判断します。
- **`feat`: ** 新機能の実装のために権限が必要になった場合（最も一般的）。
  ```
  feat(permissions): "storage" 権限を追加して設定を保存可能に
  ```
- **`fix`: ** 権限不足によるバグを修正する場合。
  ```
  fix(permissions): "activeTab" 権限の欠落によるエラーを修正
  ```

### Q. リリース時など、コード変更なしで履歴に区切りを入れるコミットはどうすれば良いですか？

`chore` タイプと `git commit --allow-empty` を組み合わせるのが最も推奨される方法です。

例えば、「バージョン1.0.0がリリースされた」という事実をコミット履歴に残したい場合、コード自体の変更は伴いません。このようなコミットは**空コミット（empty commit）**として作成できます。

**推奨されるコマンド:**
```bash
git commit --allow-empty -m "chore(release): v1.0.0"
```

#### ポイント
- **`chore` を使う理由:** `chore` は、ビルドプロセスや補助ツールの変更、その他ソースコードやテストの変更を含まない雑多なタスクに使われるタイプです。リリースの記録はこれに該当します。
- **`--allow-empty` を使う理由:** このオプションにより、ファイル変更がなくてもコミットを作成できます。
- **なぜこの形式が良いのか:**
  - `commitlint` の規約に準拠しているため、エラーになりません。
  - コミット履歴の意図が明確になります（`release` というスコープでリリース関連だとわかる）。
  - `semantic-release` のような自動化ツールとの連携もスムーズです。

**避けるべき形式:**
```
# これは commitlint のルールに違反するためエラーになります
git commit --allow-empty -m "Version 1.0.0 has been released."
```
規約に沿わないメッセージは、一貫性を損なうため避けましょう。

## 公式サイトとドキュメント

より詳細な情報については、commitlintの公式サイトとConventional Commitsの仕様を参照してください。

- [commitlint 公式ドキュメント](https://commitlint.js.org/#/)
- [Conventional Commits 仕様](https://www.conventionalcommits.org/)
