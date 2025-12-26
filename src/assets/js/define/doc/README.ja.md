# `define` モジュールについて

**最終更新日:** 2025年12月26日

## 概要

このドキュメントは、リファクタリングされた `define` モジュールの目的、構造、および責任について説明します。

## `define` ディレクトリの構造と責任

`define/` ディレクトリは、リファクタリングされた `define` モジュールのルートとして機能し、以下のファイルを含みます。

```
@project/src/
└── assets/js/
    └── define/
        ├── doc/
        │   ├── README.md          // ドキュメント。
        │   └── README.ja.md       // このドキュメント (日本語版)。
        │
        ├── index.ts               // モジュールのエントリーポイント。各要素を集約しエクスポート。
        ├── app.ts                 // 拡張機能の静的情報 (Information, Storage など)。
        ├── config.ts              // デフォルト設定オブジェクト (Config) を管理。
        ├── constants.ts           // 各種定数 (数値、文字列、正規表現、メッセージ)。
        ├── types.ts               // モジュールのすべての型定義。
        └── validation.ts          // すべてのバリデーションロジック。
```

## 新しい定数、型、バリデーションルールの追加方法

新しい定義を追加する際は、以下の手順に従ってください。

### 新しい定数の追加

1. **ファイルの特定**: 新しい定数に適切なファイルを特定します。
	- `app.ts`: 拡張機能自体に関する静的な情報（例: マニフェストデータ）の場合。
	- `constants.ts`: その他のすべての定数（例: 数値、文字列、正規表現、UIメッセージ）の場合。
2. **ファイルの編集**: 特定したファイルに定数を追加します。
3. **エクスポート**: 新しい定数がエクスポートされていることを確認します (例: `export const NEW_CONSTANT = "value";`)。
4. **使用**: 対応するファイルから定数をインポートして使用します。

### 新しい機能を追加した際の設定値

新しい機能の実装に伴い、ユーザーが変更可能な設定値を追加する必要がある場合は、以下の手順に従って `Config` オブジェクトを拡張します。

1. **型定義の追加 (`types.ts`)**
	 - `define/types.ts` を開き、`Config` 型（またはその構成要素である `Config_Common` や `Config_Delta`）に新しい設定のプロパティと型を追加します。
	 - 例: `Filtering` に `NewFunc` という設定を追加する場合。
		```typescript
		// types.ts
		type Config_Delta = {
				Filtering: {
					 // ... 既存のプロパティ
					 NewFunc: { // <- 新しい設定グループ
						  enable: boolean;
					 };
				};
				// ...
		};
		```

2. **デフォルト値の追加 (`config.ts`)**
	- `define/config.ts` を開き、`defaultConfig` オブジェクトに新しい設定のデフォルト値を追加します。ここで追加する構造は、`types.ts` で定義した型と一致している必要があります。
	- 例:
		```typescript
		// config.ts
		export const defaultConfig: Config = {
			// ...
			Filtering: {
				// ... 既存のプロパティ
				NewFunc: { // <- 新しい設定のデフォルト値
					enable: true
				}
			},
			// ...
		};
		```

3. **バリデーションルールの追加 (`validation.ts`)**
	- `define/validation.ts` を開き、`VerificationRules` 配列に新しい設定プロパティに対する検証ルールを追加します。
	- ルールは、`property`（`Config`オブジェクト内のパス）、`fail`（検証失敗時のフォールバック値）、`rule`（検証ロジック）の3つで構成されます。
	- 例:
		```typescript
		// validation.ts
		export const VerificationRules: VerificationRule[] = [
			// ... 既存のルール
			{
				property: "Filtering.NewFunc.enable",
				fail: () => { return defaultConfig.Filtering.NewFunc.enable; },
				rule: (value) => {
					return v8n().boolean().test(value);
				}
			},
		];
		```

4. **関連する定数の追加 (`constants.ts`)**
	- 新しい設定が最小値・最大値や特定の文字列リテラルなど、固定値に依存する場合は、それらの値を `define/constants.ts` に定数として定義します。
	- これにより、マジックナンバーを避け、コードの保守性を高めることができます。

### 新しい型の追加

1. **ファイルの編集**: 新しい型定義を `define/types.ts` に追加します。
2. **エクスポート**: 新しい型がファイルからエクスポートされていることを確認します (例: `export type NewType = { ... };`)。
3. **使用**: `define/types.ts` から型をインポートして使用します。

### 新しいバリデーションルールの追加

1. **ファイルの編集**: バリデーションロジックを `define/validation.ts` に追加します。
2. **実装**:
	- **設定オブジェクトのバリデーション**: `Config` オブジェクトを検証するルールの場合、`VerificationRules` 配列に追加します。
	- **カスタム `v8n` ルール**: `v8n` をカスタムバリデーションメソッドで拡張する場合は、ファイルの先頭で `v8n.extend()` を呼び出します。
3. **使用**: `VerificationRules` のルールは自動的に使用されます。カスタム `v8n` ルールはバリデーションロジック内で使用できます。