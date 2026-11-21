import { fresh } from "../data/initial-state.js";

export const keys = new Set();

export const player = { x: 464, y: 144 };

export const runtime = {
  state: fresh(),
  floor: 0,
  storageOK: true,
  loaded: false,
  modalOpen: false,
  lastFocus: null,
  modalKind: "",
  toastTimer: null,
  target: null,
  touchKey: null,
  last: 0,
  walk: 0,
  audioCtx: null,
  master: null,
  muted: false,
  volume: 0.28,
  supplierVoiceReady: null,
  rookieVoiceReady: null,
  talkState: null,
  talkTimer: null,
  titleVisible: true,
  view: { width: 940, height: 560, dpr: 1, scale: 1, x: 0, y: 0 },
  portalSignedIn: false,
};
