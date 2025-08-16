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