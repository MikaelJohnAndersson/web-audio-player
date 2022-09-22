<script lang="ts">
  import { setContext } from "svelte";
  import { derived } from "svelte/store";
  import {
    Play,
    Pause,
    Square as Stop,
    Repeat,
    Bell,
    BellOff,
  } from "lucide-svelte";
  import Track from "./Track";
  import ToggleButton from "../ToggleButton.svelte";
  import Visualizer from "../Visualizer.svelte";

  // Output is chained through nodes according to index
  const components = [
    {
      component: Visualizer,
      node: null,
      props: {
        label: "Output",
      },
    },
  ];

  // TODO: Better handling than this (maybe an action?)
  $: nodesMounted = components.every((n) => n.node);
  $: if (nodesMounted) chainNodes();

  const track = new Track();
  const context = track.createReactiveContext();
  setContext("track", context);

  const { state, source, ctx } = context;
  const isPlaying = derived(state, ($state) => $state.isPlaying);
  const duration = derived(state, ($state) => $state.duration);
  const currentTime = derived(state, ($state) => $state.currentTime);
  const loop = derived(state, ($state) => $state.loop);
  const muted = derived(state, ($state) => $state.muted);

  // TODO: Test uploading same file (else just use Map)
  let files = [];
  let file: File;
  $: onChangeFile(file);

  function onChangeFile(file: File) {
    if (!file) return;
    const src = URL.createObjectURL(file);
    // TODO: Handle loading errors
    // TODO: Link url:s/files to a tracklist on the audio element instead
    track.load(src);
  }

  function chainNodes() {
    // TODO: Error handling
    components
      .map((n) => n.node)
      .reduce((prev, curr) => prev.connect(curr), $source)
      .connect($ctx.destination);
  }

  function onTogglePlayback(ev: CustomEvent<{ checked: boolean }>) {
    if (ev.detail.checked) track.play();
    else track.pause();
  }

  function secondsToTime(value: number) {
    const h = Math.floor(value / 3600)
        .toString()
        .padStart(2, "0"),
      m = Math.floor((value % 3600) / 60)
        .toString()
        .padStart(2, "0"),
      s = Math.floor(value % 60)
        .toString()
        .padStart(2, "0");

    return `${h}:${m}:${s}`;
  }

  function handleUploadFiles(ev: Event) {
    const fileList = (ev.target as HTMLInputElement).files;
    files = [...files, ...fileList];

    if (!file) file = files[0];
  }
</script>

<div class="root">
  <!-- TODO: File/directory panel -->
  <div class="file">
    <select bind:value={file}>
      {#each files as file}
        <option value={file}>{file.name}</option>
      {/each}
    </select>
    <label>
      Add file(s)
      <input
        type="file"
        on:change={handleUploadFiles}
        accept="audio/*"
        multiple
      />
    </label>
  </div>
  <div class="controls">
    <div class="menu">
      <ToggleButton
        checked={$isPlaying}
        on:change={onTogglePlayback}
        title={$isPlaying ? "Pause" : "Play"}
      >
        <Pause slot="on" color="darkred" strokeWidth={2} />
        <Play slot="off" color="white" strokeWidth={2} />
      </ToggleButton>
      <button on:click={track.stop.bind(track)} title="Stop">
        <Stop color="white" strokeWidth={2} />
      </button>
      <button on:click={track.toggleLoop.bind(track)} title="Loop">
        <Repeat color={$loop ? "darkgreen" : "white"} strokeWidth={2} />
      </button>
      <ToggleButton
        checked={$muted}
        on:change={track.toggleMute.bind(track)}
        title={$muted ? "Unmute" : "Mute"}
      >
        <BellOff slot="on" color="darkred" strokeWidth={2} />
        <Bell slot="off" color="white" strokeWidth={2} />
      </ToggleButton>
    </div>
    <span class="time">
      <time>
        {secondsToTime($currentTime)}
      </time>
      <time>
        {secondsToTime($duration)}
      </time>
    </span>
    <progress max={$duration} value={$currentTime} />
  </div>
  {#each components as c}
    <svelte:component this={c.component} bind:node={c.node} {...c.props} />
  {/each}
</div>

<style lang="postcss">
  .root {
    display: grid;
    grid-gap: 1rem;
    width: 100%;
    margin: 0;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.1);
    border: 1px solid black;

    & .file {
      display: flex;
      justify-content: space-between;

      & select {
        flex: 1;
      }

      /* TODO: Specificity using [for=...] */
      & label {
        padding: 0.3rem 0.5rem;
        border: 1px solid gray;
        display: inline-block;
        font-size: 12px;
        cursor: pointer;

        & input[type="file"] {
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
      }
    }

    & .controls {
      display: grid;
      grid-template-columns: max-content auto;
      border: 1px solid black;

      & .menu {
        display: flex;
        grid-row: 1 / span 2;

        & button {
          background-color: transparent;
        }
      }

      & .time {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        background-color: rgba(0, 0, 0, 1);
        padding: 0.25rem 1rem;

        & time:not(:last-child)::after {
          margin: 0 0.2rem;
          content: "/";
        }
      }

      & progress {
        appearance: none;
        width: 100%;
        height: 100%;
        grid-column: 2;
      }
    }
  }

  ::-webkit-progress-value {
    background-color: coral;
  }

  ::-moz-progress-bar {
    background-color: coral;
  }
</style>
