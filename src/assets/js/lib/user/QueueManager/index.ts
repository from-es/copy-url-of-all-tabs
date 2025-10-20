import PQueue from "p-queue";

// `p-queue` のタスク直列実行を行う為、`1` を指定
const CONCURRENCY: number = 1;

class QueueClass {
	readonly #LOWEST_PRIORITY: number = 0;
	readonly #HIGHT_PRIORITY : number = this.#LOWEST_PRIORITY + 1;
	readonly #empty          : number = 0;
	readonly #queue          : PQueue;

	constructor(concurrency: number) {
		this.#queue = new PQueue({ concurrency });
	}

	addTask(task: () => Promise<any>): void {
		this.#queue.add(task, { priority: this.#LOWEST_PRIORITY });
	}

	addPriorityTask(task: () => Promise<any>): void {
		this.#queue.add(task, { priority: this.#HIGHT_PRIORITY });
	}

	clear(): void {
		this.#queue.clear();
	}

	pause(): void {
		this.#queue.pause();
	}

	resume(): void {
		this.#queue.start();
	}

	isActive(): boolean {
		return this.#queue.size > this.#empty || this.#queue.pending > this.#empty;
	}

	getPendingCount(): number {
		return this.#queue.size;
	}

	getRunningCount(): number {
		return this.#queue.pending;
	}

	onIdle(): Promise<void> {
		return this.#queue.onIdle();
	}
}



export const QueueManager = new QueueClass(CONCURRENCY);