import { runtime } from "../core/runtime.js";
import { show, toast } from "../components/modal.js";
import { $ } from "../core/dom.js";
import supplierVoiceData from "../../assets/audio/yon-voice-bank.wav";
import rookieVoiceData from "../../assets/audio/jodal-voice-bank.wav";
import officeMusic from "../../assets/audio/office-loop.mp3";
import firstDayVoice from "../../assets/audio/first-day.mp3";
import titleCall from "../../assets/audio/title-call.mp3";

const settingsKey = "jodal-sound-v1";
const settings = { dialogue: true, music: true, effects: true, musicVolume: 20 };
try {
  const saved = JSON.parse(localStorage.getItem(settingsKey));
  for (const channel of ["dialogue", "music", "effects"]) {
    if (typeof saved?.[channel] === "boolean") settings[channel] = saved[channel];
  }
  if (Number.isInteger(saved?.musicVolume) && saved.musicVolume >= 0 && saved.musicVolume <= 100)
    settings.musicVolume = saved.musicVolume;
} catch { /* Storage may be unavailable during offline play. */ }

let musicBuffer, musicGain, musicSource;
let musicReady, titleReady, titleVoice;
let ringNotes = [];
let narration;
let titlePending = true;
const activeEffects = new Set();

// Start the two decoded tracks and the CSS animation on the same frame.
export function playTitleIntro(startAnimation, fromGesture = false) {
  if (!titlePending) return;
  function finish(buffer) {
    if (!titlePending) return;
    titlePending = false;
    startAnimation();
    syncMusic();
    if (!runtime.titleVisible) return;
    if (!settings.dialogue || !buffer) return;
    const ctx = runtime.audioCtx, voice = ctx.createBufferSource(), gain = ctx.createGain();
    titleVoice = voice;
    voice.buffer = buffer;
    gain.gain.value = 0.65;
    voice.connect(gain);
    gain.connect(ctx.destination);
    voice.onended = () => { voice.disconnect(); gain.disconnect(); titleVoice = null; };
    voice.start();
  }
  if (!prepareAudio() || (!settings.dialogue && (!settings.music || !settings.musicVolume))) {
    finish(null);
    return;
  }
  const ctx = runtime.audioCtx;
  if (!titleReady) titleReady = settings.dialogue ? decodeTrack(titleCall).catch(() => null) : Promise.resolve(null);
  const ready = ctx.state === "running" ? Promise.resolve() : ctx.resume();
  Promise.all([musicReady, titleReady, ready]).then(([, voice]) => {
    if (document.hidden) return;
    requestAnimationFrame(() => finish(voice));
  }).catch(() => {
    // Keep the game accessible if audio cannot be resumed even by a user gesture.
    if (fromGesture) finish(null);
  });
}

function decodeTrack(data) {
  return runtime.audioCtx.decodeAudioData(Uint8Array.from(atob(data), c => c.charCodeAt(0)).buffer);
}

export const voiceClips = new Map();

export const activeVoices = new Set();

// Register a processed recording without changing another character's voice.
// Offsets and duration are seconds; the recording remains an offline build asset.
export async function loadVoiceBank(role, bytes, offsets, segment = 0.085) {
  if (!["rookie", "supplier"].includes(role) || !runtime.audioCtx)
    throw new Error("Unsupported voice role or unavailable audio context");
  if (!(segment > 0) || !Number.isFinite(segment) || !Array.isArray(offsets) || !offsets.length ||
      offsets.some((n) => !Number.isFinite(n) || n < 0))
    throw new Error("Invalid voice segments");
  const buffer = await runtime.audioCtx.decodeAudioData(bytes);
  if (offsets.some((n) => n + segment > buffer.duration + 1e-6))
    throw new Error("Voice segment exceeds recording duration");
  const clip = { buffer, offsets: [...offsets], segment };
  voiceClips.set(role, clip);
  return clip;
}

export function loadSupplierVoice() {
  if (runtime.supplierVoiceReady) return;
  runtime.supplierVoiceReady = loadVoiceBank(
    "supplier",
    Uint8Array.from(atob(supplierVoiceData), (c) => c.charCodeAt(0)).buffer,
    Array.from({ length: 24 }, (_, i) => i * 0.1),
  ).catch(() => toast("음성 재생이 지원되지 않아 기본 목소리로 재생합니다."));
}

export function loadRookieVoice() {
  if (runtime.rookieVoiceReady) return;
  runtime.rookieVoiceReady = loadVoiceBank(
    "rookie",
    Uint8Array.from(atob(rookieVoiceData), (c) => c.charCodeAt(0)).buffer,
    Array.from({ length: 24 }, (_, i) => i * 0.1),
  ).catch(() => toast("조달달 음성을 재생할 수 없어 기본 목소리로 전환합니다."));
}

function prepareAudio() {
  if (!runtime.audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    runtime.audioCtx = new AC();
    runtime.master = runtime.audioCtx.createGain();
    runtime.master.gain.value = 0.28;
    runtime.master.connect(runtime.audioCtx.destination);
    musicGain = runtime.audioCtx.createGain();
    musicGain.connect(runtime.audioCtx.destination);
    musicReady = decodeTrack(officeMusic)
      .then(buffer => { musicBuffer = buffer; syncMusic(); })
      .catch(() => toast("배경음악을 재생할 수 없어요."));
  }
  return true;
}

export function unlockAudio() {
  if (!prepareAudio()) return false;
  loadSupplierVoice();
  loadRookieVoice();
  if (runtime.audioCtx.state === "suspended")
    runtime.audioCtx
      .resume()
      .catch(() => toast("소리 재생을 위해 사운드 버튼을 다시 눌러 주세요."));
  return true;
}

export function syncMusic() {
  if (!musicBuffer || (runtime.titleVisible && titlePending)) return;
  if (!settings.music || document.hidden) {
    if (musicSource) {
      musicSource.stop();
      musicSource.disconnect();
      musicSource = null;
    }
    return;
  }
  musicGain.gain.setValueAtTime(settings.musicVolume / 100, runtime.audioCtx.currentTime);
  if (musicSource) return;
  musicSource = runtime.audioCtx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop = true;
  musicSource.connect(musicGain);
  musicSource.start();
}

function stopSources(sources) {
  for (const source of sources) source.stop();
  sources.clear();
}

export function stopVoices() {
  stopSources(activeVoices);
}

export function stopEffects() {
  stopSources(activeEffects);
}

export function changeSoundSetting(key, value) {
  settings[key] = value;
  if (key === "dialogue" && !value) { stopVoices(); stopFirstDayVoice(); titleVoice?.stop(); }
  if (key === "effects" && !value) stopEffects();
  if (key === "music" || key === "musicVolume") syncMusic();
  if (key === "musicVolume") $("music-level").textContent = value + "%";
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch { /* Keep the settings for this session. */ }
}

export function playSyllable(letter, role = "mentor", delay = 0) {
  if (
    !settings.dialogue || document.hidden ||
    titleVoice ||
    !runtime.audioCtx ||
    runtime.audioCtx.state !== "running" ||
    /\s|[.,!?…·]/.test(letter)
  )
    return;
  const clip = voiceClips.get(role),
    code = letter.codePointAt(0) || 0,
    rate = (!clip && role === "rookie" ? 1.7 : 1.4) + (code % 7) * 0.045;
  const source = runtime.audioCtx.createBufferSource(),
    gain = runtime.audioCtx.createGain();
  let offset = 0,
    segment = 0.085;
  if (clip) {
    source.buffer = clip.buffer;
    segment = clip.segment;
    offset = clip.offsets[code % clip.offsets.length];
  } else {
    const length = Math.floor(runtime.audioCtx.sampleRate * segment),
      buffer = runtime.audioCtx.createBuffer(1, length, runtime.audioCtx.sampleRate),
      data = buffer.getChannelData(0),
      f0 = 155 + (code % 9) * 14;
    for (let i = 0; i < length; i++) {
      const t = i / runtime.audioCtx.sampleRate;
      let value = 0;
      for (let h = 1; h <= 7; h++) {
        const hz = f0 * h,
          weight =
            (0.25 +
              Math.exp(-Math.pow((hz - 750) / 350, 2)) +
              0.6 * Math.exp(-Math.pow((hz - 1450) / 500, 2))) /
            h;
        value += Math.sin(2 * Math.PI * hz * t) * weight;
      }
      data[i] = value * 0.25;
    }
    source.buffer = buffer;
  }
  source.playbackRate.value = rate;
  const when = runtime.audioCtx.currentTime + delay,
    duration = segment / rate;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.7, when + 0.008);
  gain.gain.linearRampToValueAtTime(0, when + duration);
  source.connect(gain);
  gain.connect(runtime.master);
  activeVoices.add(source);
  source.onended = () => {
    activeVoices.delete(source);
    source.disconnect();
    gain.disconnect();
  };
  source.start(when, offset, segment);
  source.stop(when + duration + 0.01);
}

function effectNote(frequency, delay, duration, level, type, endFrequency) {
  const ctx = runtime.audioCtx;
  if (!settings.effects || ctx?.state !== "running") return;
  const source = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + delay;
  source.type = type;
  source.frequency.setValueAtTime(frequency, t);
  if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(gain);
  gain.connect(runtime.master);
  activeEffects.add(source);
  source.onended = () => { activeEffects.delete(source); source.disconnect(); gain.disconnect(); };
  source.start(t);
  source.stop(t + duration);
  return source;
}

export function elevatorChime() {
  effectNote(784, 0, 0.44, 0.35, "sine");
  effectNote(587.33, 0.26, 0.62, 0.32, "sine");
}

export function keyClick() {
  effectNote(1140, 0, 0.023, 0.16, "square", 630);
  effectNote(340, 0.012, 0.034, 0.15, "triangle", 170);
}

export function playFirstDayVoice() {
  if (!settings.dialogue || typeof Audio === "undefined") return;
  if (titleVoice) titleVoice.stop();
  narration = new Audio("data:audio/mpeg;base64," + firstDayVoice);
  narration.volume = 0.72;
  narration.play().catch(() => {});
}

export function stopFirstDayVoice() {
  narration?.pause();
  narration = null;
}

export function footstep() {
  // A short sole impact followed by a brighter heel tap, audible on small speakers.
  effectNote(145, 0, 0.095, 0.25, "triangle", 76);
  effectNote(720 + Math.random() * 130, 0.008, 0.042, 0.10, "triangle", 285);
}

export function cabinetCreak() {
  effectNote(280, 0, 0.13, 0.12, "sawtooth", 390);
  effectNote(380, 0.11, 0.17, 0.1, "sawtooth", 246);
}

export function ringPhone() {
  if (!settings.effects || runtime.audioCtx?.state !== "running") return 0;
  for (const frequency of [440, 480]) {
    ringNotes.push(effectNote(frequency, 0, 0.27, 0.16, "sine"));
    ringNotes.push(effectNote(frequency, 0.35, 0.27, 0.16, "sine"));
  }
  return 700;
}

export function stopRing() {
  for (const note of ringNotes) if (activeEffects.has(note)) note.stop();
  ringNotes = [];
}

export function playPaperTurn() {
  const ctx = runtime.audioCtx;
  if (!settings.effects || ctx?.state !== "running") return;
  const rustle = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.22), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < samples.length; i++) {
    const noise = Math.random() * 2 - 1;
    const t = i / samples.length;
    const fold = Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t);
    samples[i] = (noise - previous) * fold * fold * 0.12;
    previous = noise;
  }
  rustle.buffer = buffer;
  rustle.connect(runtime.master);
  activeEffects.add(rustle);
  rustle.onended = () => { activeEffects.delete(rustle); rustle.disconnect(); };
  rustle.start();
}

export function playCardDiscovery() {
  playPaperTurn();
  effectNote(659.25, 0.12, 0.33, 0.15, "sine");
  effectNote(783.99, 0.24, 0.38, 0.13, "sine");
  effectNote(1244.51, 0.43, 0.58, 0.10, "sine");
}

export function questFanfare() {
  // Two accents: a short G major chord resolves to a longer, higher C major chord.
  for (const hz of [392, 493.88, 587.33]) effectNote(hz, 0, 0.13, 0.20, "triangle");
  for (const hz of [523.25, 659.25, 783.99]) effectNote(hz, 0.16, 0.46, 0.24, "triangle");
}

export function soundSettings() {
  const toggle = (key, label) => `<label class="sound-row"><input type="checkbox"
    data-sound="${key}" ${settings[key] ? "checked" : ""}> ${label}</label>`;
  show(
    "사운드 설정",
    /* HTML */ `${toggle("dialogue", "캐릭터 대화소리")}
      ${toggle("music", "배경음악")}
      <div class="sound-row">
        <label for="music-volume">배경음악 음량</label>
        <input id="music-volume" type="range" min="0" max="100" value="${settings.musicVolume}">
        <output id="music-level" for="music-volume">${settings.musicVolume}%</output>
      </div>
      ${toggle("effects", "효과음")}
      <p>조달달과 욘 대리의 목소리는 직접 녹음했어요. 김주문과 다른 인물의 목소리는 합성 음성이에요.</p>
      <div class="actions">
        <button class="primary" data-action="rookie-voice-preview">조달달 목소리 듣기</button>
        <button class="primary" data-action="voice-preview">욘 대리 목소리 듣기</button>
      </div>`,
    "sound",
  );
}

export async function previewVoice(role = "supplier") {
  if (!unlockAudio()) return;
  await (role === "rookie" ? runtime.rookieVoiceReady : runtime.supplierVoiceReady);
  stopVoices();
  if (!settings.dialogue) {
    toast("캐릭터 대화소리를 켠 뒤 들어 주세요.");
    return;
  }
  Array.from(role === "rookie" ? "이제 나도 조달의 왕이야" : "안녕하세요, 입찰에 참여할게요").forEach((letter, i) =>
    playSyllable(letter, role, i * 0.095),
  );
}

export { supplierVoiceData, rookieVoiceData };
