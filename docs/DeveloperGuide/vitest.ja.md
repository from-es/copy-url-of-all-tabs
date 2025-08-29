# Vitest: 高速でモダンな単体テストフレームワーク

**最終更新日:** 2025年8月15日

このドキュメントは、このプロジェクトで指定されたテストフレームワークである [Vitest](https://vitest.dev/) を使用した単体テストおよび結合テストの記述に関するガイドラインを提供します。

## 概要

Vitestは、Jest互換のAPIを提供する高速でモダンなテストフレームワークであり、直感的で効率的なテストを可能にします。私たちは、コードが信頼でき、バグがなく、期待どおりに動作することを確認するためにこれを使用します。

## テストの記述方法

### テストの基本構成

ここでは、テストファイルを記述する上での基本的なルールと構造について説明します。

1. **ファイル命名**: テストファイルには `.test.ts` または `.spec.ts` という**接尾辞を付ける必要**があります (例: `myFunction.test.ts`)。
2. **ファイルの場所**: テストファイルは、ソースファイルに隣接する `__tests__` ディレクトリ、またはプロジェクトのルートにある中央集権的な `tests` ディレクトリに配置することが推奨されます。
3. **テストの構造**: 一般的なテストファイルは `describe`、`it` (または `test`)、`expect` を使用して構成されます。
    - `describe(name, fn)`: 関連するいくつかのテストをグループ化するブロックを作成します。
    - `it(name, fn)`: これがテストケース自体です。
    - `expect(value)`: アサーション（表明）を作成するために使用します。通常、「マッチャー」関数（例: `toBe`, `toEqual`, `toHaveBeenCalled`）と組み合わせて使用します。

### テストファイルの検出について

Vitestがどのようにテストファイルを検出するか、および上記の「ファイルの場所」について。

Vitestは、デフォルトでプロジェクト内のすべてのディレクトリから、ファイル名が `.test.ts` や `.spec.ts` のようなパターンに一致するファイルを自動的にテストとして検出します。上記のディレクトリ構造は、**テストコードを整理するための推奨事項であり、Vitestの技術的な要件ではありません**。Vitestのテストファイル検出パターンは、設定ファイルの `include` オプションで制御されます。詳細は[Vitest公式ドキュメントのConfiguration](https://vitest.dev/config/)を参照してください。

### テストコードの記述例

はじめに、Vitest単体で完結する基本的なテスト（例1）を示し、その後でSvelteコンポーネントのような、追加ライブラリを要する応用的なテスト（例2）を解説します。

#### 例1：純粋関数

フレームワークに依存しない、純粋なTypeScript/JavaScript関数のテストは非常にシンプルです。

まず、テストを実行するために`vitest`を開発依存関係としてインストールします。

```bash
npm install --save-dev vitest
```

次に、テスト対象となる`add`関数を`tests/_vitest-check/utils/helpers.ts`ファイルに作成します。

**`tests/_vitest-check/utils/helpers.ts`**
```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

そして、この関数に対するテストコードを`tests/_vitest-check/utils/helpers.test.ts`ファイルに作成します

```typescript
import { add } from './helpers';
import { describe, it, expect } from 'vitest';

describe('add function', () => {
  it('should return the sum of two numbers', () => {
    // 準備
    const a = 1;
    const b = 2;

    // 実行
    const result = add(a, b);

    // 検証
    expect(result).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, -1)).toBe(-2);
  });
});
```

#### 例2：Svelteコンポーネント

Svelteコンポーネントのテストには、`@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, `jsdom` などのライブラリを使用します。これらはVite用プラグイン、UIを仮想DOM環境でレンダリング、ユーザー操作をシミュレートするのに使用されます。

このテスト方法は、Svelteの公式ドキュメントで推奨されているアプローチに準拠しています。詳細については、[Testing - Svelte Docs](https://svelte.dev/docs/svelte/testing) を参照してください。

まず、必要な開発依存関係をインストールします。

```bash
npm install --save-dev vitest jsdom @vitest/ui @sveltejs/vite-plugin-svelte @testing-library/svelte @vitest/coverage-v8
```

インストールされる各モジュールの役割は以下の通りです。

| モジュール                  | 説明                                                                                                         |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `vitest`                    | テストフレームワークの本体。                                                                                 |
| `jsdom`                     | Node.js環境でDOMをシミュレートするためのライブラリ。ブラウザ環境を必要とするクライアントサイドコンポーネントのテストに使用。 |
| `@vitest/ui`                | Vitestのテスト結果を視覚的に表示するためのUI。テストの実行状況をブラウザでインタラクティブに確認するために使用。 |
| `@sveltejs/vite-plugin-svelte` | ViteでSvelteコンポーネントをコンパイルするためのプラグイン。テスト環境でSvelteファイルを処理するために必要。    |
| `@testing-library/svelte`   | Svelteコンポーネントをテストするためのユーティリティライブラリ。ユーザーの操作をシミュレートし、コンポーネントの動作検証に使用。 |
| `@vitest/coverage-v8`       | テストカバレッジを収集・レポートするためのプロバイダ。V8エンジンに組み込まれたカバレッジ機能を使用し、高速に動作。 |

##### 動作環境

本ドキュメントで解説する設定とコードは、以下の環境で動作確認されています。パッケージのバージョンアップにより問題が発生した場合は、この構成と比較してください。

| パッケージ                      | バージョン   |
| :------------------------------ | :--------- |
| `svelte`                        | `^5.38.1`  |
| `vitest`                        | `^3.2.4`   |
| `jsdom`                         | `^26.1.0`  |
| `@sveltejs/vite-plugin-svelte`  | `^6.1.2`   |
| `@testing-library/svelte`       | `^5.2.8`   |
| `@vitest/ui`                    | `^3.2.4`   |
| `@vitest/coverage-v8`           | `^3.2.4`   |

<br>

次に、プロジェクトのルートディレクトリに `vitest.config.ts` ファイルを以下の内容で作成します。これにより、VitestはWXTのビルド設定とは独立して、テスト専用の設定で動作します。

**`vitest.config.ts`**
```typescript
import { defineConfig, configDefaults } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    // Vitest実行中はSvelteのホットモジュールリプレースメント(HMR)を無効化し、テストの安定性を確保します。
    svelte({ hot: !process.env.VITEST }),
  ],
  // `resolve.conditions` をトップレベルに設定します。
  // これにより、Vitestが内部的に利用するViteのモジュール解決全体で、`package.json`の`browser`フィールドが優先的に参照されるようになります。
  // Svelteコンポーネントのテスト時に`onMount`などのライフサイクル関数がサーバーサイドと誤認されてエラーになることを防ぎます。
  resolve: {
    conditions: ['browser'],
  },
  test: {
    // `describe`, `it`, `expect` などを各テストファイルでimportせずにグローバルに利用可能にします。
    globals: true,

    // JSDOMをテスト環境として設定します。これにより、Node.js環境でDOM APIをシミュレートでき、
    // ブラウザで動作するコンポーネントのテストが可能になります。
    environment: 'jsdom',

    // テスト対象から除外するファイルやディレクトリのパターンを指定します。
    // デフォルトでは、環境検証用のスモークテストが除外されます。
    exclude: [
      // node_modulesなどを誤って含めないよう、デフォルトの除外設定を継承することを推奨します。
      ...configDefaults.exclude,
      '_vitest-check/**',
    ],
  },
});
```

**注記:** `resolve.conditions` は `test` オブジェクトの中ではなく、設定のトップレベルに配置する必要があります。これにより、Vite全体のモジュール解決に設定が適用され、Svelteが正しくブラウザモードで動作するようになります。

次に、テスト対象の簡単なカウンターコンポーネント (`Counter.svelte`) を作成します。

**`tests/_vitest-check/components/Counter.svelte`**
```html
<script lang="ts">
  import { onMount } from "svelte";

  export let count: number = 0;
  const increment = () => {
    count += 1;
  };

  onMount(() => {
    // onMountのようなブラウザ固有のライフサイクル関数が含まれている場合、
    // Vitestが正しくブラウザ環境を認識していないとエラーになります。
    console.log("Counter component mounted");
  });
</script>

<main>
  <h1>Counter</h1>
  <p>Current count: {count}</p>
  <button on:click={increment}>Increment</button>
</main>
```

そして、このコンポーネントに対するテスト (`Counter.test.ts`) を記述します。

**`tests/_vitest-check/components/Counter.test.ts`**
```typescript
import { render, fireEvent, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import Counter from './Counter.svelte';

describe('Counter.svelte', () => {
  // 各テストの実行後にDOMをクリーンアップし、テスト間の副作用（stateの残留など）を防ぎます。
  afterEach(() => cleanup());

  it('コンポーネントがマウントされ、初期カウントが正しく表示されること', () => {
    // 1. 準備(Arrange): テスト対象のコンポーネントを初期値0でレンダリングします。
    render(Counter, { props: { count: 0 } });

    // 2. 検証(Assert): "Current count: 0" というテキストを持つ要素が存在することを確認します。
    expect(screen.getByText('Current count: 0')).toBeTruthy();
  });

  it('ボタンクリックでカウントがインクリメントされること', async () => {
    // 1. 準備(Arrange): コンポーネントを初期値0でレンダリングします。
    render(Counter, { props: { count: 0 } });
    const button = screen.getByText('Increment');

    // 2. 実行(Act): ボタンを1回クリックします。
    await fireEvent.click(button);

    // 3. 検証(Assert): カウントが1になっていることを確認します。
    expect(screen.getByText('Current count: 1')).toBeTruthy();

    // 4. 実行(Act): ボタンをもう1回クリックします。
    await fireEvent.click(button);

    // 5. 検証(Assert): カウントが2になっていることを確認します。
    expect(screen.getByText('Current count: 2')).toBeTruthy();
  });
});
```


## テストの実行方法

`package.json` に、以下のようにテストスクリプトを定義します。効率化のため、プロジェクト本体のテストと、環境確認用のスモークテストを実行するコマンドを分離することを推奨します。

**`package.json`**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:smoke": "vitest run _vitest-check/",
    "vitest": "vitest",
    "vitest:ui": "vitest --ui",
    "vitest:coverage": "vitest run --coverage"
  }
}
```

これにより、以下のコマンドで各々の目的に応じたテストが実行可能になります。

---

### `npm run test`

**用途:** プロジェクト本体の全テストを実行。

**動作:** アプリケーションの全てのテストを実行します。`_vitest-check/` ディレクトリのスモークテストは除外されます。これは、通常の開発中にアプリケーションの機能性を検証するために使用する主要なコマンドです。

```bash
npm run test
```

### `npm run test:smoke`

**用途:** テスト環境の検証。

**動作:** `_vitest-check/` ディレクトリ内のテストのみを実行します。これは、テスト関連のパッケージをインストールまたは更新した後に、Vitest環境が正しく設定されていることを確認するために使用します。

```bash
npm run test:smoke
```

### `npm run vitest`

**用途:** 開発中の継続的なテスト実行（監視モード）。

**動作:** Vitestを **監視（watch）モード** で起動します。ファイルの変更を検知して、関連するテストだけを自動で再実行するため、迅速なフィードバックが得られます。

```bash
npm run vitest
```

### `npm run vitest:ui`

**用途:** テスト結果のインタラクティブな分析。

**動作:** ブラウザ上で動作するグラフィカルなUIを起動し、テスト結果を視覚的に確認します。（`@vitest/ui` のインストールが必要です）

```bash
npm run vitest:ui
```

### `npm run vitest:coverage`

**用途:** テストカバレッジレポートの生成。

**動作:** テストを実行し、コードカバレッジを測定します。`coverage/` ディレクトリに詳細なレポートが生成されます。（`@vitest/coverage-v8` のインストールが必要です）

```bash
npm run vitest:coverage
```

## Q&A

### Q. なぜVitestのようなテストフレームワークを使うのですか？ `console.log`での確認や、ソースコードに一時的なテスト処理を書いて検証する方法と何が違うのですか？

**A.** `console.log`は一時的なデバッグに非常に便利ですが、テストフレームワーク、特にVitestの利用には、それを超える多くの利点があります。

第一に、**テストコードとプロダクションコードの分離**です。Vitestの大きな利点は、アプリケーション本体のコードにテスト用のコードを追加することなく、動作検証が可能になる点です。これにより、プロダクションコードをクリーンに保ちながら、独立したテストファイルで堅牢なテストを記述できます。製品に不要なテストコードが混入するリスクを防ぎます。

第二に、**テストの自動化と構造化**です。

- **自動化:** `npm run vitest`のような単一のコマンドで、何百ものテストケースを一度に、かつ自動で実行できます。手動での確認作業とは比較にならない効率性を誇ります。
- **構造化:** `describe`や`it`といった構文を使うことで、「何を」「どのような条件で」テストしているのかが明確になります。テストコード自体が仕様書のような役割（リビングドキュメント）を果たし、コードの保守性を高めます。
- **明確な結果:** `expect(result).toBe(3)`のようなアサーション（表明）は、テストの成功・失敗を明確に判断します。`console.log`のように、開発者が目視で出力を解釈する必要がありません。

これらの理由から、継続的に品質を保ち、安全にソフトウェアを成長させていく上で、Vitestのようなテストフレームワークは不可欠なツールと言えます。

### Q. テストファイルは、特定のディレクトリに置く必要がありますか？

**A.** いいえ、必須ではありません。ソースファイルに隣接する `__tests__` ディレクトリや、プロジェクトルートの `tests` ディレクトリに配置するのは、あくまでコードを整理しやすくするための **推奨事項** です。

Vitestは、デフォルト設定でプロジェクト内のすべてのファイルから、ファイル名が `.test.ts` や `.spec.ts` で終わるものを自動的にテストファイルとして検出します。

なお、Vitestはデフォルトで以下のパターンに一致するファイルやディレクトリをテスト対象から除外します（詳細は[Vitest公式ドキュメントの`exclude`オプション](https://vitest.dev/config/#exclude)を参照）。
- `**/node_modules/**`
- `**/dist/**`
- `**/cypress/**`
- `**/.{idea,git,cache,output,temp}/**`
- `**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*`

このファイル検出パターンは、設定ファイル（`vitest.config.ts`）の `include` オプションで自由に変更することも可能です。詳細は[Vitest公式ドキュメントのConfiguration](https://vitest.dev/config/)をご参照ください。

### Q. 「カバレッジレポート」とは何ですか？

**A.** 作成したテストが、ソースコードをどの程度網羅できているか（カバーできているか）を測定し、その結果を可視化した報告書のことです。

カバレッジレポートを見ることで、以下のようなメリットがあります。

- **テスト不足の箇所の特定**
  レポートは、テストで実行されなかったコード行や分岐（if文など）をハイライト表示します。これにより、テストが漏れている箇所を簡単に見つけ出し、より信頼性の高いコードを書くための指針となります。

- **コード品質の客観的な評価**
  「コード全体の80%がテストされている」といった具体的な数値（カバレッジ率）で、テストの品質を客観的に評価できます。これをチームの開発目標にすることで、品質の維持・向上に繋がります。

- **安全なリファクタリング**
  コードを修正した際に、意図せずカバレッジ率が低下していないかを確認することで、既存の機能を壊してしまう「デグレード」のリスクを低減できます。

ドキュメントに記載の `npm run vitest:coverage` は、Vitestの機能を使ってこのレポートを生成するためのコマンドです。

## 公式サイトとドキュメント

より詳細な情報については、Vitestの公式サイトとドキュメントを参照してください。

- [Vitest 公式サイト](https://vitest.dev/)
- [Vitest ドキュメント](https://vitest.dev/guide/)