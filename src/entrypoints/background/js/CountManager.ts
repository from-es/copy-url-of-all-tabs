// 通知を受け取る関数の型定義、新しいカウント数を引数として受け取る
type Listener = (count: number) => void;

/**
 * 待機中URLのカウント数を管理し、変更を購読者に通知するクラス。
 * UIの存在を知らず、純粋な状態管理に専念する。
 */
class CountManager {
	#count    : number     = 0;  // 現在のカウント数
	#listeners: Listener[] = []; // カウント数の変更を通知する購読者（リスナー関数）のリスト

	/**
	 * 通知を受け取る関数を購読者として登録し、購読解除用の関数を返す
	 * @param   {Listener}   listener - 新しいカウント数を受け取る関数
	 * @returns {() => void}          - 購読を解除するための関数。この関数を実行すると、登録した特定のリスナーのみが通知リストから削除される
	 */
	public subscribe(listener: Listener): () => void {
		this.#listeners.push(listener);

		// 購読解除用の関数を返す
		return () => {
			this.#listeners = this.#listeners.filter(removeListener => removeListener !== listener);
		};
	}

	/**
	 * カウンターを初期化
	 * @param   {number} [initialCount=0] - 初期値、デフォルトは 0
	 * @returns {void}
	 */
	public initialize(initialCount: number = 0): void {
		this.#setCount(initialCount);
	}

	/**
	 * カウンターをリセット（0 に戻す）
	 * @returns {void}
	 */
	public reset(): void {
		this.#setCount(0);
	}

	/**
	 * カウンターを増やし、変更を全購読者に通知
	 * @param   {number} [value=1] - 増やす値、デフォルトは 1
	 * @returns {void}
	 */
	public increment(value: number = 1): void {
		this.#setCount(this.#count + value);
	}

	/**
	 * カウンターを減らし、変更を全購読者に通知
	 * @param   {number} [value=1] - 減らす値、デフォルトは 1
	 * @returns {void}
	 */
	public decrement(value: number = 1): void {
		this.#setCount(Math.max(0, this.#count - value));
	}

	/**
	 * 現在のカウント数を返す
	 * @returns {number} 現在のカウント数
	 */
	public getCount(): number {
		return this.#count;
	}

	/**
	 * カウントを設定し、登録されている全購読者（リスナー）に現在のカウント数を伝えて実行
	 * @param   {number} newCount - 新しいカウント数
	 * @returns {void}
	 */
	#setCount(newCount: number): void {
		this.#count = newCount;
		this.#notify();
	}

	/**
	 * 登録されている全購読者（リスナー）に現在のカウント数を伝えて実行
	 * @returns {void}
	 */
	#notify(): void {
		for (const listener of this.#listeners) {
			listener(this.#count);
		}
	}
}



export const countManager = new CountManager();