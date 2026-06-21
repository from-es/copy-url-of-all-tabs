# SequenceRule 動作仕様

**最終更新日:** 2026年6月20日

## 概要

`SequenceRule<T, C>` は、`SequenceProcessor` で実行される個々の処理ステップを定義するオブジェクトです。処理ロジック、メタ情報、および実行条件の制御を一箇所にカプセル化します。

## ルールの構造

```typescript
type SequenceRule<T, C> = {
	// メタ情報。表示やデバッグに使用
	meta: SequenceMeta & { description: SequenceDescription };
	// 実行制御。プラットフォームやライフサイクルの指定
	spec?: SequenceSpec;
	// 実際の処理ロジック
	process: {
		condition: (arg: SequenceArgument<T, C>) => Promise<boolean> | boolean;
		execute  : (arg: SequenceArgument<T, C>) => Promise<T> | T;
	};
	// 適用順序
	order?: number;
};
```

### `meta` (必須)

開発者がルールの目的を理解するための情報です。
- `name`: ルールの短い名前。
- `description.reason`: なぜこの処理が必要か。
- `description.target`: 何を変更するか。
- `description.action`: どのような処理を行うか。

### `spec` (任意)

ルールの実行環境やライフサイクルを制御します。
- `enabled`: `false` にすると、ルールは完全に無視されます。
- `critical`: `true` の場合、このルールの失敗は処理全体の失敗（ロールバック）を意味します（デフォルトは `true`）。
- `platforms`: `["chrome", "firefox"]` のように、特定のプラットフォームでのみ実行する場合に指定します。
- `lifecycle`: バージョンに基づく実行制御を指定します。
  - `introduced` (string): **導入バージョン**。環境がこのバージョン以降（指定値を含む）の場合にのみ実行します。
  - `obsoleted` (string): **廃止バージョン**。環境がこのバージョンに達した（指定値を含む）場合、ルールをスキップします。

### `process` (必須)

- `condition`: `true` を返した場合のみ `execute` が実行されます。
- `execute`: データを変更し、新しいデータオブジェクトを返します。

## 実装サンプル

以下は、特定のバージョンで古いプロパティを削除し、新しいプロパティを追加するルールの例です。

```typescript
import { cloneObject } from "../../../../lib/CloneObject";
import type { SequenceRule } from "../../../../lib/SequenceProcessor/types";
import type { Config, Context } from "./types";

export const rules: SequenceRule<Config, Context>[] = [
	{
		meta: {
			name: "RenameOldProperty",
			author: "From E",
			description: {
				reason: "設定名の明確化のため、oldProp を newProp にリネームする",
				target: "config.newProp",
				action: "oldProp が存在する場合、その値を newProp に移し替えて oldProp を削除する"
			},
			authored: "2026-06-17"
		},
		spec: {
			critical: false, // 失敗しても他の処理を継続する
			lifecycle: {
				introduced: "1.20.0"
			}
		},
		order: 10,
		process: {
			condition: ({ data }) => {
				return Object.hasOwn(data, "oldProp");
			},
			execute: ({ data }) => {
				const newData = cloneObject(data);
				newData.newProp = newData.oldProp;
				delete newData.oldProp;
				return newData;
			}
		}
	}
];
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
