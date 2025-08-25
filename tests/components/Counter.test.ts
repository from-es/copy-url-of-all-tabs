import { render, fireEvent, screen, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import Counter from "./Counter.svelte";

describe("Counter.svelte", () => {
	// 各テストの実行後にDOMをクリーンアップし、テスト間の副作用（stateの残留など）を防ぎます。
	afterEach(() => cleanup());

	it("コンポーネントがマウントされ、初期カウントが正しく表示されること", () => {
		// 1. 準備(Arrange): テスト対象のコンポーネントを初期値0でレンダリングします。
		render(Counter, { props: { count: 0 } });

		// 2. 検証(Assert): "Current count: 0" というテキストを持つ要素が存在することを確認します。
		expect(screen.getByText("Current count: 0")).toBeTruthy();
	});

	it("ボタンクリックでカウントがインクリメントされること", async () => {
		// 1. 準備(Arrange): コンポーネントを初期値0でレンダリングします。
		render(Counter, { props: { count: 0 } });
		const button = screen.getByText("Increment");

		// 2. 実行(Act): ボタンを1回クリックします。
		await fireEvent.click(button);

		// 3. 検証(Assert): カウントが1になっていることを確認します。
		expect(screen.getByText("Current count: 1")).toBeTruthy();

		// 4. 実行(Act): ボタンをもう1回クリックします。
		await fireEvent.click(button);

		// 5. 検証(Assert): カウントが2になっていることを確認します。
		expect(screen.getByText("Current count: 2")).toBeTruthy();
	});
});