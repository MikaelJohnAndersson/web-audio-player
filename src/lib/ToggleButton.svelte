<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  export let disabled = false;
  export let title = null;

  const dispatch = createEventDispatcher<{ change: { checked: boolean } }>();

  function onClick() {
    dispatch("change", { checked: !checked });
  }
</script>

<button on:click={onClick} {disabled} {title}>
  {#if checked}
    <slot name="on" />
  {:else}
    <slot name="off" />
  {/if}
</button>
