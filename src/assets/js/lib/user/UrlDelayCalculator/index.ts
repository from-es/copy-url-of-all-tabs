/*
	@name        UrlDelayCalculator
	@description URLリストの遅延時間を計算する為の静的メソッド
	@author      From E
	@lastupdate  2025/08/09
	@dependency  none
*/



export interface UrlDelayRule {
	/**
	 * マッチさせるURLパターン。
	*/
	pattern: string | RegExp;
	/**
	 * パターンが文字列の場合のマッチングタイプ。
	 * 'prefix': 前方一致 (例: "https://example.com/" にマッチ)
	 * 'substring': 部分一致 (例: "example" にマッチ)
	 * 'exact': 完全一致 (例: "https://example.com/page" に完全に一致)
	 * RegExpオブジェクトの場合はこのプロパティは無視されます。
	 */
	matchType?: "prefix" | "substring" | "exact";
	/**
	 * パターンがマッチした場合に適用する遅延（ミリ秒）。
	 */
	delay: number;
}

export interface UrlDelayCalculationResult {
	/**
	 * URL
	 */
	url: string;
	/**
	 * URLの遅延情報
	 */
	delay: {
		/**
		 * シーケンスの開始からの累積遅延（ミリ秒）。setTimeoutなどに使用
		*/
		cumulative: number;
		/**
		 * この特定のURLを処理する前の個別の遅延（ミリ秒）。非同期処理の次のステップへの待ち時間などに使用
		*/
		individual: number;
	};
}

/**
 * @interface CompiledUrlDelayRule
 * @description UrlDelayRuleを拡張し、コンパイル済みのRegExpオブジェクトを保持する内部使用のインターフェース
 * @property {RegExp} compiledPattern - コンパイル済みの正規表現オブジェクト
 */
interface CompiledUrlDelayRule extends UrlDelayRule {
	compiledPattern: RegExp;
}



/**
 * @class UrlDelayCalculator
 * @description URLリストの遅延時間を計算するための静的メソッドを提供するユーティリティクラス
 */
export class UrlDelayCalculator {
	/**
	 * このクラスはステートレスであり、インスタンス化の必要は無い。全ての機能は静的メソッド `calculateDelays` を通じて提供
	 */
	private constructor() { /* private constructor to prevent instantiation */ }

	/**
	 * 文字列を正規表現で使用できるように、特殊文字をエスケープ
	 * @param   {string} str - エスケープする文字列
	 * @returns {string}     - エスケープされた文字列
	 */
	static #escapeRegExp(str: string): string {
		return str.replace(/[.*+?^${}()|[\\][\\]\\]/g, "\\$&");
	}

	/**
	 * UrlDelayRuleの配列を、事前にコンパイルされた正規表現を持つ内部用のルール配列に変換
	 * @param   {UrlDelayRule[]}         customRules - ユーザーが定義したカスタム遅延ルールの配列
	 * @returns {CompiledUrlDelayRule[]}             - コンパイル済みのルール配列
	 */
	static #compileRules(customRules: UrlDelayRule[]): CompiledUrlDelayRule[] {
		return customRules.map(
			(rule) => {
				if (rule.pattern instanceof RegExp) {
					return { ...rule, compiledPattern: rule.pattern };
				}

				if (typeof rule.pattern !== "string" || rule.pattern.length === 0) {
					console.log("UrlDelayCalculator: An invalid or empty string pattern was detected in a custom delay rule. This rule will be ignored. Rule:", rule);

					return { ...rule, compiledPattern: /(?!)/ };  // 無効な文字列パターンの場合は、どのURLにもマッチしない正規表現を返す
				}

				const escapedPattern = UrlDelayCalculator.#escapeRegExp(rule.pattern);
				let   regex: RegExp;

				switch (rule.matchType) {
					case "substring":
						regex = new RegExp(escapedPattern, "i");
						break;
					case "exact":
						regex = new RegExp(`^${escapedPattern}$`, "i");
						break;
					case "prefix":
						// 'prefix' は 'default' と同じ処理の為、フォールスルーする
					default:
						regex = new RegExp(`^${escapedPattern}`, "i");
						break;
				}

				return { ...rule, compiledPattern: regex };
			}
		);
	}

	/**
	 * コンパイル済みルールを元に、URLリストの遅延計算を実行します。
	 * @param   {string[]}               urls          - 処理するURLのリスト
	 * @param   {CompiledUrlDelayRule[]} compiledRules - コンパイル済みのルール配列
	 * @param   {number}                 defaultDelay  - デフォルトの遅延時間（ミリ秒）
	 * @param   {number}                 applyFrom     - カスタム遅延を適用し始めるマッチ回数
	 * @returns {UrlDelayCalculationResult[]}          - 計算結果オブジェクトの配列
	 */
	static #processDelayCalculation(urls: string[], compiledRules: CompiledUrlDelayRule[], defaultDelay: number, applyFrom: number): UrlDelayCalculationResult[] {
		const results: UrlDelayCalculationResult[] = [];
		const ruleMatchCount                       = new Map<RegExp, number>();
		let   cumulativeDelay                      = 0;

		for (let i = 0; i < urls.length; i++) {
			const url             = urls[i];
			let   individualDelay = (i === 0) ? 0 : defaultDelay;

			for (const rule of compiledRules) {
				if (rule.compiledPattern.test(url)) {
					const matchCount = ruleMatchCount.get(rule.compiledPattern) || 0;

					if (matchCount + 1 >= applyFrom) {
						individualDelay = rule.delay;
					}

					ruleMatchCount.set(rule.compiledPattern, matchCount + 1);
					break;
				}
			}

			cumulativeDelay += individualDelay;

			results.push({
				url,
				delay: {
					cumulative: cumulativeDelay,
					individual: individualDelay
				}
			});
		}

		return results;
	}

	/**
	 * デフォルトの遅延とカスタムルールに基づいて、リスト内の各URLの累積遅延と個別遅延を計算します。
	 * @param   {string[]}         urls         - 処理するURLのリスト
	 * @param   {number}           defaultDelay - URLを開く間のデフォルト遅延（ミリ秒）
	 * @param   {UrlDelayRule[]}   customRules  - (オプション) カスタム遅延ルールの配列
	 * @param   {number}           applyFrom    - (オプション) 何回目のマッチからカスタム遅延を適用するか。`2`を指定すると2回目から適用。デフォルトは`1`（初回から）。
	 * @returns {UrlDelayCalculationResult[]}   - 各URLとその遅延情報を含むオブジェクトのリスト
	 */
	static calculate(urls: string[], defaultDelay: number, customRules: UrlDelayRule[] = [], applyFrom: number = 1): UrlDelayCalculationResult[] {
		const compiledRules = UrlDelayCalculator.#compileRules(customRules);
		const results       = UrlDelayCalculator.#processDelayCalculation(urls, compiledRules, defaultDelay, applyFrom);

		return results;
	}
}