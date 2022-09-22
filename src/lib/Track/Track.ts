import { writable, readable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";

interface PlaybackState {
  isPlaying: boolean;
  isReady: boolean;
  duration: number;
  currentTime: number;
  loop: boolean;
  muted: boolean;
}

export interface TrackContext {
  ctx: Readable<AudioContext>;
  source: Readable<MediaElementAudioSourceNode>;
  state: {
    subscribe: Writable<PlaybackState>["subscribe"];
  };
}

export default class Track {
  readonly audio: HTMLAudioElement;
  readonly context = new AudioContext();
  readonly sourceNode: MediaElementAudioSourceNode;
  readonly nodes: AudioNode[];

  private state: Writable<PlaybackState> = writable({
    isPlaying: false,
    isReady: false,
    duration: null,
    currentTime: null,
    loop: false,
    muted: false,
  });

  constructor(src?: string) {
    this.context.onstatechange = (ev) =>
      console.log("Audio ctxt state change", ev);
    this.audio = this.createAudioElement(src);
    this.sourceNode = this.context.createMediaElementSource(this.audio);
  }

  public createReactiveContext(): TrackContext {
    return {
      ctx: readable(this.context),
      source: readable(this.sourceNode),
      state: {
        subscribe: this.state.subscribe,
      },
    };
  }

  private createAudioElement(src?: string) {
    // TODO: Reset state on new creation?
    const audio = new Audio(src);
    audio.onplay = () => this.state.update((s) => ({ ...s, isPlaying: true }));
    audio.onpause = () =>
      this.state.update((s) => ({ ...s, isPlaying: false }));
    audio.onloadeddata = () =>
      this.state.update((s) => ({
        ...s,
        isReady: true,
        duration: audio.duration,
      }));
    audio.ontimeupdate = () =>
      this.state.update((s) => ({ ...s, currentTime: this.audio.currentTime }));
    audio.onended = () => {
      this.audio.currentTime = 0;
      this.state.update((s) => ({ ...s, isPlaying: false }));
    };

    // TODO: error event listener

    return audio;
  }

  public play() {
    this.audio.play();
  }

  public pause() {
    this.audio.pause();
  }

  public stop() {
    this.pause();
    this.audio.currentTime = 0;
  }

  public load(src: string) {
    this.audio.src = src;
    this.audio.load();
  }

  public toggleLoop() {
    this.audio.loop = !this.audio.loop;
    this.state.update((s) => ({ ...s, loop: this.audio.loop }));
  }

  public toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.state.update((s) => ({ ...s, muted: this.audio.muted }));
  }
}
