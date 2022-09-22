<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import { derived } from "svelte/store";
  import type { TrackContext } from "./Track/Track";
  import Effect from "./Effect.svelte";

  const FFT_SIZE = 256;
  const MIN_DB = -90;
  const MAX_DB = 0;
  const SMOOTHING = 0.85;

  export let label: string;
  export let node: AnalyserNode;

  let canvas: HTMLCanvasElement;
  let dataArray: Uint8Array;
  let bufferLength: number;

  let animFrame: number = null;
  onDestroy(() => {
    cancelAnimationFrame(animFrame);
  });

  const { ctx, state } = getContext<TrackContext>("track");
  ctx.subscribe(createNode);

  // TODO: Fix draw() method still being called on ended event
  const isPlaying = derived(state, ($state) => $state.isPlaying);
  $: $isPlaying ? start() : stop();

  function createNode(_ctx: AudioContext) {
    node = _ctx.createAnalyser();
    node.fftSize = FFT_SIZE;
    node.minDecibels = MIN_DB;
    node.maxDecibels = MAX_DB;
    node.smoothingTimeConstant = SMOOTHING;

    bufferLength = node.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  function start() {
    animFrame = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(animFrame);

    if (canvas) {
      const canvasCtx = canvas.getContext("2d");
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function draw() {
    if (!canvas) {
      console.warn("Visualizer draw(): canvas is undefined: ", canvas);
      return;
    }
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    node.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight: number;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;

      canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
      canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }

    animFrame = requestAnimationFrame(draw);
  }
</script>

<Effect {label}>
  <canvas bind:this={canvas} width={500} height={100} />
</Effect>

<style>
  canvas {
    width: 500px;
    height: 100px;
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
