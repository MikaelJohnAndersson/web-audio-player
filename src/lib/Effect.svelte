<script lang="ts">
  export let label: string;
</script>

<fieldset>
  <legend>{label}</legend>
  <slot />
</fieldset>

<style>
  fieldset {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 1rem;
    padding: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
</style>
