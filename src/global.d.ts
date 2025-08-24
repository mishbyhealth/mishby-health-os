/// <reference types="vite/client" />
/// <reference lib="webworker" />

declare var Worker: {
  prototype: Worker;
  new (stringUrl: string): Worker;
};

declare const self: WorkerGlobalScope & typeof globalThis;
