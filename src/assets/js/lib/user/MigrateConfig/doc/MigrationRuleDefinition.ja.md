## 移行ルールの定義

このドキュメントは、システム内で移行ルールを定義するための運用ルールを概説します。

```
{
	// ルールの説明、処理には使用しない
	rules: {
		author : "ルールの制作者名",
		reason : "なぜこのルールを適応するのか",
		target : "判定対象のオブジェクト",
		action : "何をどう変更するのか",
		created: "作成日   e.x. 2025/07/12",
		expires: "有効要件 e.x. 2025/12/31 or Until upgrade to v2.x.y" // 「指定期日 or 公開日から一年経過 or 任意バージョンに到達」後、アップデート時にルールを手動で削除
	},

	// 処理に使用される
	condition: (argument) => { ... }, // argument = { config, define }, return value is boolean
	execute  : (argument) => { ... }  // argument = { config, define }, return object is config
}
```
