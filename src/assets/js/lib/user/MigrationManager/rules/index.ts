// Import Module
import { loadRules }   from "../loadRules";

// Import Types
import type { Config } from "@/assets/js/types";

/**
 * v1系列の移行ルールを動的にインポートし、単一の配列に集約します。
 *
 * `import.meta.glob` を使用して、`./migrate/` ディレクトリ配下のすべての `.rules.ts`
 * ファイルを検索し、`loadRules` ユーティリティを介して処理します。

 * @see {@link ../loadRules.ts}
 *
 * @remarks Viteの制約により、`import.meta.glob` の引数は文字列リテラルである必要があります。
 *
 * @returns {Promise<MigrationRule<Config>[]>} ソートおよび検証済みの移行ルールを含むプロミス
 */
const modules = import.meta.glob("./migrate/*.rules.ts", { eager: true });

export const migrationRules = loadRules<Config>(modules);