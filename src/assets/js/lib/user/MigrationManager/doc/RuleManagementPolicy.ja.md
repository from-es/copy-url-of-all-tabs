# 移行ルールの管理方針

**最終更新日:** 2025年12月3日

## 概要

このドキュメントは、`MigrationManager` モジュールで使用される移行ルールのライフサイクル（追加、棚卸し、アーカイブ）と、移行対象データの種類に応じた運用方針を定義します。本方針の目的は、ルールの肥大化を防ぎ、コードベースの保守性を長期的に維持することです。

## 基本方針

- **ライフサイクルの明確化:** ルールは追加しやすいだけでなく、将来的に安全に削除できる必要があります。そのために、各ルールのライフサイクルを**バージョンベースで管理**します。
- **サポート範囲の限定:** コードベースは、原則として現在サポート対象となっているバージョンへの移行パスのみを維持します。

## ルールのメタデータ構造

各ルールには、その役割とライフサイクルを管理するための `meta` オブジェクトが必須です。

> [!TIP]
> `meta` オブジェクトのプロパティは、コードの動作上は必須ではありません。しかし、**移行ルールの適切な管理、デバッグ、および将来的なメンテナンス**のために、その記述を強く推奨します。

-   **`meta` オブジェクトの構造例:**
	```typescript
	meta: {
		author  : "From E",
		reason  : "v1.12.0 で追加されたバッジ機能の設定値を追加するため",
		target  : "config.Badge",
		action  : "config.Badge が存在しない場合、デフォルト値を適応",
		authored: "2025-11-10", // ルール作成日 (開発者向け情報)
		version: {
			introduced: "1.12.0", // このルールが必要になったバージョン
			obsoleted : null      // このルールが廃止可能になるバージョン (初期値: null)
		}
	}
	```

- **各プロパティの説明:**
	- `author` (string): ルール作成者の名前またはエイリアス。
	- `reason` (string): このルールが必要になった理由（例: 対応する機能変更、バグ修正など）。
	- `target` (string): 移行対象となる設定のプロパティパス。
	- `action` (string): ルールが実行する処理の簡潔な説明。
	- `authored` (string): ルールが作成された日付 (`YYYY-MM-DD`)。開発者向けの参考情報として使用します。
	- `version.introduced` (string): **ライフサイクル管理の主キー。** このルールが**必要になった原因のバージョン**（＝新しい設定構造が導入されたバージョン）を正確に記録します。
	- `version.obsoleted` (string | null): このルールが**廃止（アーカイブ）可能と見なされる最初のバージョン**。棚卸しプロセスで決定され、それまでは `null` です。

## 移行対象データの保存場所に応じた考慮事項

`MigrationManager` ライブラリが扱うデータには、主に2つの保存ケースが想定されます。

### ケース1: `chrome.storage` API による内部保存（標準）

本拡張機能の標準的な動作です。ユーザーの設定は `chrome.storage.local` にキー `config` として保存されています。

- **アーキテクチャ:**
	- データ移行は、`initializeConfig.ts` モジュールによって自動的に処理されます。
	- 拡張機能の起動時、`StorageManager` が `chrome.storage.local` から設定データを読み込みます。
	- 読み込まれたデータは `MigrationManager` に渡され、定義済みのルールに基づき、必要な移行がすべて適用されます。
	- 移行が実行され、かつ成功した場合、更新された設定オブジェクトが `StorageManager` を通じて `chrome.storage.local` に自動で再保存されます。
- **運用上の考慮:**
	- このケースでは、ユーザーはバージョンの違いを意識する必要がありません。移行は透過的に行われます。
	- ルールは、マイナーバージョンアップごとに追加される小さな変更を、段階的に適用していくことを主眼とします。

### ケース2: 設定ファイルとしての外部保存（インポート/エクスポート機能など）

ユーザーが設定をファイル（例: JSON）としてエクスポートし、後でインポートするようなケースを想定します。

- **シナリオ:**
	1.  **設定構造の変更:** エクスポートされた古い設定ファイルを、新しいバージョンの拡張機能にインポートする場合。プロパティの追加・削除・名称変更など、スキーマの不整合が発生します。
	2.  **メジャーバージョン跨ぎ:** 特に、v1系の拡張機能からエクスポートした設定を、v3系の拡張機能にインポートするような、複数のメジャーバージョンを一度に飛び越える移行が必要になる場合があります。
- **運用上の考慮:**
	- `MigrationManager` は、このようなシナリオにも対応できる設計になっています。
	- 重要なのは、**「ルール集約ファイルのバージョニング戦略」** に従って、各メジャーバージョンに対応する移行ルールを累積的に適用するロジックを呼び出し側（インポート機能の実装部など）で正しく実装することです。
	- 例えば、v1のデータをv3に移行する場合、`v1 -> v2` のルールセットと `v2 -> v3` のルールセットを順番にすべて適用する必要があります。これにより、大きなバージョンの隔たりがあっても、データを最新の状態まで安全に引き上げることができます。

## ルール集約ファイルのバージョニング戦略

複数のメジャーバージョン（v1, v2...）の移行ロジックが混在することを防ぐため、ルール集約の単位をメジャーバージョンごとに分割します。

### 目的

- 異なるメジャーバージョン間の移行ロジックを、物理的に明確に分離する。
- アプリケーションが必要なバージョンのルールセットのみを、クリーンにインポートできるようにする。

### 運用ルール

メジャーバージョンごとに、そのバージョン系列のルールを集約するエントリーポイントファイルを作成します。

-   **ファイル配置例:**
	```
	src/assets/js/lib/user/MigrationManager/rules/
	 ├─ v1/
	 │   ├─ v1.11.0-restructure-filtering.rule.ts
	 │   └─ v1.12.0-add-badge-property.rule.ts
	 ├─ v2/
	 │   └─ ...
	 ├─ v1.rules.ts  // v1系のルール集約ファイル
	 └─ v2.rules.ts  // v2系のルール集約ファイル
	```

- **集約ファイルの実装例 (`v1.rules.ts`):**
	```typescript
	import { loadRules } from "@/assets/js/lib/user/MigrationManager/loadRules";
	import type { Config } from "@/assets/js/types";

	const modules = import.meta.glob('./v1/**/*.rule.ts', { eager: true });
	// loadRules は同期関数であり、Promise を返しません
	export const migrationRules = loadRules<Config>(modules);
	```

### 呼び出し側の実装イメージ（メジャーバージョン跨ぎ対応）

アプリケーション側は、移行対象データのバージョンを判定し、適切なバージョンのルールセットを段階的に適用します。

> [!WARNING]
> **Service Worker 環境での動的インポートの禁止**
> 以下のサンプルコードのように `await import(...)` を使用する動的インポートは、Service Worker 環境では `window is not defined` エラーを引き起こすため**使用できません**。この方法は、オプションページなど、`window` オブジェクトが利用可能な通常のウェブページコンテキストでのみ有効です。

#### 非推奨: 動的インポートを用いた実装（Service Worker では動作しない）

```typescript
// [...(前略)]
// 以下のコードは Service Worker では動作しません
async function migrateExternalData(data: Config, defaultValues: Partial<Config>) {
	// [...(バージョンチェックなど)]

	// switch-case の fall-through を利用して、古いバージョンから段階的にルールを連結
	switch (dataVersion) {
		case 1:
			// 動的インポートは Service Worker でエラーになる
			const { migrationRules: rulesV1 } = await import('@/assets/js/lib/user/MigrationManager/rules/v1.rules.ts');
			combinedRules = combinedRules.concat(rulesV1);
			// fall through
		case 2:
			const { migrationRules: rulesV2 } = await import('@/assets/js/lib/user/MigrationManager/rules/v2.rules.ts');
			combinedRules = combinedRules.concat(rulesV2);
			// fall through
		// 新しいバージョン(v3)が追加されたら、ここに case 3 を追加
	}
	// [...(後略)]
}
```

#### 推奨: 静的インポートを用いた実装（Service Worker 対応）

Service Worker を含むすべての環境で安全に動作させるためには、必要なルール集約ファイルをすべて**静的に**インポートします。`switch-case` 文の `fall-through` を利用することで、古いバージョンから最新バージョンまでのすべての移行パスを保証するロジックは同様に実現できます。

```typescript
import { MigrationManager } from "@/assets/js/lib/user/MigrationManager";
import type { MigrationRule } from "@/assets/js/lib/user/MigrationManager/types";
import type { Config } from "@/assets/js/types";

// --- 必要なルール集約ファイルをすべて静的にインポート ---
import { migrationRules as rulesV1 } from "@/assets/js/lib/user/MigrationManager/rules/v1.rules.ts";
import { migrationRules as rulesV2 } from "@/assets/js/lib/user/MigrationManager/rules/v2.rules.ts";
// import { migrationRules as rulesV3 } from "@/assets/js/lib/user/MigrationManager/rules/v3.rules.ts";

const LATEST_VERSION = 2; // アプリケーションがサポートする最新のメジャーバージョン (v3 ができたら 3 に)

async function migrateExternalData(data: Config, defaultValues: Partial<Config>) {
	const dataVersion = detectDataVersion(data); // データからメジャーバージョンを判定
	let combinedRules: MigrationRule<Config>[] = [];

	if (dataVersion >= LATEST_VERSION || dataVersion < 1) {
		return data; // 移行不要、または不正バージョンのため処理しない
	}

	// switch-case の fall-through を利用して、古いバージョンから段階的にルールを連結
	switch (dataVersion) {
		case 1:
			combinedRules = combinedRules.concat(rulesV1);
			// fall through
		case 2:
			combinedRules = combinedRules.concat(rulesV2);
			// fall through
		// 新しいバージョン(v3)が追加されたら、ここに case 3 と v3 の import を追加
	}

	const manager = new MigrationManager<Config>(combinedRules);
	const result = await manager.migrate(data, defaultValues);

	// エラー処理など
	if (result.hasError) {
		console.error("外部設定の移行に失敗しました。", result.errorReports);
	}

	return result.data;
}
```

## 移行ルールの棚卸しとアーカイブ

**バージョンベースのライフサイクル**に基づき、手動によるレビューとアーカイブプロセスを実施します。

### 1. 棚卸しのトリガー

- **メジャーバージョンアップ計画時:** 新しいメジャーバージョン（例: v3.0.0）のリリース計画を立てる際。
- **定期的レビュー:** 半年または1年に一度、現行のルールセットを見直す際。

### 2. アーカイブ基準

1.  **サポートバージョンの決定:**
    - まず、次期メジャーバージョンでサポートする**最も古いバージョン**を決定します。（例: 「v3.0.0では、v2.5.0以降からの移行のみをサポートする」）

2.  **アーカイブ対象の特定:**
    - `meta.version.introduced` の値が、上記で決定した**サポート最低バージョンよりも古いルール**がアーカイブ対象となります。
	- （例: サポート最低バージョンが `v2.5.0` の場合、`introduced` が `"2.4.0"` や `"1.12.0"` のルールはすべて対象。）

### 3. アーカイブプロセス

1.  **`obsoleted` の更新:**
    - アーカイブ対象となった各ルールの `meta.version.obsoleted` フィールドに、廃止が決定されたバージョン（例: `"3.0.0"`）を記録します。
2.  **ファイルの移動:**
    - 対象のルールファイル (`*.rule.ts`) を、`rules` ディレクトリから `rules/archives` のような別の場所に移動します。これにより、ビルド対象から除外します。
3.  **追跡可能性の確保:**
    - ファイルは物理的に削除せず、Gitの管理下に置くことで、過去の変更履歴をいつでも追跡できるようにします。
4.  **集約ファイルの更新:**
    - アーカイブに伴い、影響を受けるルール集約ファイル（例: `v2.rules.ts`）があれば、`import.meta.glob` のパスを見直すなど、適宜修正します。