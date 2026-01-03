# State Manager

**最終更新日:** 2025年12月31日

`Svelte 5` のルーンを活用し、Svelte プロジェクト内で共有される状態を管理するための、リアクティブな状態管理モジュールです。動的なプロパティ生成と、プロパティ単位での書き込み保護（freeze）機能を備えています。

## 概要

この `State Manager` は、拡張機能の異なる部分（background, options, popupなど）で一貫した状態を共有するための、中央集権的なストアを提供します。Svelte 5の `$state` をベースに構築されており、直感的かつ効率的な状態管理を実現します。

モジュールの中心は `store.svelte.ts` にある `createStore` ファクトリです。このファクトリは、`state.ts` によって呼び出され、Svelte プロジェクト内で利用される単一のストアインスタンス（シングルトン）を生成します。アプリケーションの各コンポーネントやモジュールは、`state.ts` から `shareStatus` と `updateState` をインポートするだけで、この共有状態にアクセスできます。

### 型定義の適用

`store.svelte.ts` は汎用的なストアファクトリとして設計されており、特定のプロジェクトのデータ構造には依存しません。プロジェクト固有の型定義（例えば、`config` や `define` オブジェクトがどのようなプロパティを持つか）は、インスタンスを生成する `state.ts` 側で適用します。

これにより、ストアのコアロジックを再利用しつつ、アプリケーションごとの状態の型安全性を確保します。

以下に、`state.ts` での型適用のコード例を示します。

```typescript
// src/assets/js/lib/user/StateManager/state.ts

// Import Module & Types
import { createStore, type UpdateState } from "./store.svelte";

// プロジェクト固有の型定義をインポート
import type { Status } from "@/assets/js/types";

// createStore<Status>() のようにジェネリクスで型を指定し、
// アプリケーション固有のストアインスタンスを生成する。
const { shareStatus, updateState }: {
    shareStatus: Status;
    updateState: UpdateState;
} = createStore<Status>();

// 他のモジュールへインスタンスをエクスポート
export { shareStatus, updateState };
```

## 導入経緯

従来、コンポーネント間で状態を共有するには、親コンポーネントから子コンポーネントへ、さらに孫コンポーネントへと、プロパティ (`props`) を数珠つなぎで渡し続ける必要がありました。この方法は「**Props Drilling (プロパティのバケツリレー)**」と呼ばれ、コンポーネント階層が深くなるにつれて、以下のような問題を引き起こします。

-   **保守性の低下:** 中間コンポーネントは自身が利用しないプロパティをただ下流に渡すためだけに保持する必要があり、コードが冗長になります。状態の出所や利用箇所を追跡するのも困難になります。
-   **再利用性の阻害:** コンポーネントが特定の上位コンポーネントからのプロパティに強く依存するため、他の場所での再利用が難しくなります。

`State Manager` は、これらの問題を解決するために導入されました。**Svelte**のストアパターンを応用し、アプリケーションのどこからでもアクセス可能な中央集権的な状態ストアを提供します。これにより、コンポーネントは必要な状態をストアから直接取得でき、Props Drilling を完全に排除します。

## State Manager の利用に伴う利点と注意点

このライブラリは多くの利点をもたらしますが、いくつかの注意点も存在します。

### メリット

1.  **Props Drilling の解消:**
    コンポーネントが必要な状態をストアから直接参照できるため、プロパティを介した冗長なデータリレーが不要になります。これにより、コンポーネントは疎結合になり、コードの見通しが大幅に向上します。

2.  **状態の一元管理:**
    アプリケーションの状態が単一のストアに集約されるため、状態の全体像を把握しやすくなります。データの流れが「ストア → コンポーネント」という一方向に近づき、デバッグや機能追加が容易になります。

3.  **強力なリアクティビティ:**
    Svelte 5のルーン (`$state`) を基盤としているため、最小限のコードで効率的なリアクティビティを実現します。状態が更新されると、その状態に依存するUIのみが自動的に再描画されます。

4.  **イミュータブルな状態管理:**
    `freeze: true` オプションにより、特定の状態（例: アプリケーションの固定設定 `define`）を意図しない変更から保護できます。これにより、アプリケーションの安定性が向上します。

### 注意点 (Demerits)

1.  **小規模な利用における冗長性:**
    数個のコンポーネント間でしか状態を共有しないような非常にシンプルなアプリケーションでは、ストアの導入はかえって設計を複雑にする可能性があります。このような場合は、SvelteのContext APIや単純なProps渡しの方が適切な場合もあります。

2.  **状態変更の追跡:**
    状態の更新がどこからでも（`updateState` や直接代入を通じて）行えるため、大規模なアプリケーションでは「いつ、どこで、何が」状態を変更したのかを追跡するのが難しくなる可能性があります。厳格な更新ルールを設けるか、デバッグ用のログ出力を強化するなどの対策が有効です。

3.  **学習コスト:**
    Svelteのストアやルーンの概念に加え、このライブラリ独自のAPI (`updateState`, `StateOption` など) の使い方を理解する必要があります。新規のプロジェクト参加者には、これらの学習コストが発生します。

4.  **Svelte 環境への強い依存:**
    この `State Manager` のコア機能は、`Svelte 5` のリアクティビティ・プリミティブ（ルーン）である `$state` を利用して構築されています。そのため、このライブラリは Svelte コンパイラによってコードが処理される **Svelte プロジェクト**内でのみ正しく動作します。React, Vue.js といった他のフレームワークや、ビルドプロセスを介さない**素の JavaScript/TypeScript 環境**では利用できません。

## 主な機能

- **Svelte 5 リアクティビティ:** Svelte 5のルーン (`$state`) をベースにしており、状態の変更は自動的にUIに反映されます。
- **動的なプロパティ:** `config` や `define` のような固定のプロパティだけでなく、任意の名前を持つ状態を動的に追加・管理できます。
- **書き込み保護:** プロパティごとに `freeze: true` を設定することで、意図しない変更を防ぐイミュータブルな状態を簡単に作成できます。
- **直感的な更新:** 書き込みが許可されたプロパティは、`shareStatus.prop.value = ...` のように、オブジェクトに直接代入するだけで更新できます。
- **安全な一括更新:** `updateState` 関数を通じて、ストアの**初期化**や、既存の状態をアトミックにマージ・更新できます。`freeze` されたプロパティの更新は安全にブロックされます。
- **型安全性:** TypeScriptとジェネリクスを活用し、開発時に型の恩恵を受けられるように設計されています。

## 基本的な使い方

`State Manager` を利用するには、`state.ts` から `shareStatus` と `updateState` をインポートします。

### 状態の初期化と更新

通常、状態の初期化はアプリケーションのエントリーポイント（`popup/main.ts` や `options/main.ts` など）で行います。

```typescript
// src/entrypoints/popup/js/main.ts

import { updateState } from "@/assets/js/lib/user/StateManager/state";
import { initializeConfig } from "@/assets/js/initializeConfig";

// アプリケーション起動時に設定を読み込み、共有状態を更新する
async function boot() {
  const { config, define } = await initializeConfig(null);

  updateState([
    // ストアの初期化、または既存の状態を更新
    { name: "config", value: config, freeze: false }, // configは書き換え可能
    { name: "define", value: define, freeze: true }  // defineは書き換え不可
  ]);

  // ... アプリケーションのマウント処理
}
```

### Svelteコンポーネントでの利用

Svelteコンポーネント内では、`shareStatus` を使ってリアクティブな状態にアクセスします。

```svelte
<!-- src/entrypoints/popup/svelte/App.svelte -->

<script lang="ts">
  import { shareStatus } from "@/assets/js/lib/user/StateManager/state";

  // shareStatus.config の変更は自動的にUIに反映される
  $: theme = $shareStatus.config?.theme || 'light';
</script>

<main class={theme}>
  <h1>現在のテーマ: {theme}</h1>
  <p>バージョン: {$shareStatus.define?.version}</p>
</main>
```

## APIリファレンス

### `shareStatus`

リアクティブな状態を保持するProxyオブジェクトです。Svelteコンポーネント内では `$` プレフィックスを付けてサブスクライブするか、コンポーネント外では `shareStatus.propName` のように直接アクセスします。

- **型:** `Proxy<Status>` (ジェネリクスで指定された型)

### `updateState(newStates)`

ストアの状態を一括で更新（マージ）します。

- **`newStates: StateOption[]`**: 更新または追加したい状態の情報を含んだ `StateOption` オブジェクトの配列。

### `StateOption` インターフェース

状態を定義するためのインターフェースです。

```typescript
interface StateOption {
  /**
   * 状態プロパティの名前。
   */
  name: string;

  /**
   * このプロパティを書き込み不可にするかどうか。
   * `true` に設定すると、`updateState` による再度のマージや、直接代入による変更がブロックされます。
   */
  freeze: boolean;

  /**
   * プロパティに格納する値（オブジェクト）。
   */
  value: Record<string, any>;
}
```

## 高度な使い方

### 書き込み保護 (Freeze)

`freeze: true` を指定して `updateState` を呼び出すと、そのプロパティは不変になります。以降、そのプロパティへの変更はすべて拒否され、コンソールに警告が出力されます。

```typescript
// 'define' は freeze: true で初期化されていると仮定
shareStatus.define.version = '2.0.0'; // 変更は拒否される
// コンソール出力: [StateManager] Attempted to write to a frozen property "define". Operation denied.

// updateState での更新も拒否される
updateState([
  { name: "define", value: { version: '3.0.0' }, freeze: true }
]);
// コンソール出力: [StateManager] Attempted to update a frozen property "define". Operation denied.
```

### 直接代入による更新

`freeze: false` のプロパティは、ネストされた値であっても直接代入するだけでリアクティブに更新されます。

```typescript
// 'config' は freeze: false と仮定
console.log(shareStatus.config.theme); // "light"

// 直接代入で値を更新
shareStatus.config.theme = "dark";

console.log(shareStatus.config.theme); // "dark" (UIも自動的に更新される)
```

## ライセンス

このプロジェクトは [MIT License](../../../../../../../LICENSE.md) の下で公開されています。