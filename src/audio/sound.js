import { runtime } from "../core/runtime.js";
import { show, toast } from "../components/modal.js";
import { $ } from "../core/dom.js";
import supplierVoiceData from "../../assets/audio/yon-voice-bank.wav";
import rookieVoiceData from "../../assets/audio/jodal-voice-bank.wav";
import officeMusic from "../../assets/audio/office-loop.mp3";

const settingsKey = "jodal-sound-v1";
const settings = { dialogue: true, music: true, effects: true, musicVolume: 35 };
try {
  const saved = JSON.parse(localStorage.getItem(settingsKey));
  for (const channel of ["dialogue", "music", "effects"]) {
    if (typeof saved?.[channel] === "boolean") settings[channel] = saved[channel];
  }
  if (Number.isInteger(saved?.musicVolume) && saved.musicVolume >= 0 && saved.musicVolume <= 100)
    settings.musicVolume = saved.musicVolume;
} catch { /* Storage may be unavailable during offline play. */ }

let musicBuffer, musicGain, musicSource;
const activeEffects = new Set();

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

export function unlockAudio() {
  if (!runtime.audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    runtime.audioCtx = new AC();
    runtime.master = runtime.audioCtx.createGain();
    runtime.master.gain.value = 0.28;
    runtime.master.connect(runtime.audioCtx.destination);
    musicGain = runtime.audioCtx.createGain();
    musicGain.connect(runtime.audioCtx.destination);
    runtime.audioCtx.decodeAudioData(Uint8Array.from(atob(officeMusic), c => c.charCodeAt(0)).buffer)
      .then(buffer => { musicBuffer = buffer; syncMusic(); })
      .catch(() => toast("배경음악을 재생할 수 없어요."));
    loadSupplierVoice();
    loadRookieVoice();
  }
  if (runtime.audioCtx.state === "suspended")
    runtime.audioCtx
      .resume()
      .catch(() => toast("소리 재생을 위해 사운드 버튼을 다시 눌러 주세요."));
  return true;
}

export function syncMusic() {
  if (!musicBuffer) return;
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
  if (key === "dialogue" && !value) stopVoices();
  if (key === "effects" && !value) stopEffects();
  if (key === "music" || key === "musicVolume") syncMusic();
  if (key === "musicVolume") $("music-level").textContent = value + "%";
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch { /* Keep the settings for this session. */ }
}

export function playSyllable(letter, role = "mentor", delay = 0) {
  if (
    !settings.dialogue ||
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

function effectNote(frequency, delay, duration, level, type) {
  const ctx = runtime.audioCtx;
  if (!settings.effects || ctx?.state !== "running") return;
  const source = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + delay;
  source.type = type;
  source.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(gain);
  gain.connect(runtime.master);
  activeEffects.add(source);
  source.onended = () => { activeEffects.delete(source); source.disconnect(); gain.disconnect(); };
  source.start(t);
  source.stop(t + duration);
}

export function chime() {
  [523.25, 659.25, 783.99].forEach((hz, i) => effectNote(hz, i * 0.11, 0.25, 0.17, "sine"));
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
      <p>조달달과 욘 대리의 음성은 실제 녹음된 목소리입니다. 김주문과 그 외 인물은 기본 합성 음성이 적용됩니다.</p>
      <div class="actions">
        <button class="primary" data-action="rookie-voice-preview">조달달 목소리 듣기</button>
        <button class="primary" data-action="voice-preview">욘 대리 목소리 듣기</button
        ><button class="secondary" data-action="close">닫기</button>
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
  Array.from(role === "rookie" ? "이제나도조달의왕이야" : "안녕하세요입찰에참여할게요").forEach((letter, i) =>
    playSyllable(letter, role, i * 0.095),
  );
}

export { supplierVoiceData, rookieVoiceData };
