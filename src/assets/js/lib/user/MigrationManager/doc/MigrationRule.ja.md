# 移行ルールの動作仕様

**最終更新日:** 2025年12月3日

## 概要

このドキュメントは、`MigrationManager` で使用される移行ルールオブジェクトの構造と、各プロパティの役割について定義します。ルールは、データのスキーマ変更に追従し、古いバージョンのデータを安全に新しいバージョンへ移行するために不可欠です。

## ルールの基本構造

各移行ルールは、`MigrationRule<T>` 型に準拠したオブジェクトである必要があります。`T` は移行対象のデータ型（例: `Config`）を示すジェネリック型です。

```typescript
// 個々の移行ルールの型定義
type MigrationRule<T> = {
	// ルールのメタ情報。必須ではないが、メンテナンスのために強く推奨される
	meta?: MigrationRuleMeta;
	// ルールの適用順序を定義する数値（任意）。昇順で実行される。
	order?: number;
	// このルールを適用すべきか判定する関数
	condition: (argument: MigrationArgument<T>) => boolean | Promise<boolean>;
	// 実際の移行処理を実行する関数
	execute: (argument: MigrationArgument<T>) => T | Promise<T>;
};

// ルールメタ情報の型定義
type MigrationRuleMeta = {
	author  : string; // ルールの作成者
	reason  : string; // なぜこのルールが必要かの説明
	target  : string; // 変更対象のプロパティや機能
	action  : string; // ルールが実行する処理の説明
	authored: string; // ルールが作成された日付 (YYYY-MM-DD)。開発者向けの参考情報として使用します。
	version : {
		introduced: string;        // このルールが必要になったバージョン (新しい設定構造が導入されたバージョン)
		obsoleted : string | null; // このルールが廃止（アーカイブ）可能と見なされる最初のバージョン。棚卸しプロセスで決定され、それまでは null。
	};
};

// condition/execute に渡される引数の型定義
type MigrationArgument<T> = {
	data: T; // 現在の移行対象データ
	defaultValues: Partial<T>; // デフォルト値が格納されたオブジェクト
};
```

## 各プロパティの詳細

### `meta`

- **型:** `MigrationRuleMeta` (任意)
- **説明:** ルールの目的や背景を開発者が理解するためのメタ情報です。**このプロパティは任意ですが、デバッグやメンテナンス性を向上させるために強く推奨されます。** このオブジェクト内のプロパティは、移行処理のロジックには影響を与えません。
- **プロパティ:**
	- `author` (string): ルールの作成者名。
	- `reason` (string): なぜこのルールが必要になったかの背景や理由（例: 「v1.11.0での設定構造変更に対応するため」）。
	- `target` (string): 変更が加えられるデータのプロパティパスや機能名（例: `config.Filtering`）。
	- `action` (string): このルールが何を行うかの具体的な説明（例: 「`config.Filtering` に `Deduplicate` プロパティを追加する」）。
	- `authored` (string): ルールが作成された日付 (`YYYY-MM-DD`)。開発者向けの参考情報として使用します。
	- `version.introduced` (string): **ライフサイクル管理の主キー。** このルールが**必要になった原因のバージョン**（＝新しい設定構造が導入されたバージョン）を正確に記録します。
	- `version.obsoleted` (string | null): このルールが**廃止（アーカイブ）可能と見なされる最初のバージョン**。棚卸しプロセスで決定され、それまでは `null` です。

### `order`

- **型:** `number` (任意)
- **説明:** ルールの適用順序を制御するための数値です。
	- ルールは `order` の値に基づいて**昇順（小さい順）**にソートされてから実行されます。
	- `order` の値が重複すると、`loadRules` ユーティリティがエラーをスローします。
	- このプロパティを省略したルールは、`order` を持つすべてのルールの後に実行されます。

### `condition`

- **型:** `(argument: MigrationArgument<T>) => boolean | Promise<boolean>`
- **説明:** `execute` メソッドを実行するかどうかを判定する関数です。
	- `true` を返す場合、移行が必要と判断され、`execute` が呼び出されます。
	- `false` を返す場合、データは既に最新の状態であると判断され、何も行われません。
	- 非同期処理（例: データベースへの問い合わせ）を伴う判定も可能です。

### `execute`

- **型:** `(argument: MigrationArgument<T>) => T | Promise<T>`
- **説明:** 実際の移行処理を実行する関数です。
	- 引数として渡された `data` を変更し、移行後の新しいデータオブジェクトを返す必要があります。
	- **注意:** 元の `data` オブジェクトを直接変更するのではなく、ディープコピーを作成してから変更を加えることが強く推奨されます。これにより、意図しない副作用を防ぎます。
	- `defaultValues` を参照して、新しいプロパティの初期値を設定できます。
	- 非同期処理（例: APIからのデータ取得）を伴う移行も可能です。

## 実装サンプル

v1.12.0で `config` オブジェクトに `Badge` プロパティが追加された際の移行ルールの例です。

```typescript
import { cloneObject } from "@/assets/js/lib/user/CloneObject";
import type { MigrationRule } from "./types";
import type { Config } from "@/assets/js/types";

export const rules: MigrationRule<Config>[] = [
	{
		meta: {
			author : "Your Name",
			reason : "v1.12.0で、拡張機能アイコンにバッジを表示する機能が追加されたため。",
			target : "config.Badge",
			action : "configオブジェクトにBadgeプロパティが存在しない場合、デフォルト値を追加する。",
			authored: "2025-11-10",
		version: {
			introduced: "1.12.0",
			obsoleted : null
		}
		},
		order: 8,
		condition: ({ data }) => {
			// data (config) に Badge プロパティが存在しない場合に true を返す
			return !Object.hasOwn(data, "Badge");
		},
		execute: ({ data, defaultValues }) => {
			// データのコピーを作成
			const newData = cloneObject(data);

			// defaultValues から Badge のデフォルト設定を取得して追加
			// defaultValues もオブジェクトなので、念のためコピーする
			newData.Badge = cloneObject(defaultValues.Badge);

			console.log('Migrated: Added "config.Badge"', newData);

			// 変更後のデータを返す
			return newData;
		}
	}
];
```