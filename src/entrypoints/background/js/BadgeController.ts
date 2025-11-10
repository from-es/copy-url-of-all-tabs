// WXT provided cross-browser compatible API
import { browser } from "wxt/browser";

// Import NPM Package
import PQueue from "p-queue";

// Import Types
import type { Config } from "@/assets/js/types";

// Import Module
import { sleep } from "@/assets/js/utils/sleep";



type BadgeColor = {
	text      : string;
	background: string;
};
type BadgeThemeTemplate = {
	default: BadgeColor;
	light  : BadgeColor;
	dark   : BadgeColor;
};



/**
 * 拡張機能のバッジ表示を制御するクラス。
 * バッジのテキストと色の更新を管理し、非同期操作の競合を回避するためにキューを使用。
 */
class BadgeController {
	#isEnabled: boolean = false; // enable状態を保持
	#color: BadgeColor = {
		text      : "",
		background: ""
	};
	/**
	 * 定義済みのバッジテーマ（色設定）を保持するテンプレート。
	 * light, dark, default の各テーマの色情報を含む。
	 */
	#template: BadgeThemeTemplate = {
		default: {
			text      : "#ffffff",
			background: "#767676"
		},
		light: {
			text      : "#000000",
			background: "#ffffff"
		},
		dark: {
			text      : "#ffffff",
			background: "#000000"
		}
	};
	/**
	 * カウントが 0 になった際にバッジをクリアするまでの待機時間（ミリ秒）。
	 */
	#waitingTime: number = 3000; // millisecond
	/**
	 * バッジのUI操作（テキスト、色更新）を直列化するためのキュー。
	 * 非同期API呼び出しの競合状態を回避。
	 */
	readonly #queue: PQueue;

	/**
	 * BadgeController のコンストラクタ。
	 * デフォルトのバッジ色を設定し、UI操作キューを初期化。
	 * 初期化処理はキュー経由で実行。
	 */
	constructor() {
		// バッジテーマの初期化
		this.#color = structuredClone(this.#template.default);

		// UI操作を直列化するためのキュー
		this.#queue = new PQueue({ concurrency: 1 });

		// PQueue のエラーハンドリング
		this.#queue.on("error", (error) => {
			console.error("PQueue error in BadgeController:", error);
		});

		// 初期化もキュー経由で行う
		this.#queue.add(() => this.initializeColor());
	}

	/**
	 * ストレージから設定を読み込み、バッジの色を初期化。
	 * @returns {Promise<void>}
	 */
	private async initializeColor(): Promise<void> {
		try {
			const { config } = await browser.storage.local.get("config");
			if (config && config.Badge) {
				this.updateColor(config.Badge);
			}
		} catch (error) {
			console.error("Failed to initialize badge color from storage:", error);
			// ストレージから取得できなくても、デフォルト色で続行
			await this.applyColor(this.#color);
		}
	}

	/**
	 * バッジの色を更新。
	 * @param {Config["Badge"]} badgeConfig - Badge設定オブジェクト
	 * @returns {void}
	 */
	public updateColor(badgeConfig: Config["Badge"]): void {
		this.#queue.add(async () => {
			if (!badgeConfig || typeof badgeConfig !== "object") {
				console.error("Invalid badge config provided to updateColor:", badgeConfig);
				return;
			}

			this.#isEnabled = badgeConfig.enable; // バッジカウンター表示の「有効/無効」状態を更新

			if (!this.#isEnabled) {
				// 無効ならバッジをクリアして終了
				await browser.action.setBadgeText({ text: "" });
				return;
			}

			let newColor: BadgeColor;

			switch (badgeConfig.theme.type) {
				case "light":
					newColor = structuredClone(this.#template.light);
					break;
				case "dark":
					newColor = structuredClone(this.#template.dark);
					break;
				case "custom":
					newColor = badgeConfig.theme.color;
					break;
				default:
					console.error("Unknown badge theme type:", badgeConfig.theme.type);
					return;
			}

			// 色設定が不正な場合は何もしない
			if (!newColor || typeof newColor.text !== "string" || typeof newColor.background !== "string") {
				console.error("Invalid color object derived from config:", newColor);
				return;
			}

			this.#color = newColor;
			await this.applyColor(this.#color);
		});
	}

	/**
	 * 実際にブラウザAPIを呼び出して色を適用。
	 * @param {BadgeColor} color - 適用する色
	 * @returns {Promise<void>}
	 */
	private async applyColor(color: BadgeColor): Promise<void> {
		try {
			await browser.action.setBadgeTextColor({ color: color.text });
			await browser.action.setBadgeBackgroundColor({ color: color.background });
		} catch (error) {
			console.error("Failed to apply badge color:", { error, color });
		}
	}

	/**
	 * バッジのテキストを更新。
	 * カウントが 0 の場合、'0' を一時的に表示した後、バッジをクリア。
	 * @param {string} text - 表示テキスト（数値の文字列）
	 * @returns {void}
	 */
	public updateText(text: string): void {
		if (!this.#isEnabled) {
			// そもそも無効なら何もしない
			return;
		}

		const count = parseInt(text, 10);

		// 不正な値の場合はバッジをクリア
		if (typeof count !== "number" || isNaN(count) || count < 0) {
			this.#queue.add(() => browser.action.setBadgeText({ text: "" }));
			return;
		}

		// カウントが 0 より大きい場合は数値を表示
		if (count > 0) {
			this.#queue.add(async () => {
				try {
					await browser.action.setBadgeText({ text: String(count) });
				} catch (error) {
					console.error("Failed to set badge text:", { error, text: String(count) });
				}
			});
			return;
		}

		// カウントが 0 の場合は '0' を指定時間(#waitingTime)表示後、クリア
		this.#queue.add(async () => {
			try {
				await browser.action.setBadgeText({ text: "0" });
				await sleep(this.#waitingTime);
				await browser.action.setBadgeText({ text: "" });
			} catch (error) {
				console.error("Failed to clear badge text after delay:", { error });
			}
		});
	}
}



export const badgeController = new BadgeController();