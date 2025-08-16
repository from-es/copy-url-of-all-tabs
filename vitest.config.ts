import { defineConfig } from 'vitest/config';
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

    // テスト対象のファイルパターンを指定します。
    // 'src'ディレクトリ or 'tests'ディレクトリ以下の'.test.js'または'.test.ts'ファイルを対象とします。
    include: [
      'src/**/*.test.{js,ts}',
      'tests/**/*.test.{js,ts}'
    ],

    // テスト対象から除外するファイルやディレクトリのパターンを指定します。
    // excludeオプションを有効にする場合、Vitestのデフォルトの除外パターンは上書きされます。
    // そのため、必要な除外パターンを全て明示的に指定する必要があります。
    //exclude: [],
  },
});