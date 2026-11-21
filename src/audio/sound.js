import { runtime } from "../core/runtime.js";
import { show, toast } from "../components/modal.js";
import { $ } from "../core/dom.js";
import supplierVoiceData from "../../assets/audio/yon-voice-bank.wav";

export const voiceClips = new Map();

export const activeSounds = new Set();

export function loadSupplierVoice() {
  if (runtime.supplierVoiceReady) return;
  runtime.supplierVoiceReady = runtime.audioCtx
    .decodeAudioData(Uint8Array.from(atob(supplierVoiceData), (c) => c.charCodeAt(0)).buffer)
    .then((buffer) => {
      voiceClips.set("supplier", {
        buffer,
        offsets: Array.from({ length: 24 }, (_, i) => i * 0.1),
      });
    })
    .catch(() => toast("녹음 재생을 지원하지 않아 기본 목소리를 사용합니다."));
}

export function unlockAudio() {
  if (!runtime.audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    runtime.audioCtx = new AC();
    runtime.master = runtime.audioCtx.createGain();
    runtime.master.gain.value = runtime.muted ? 0 : runtime.volume;
    runtime.master.connect(runtime.audioCtx.destination);
    loadSupplierVoice();
  }
  if (runtime.audioCtx.state === "suspended")
    runtime.audioCtx
      .resume()
      .catch(() => toast("소리 재생을 위해 사운드 버튼을 다시 눌러 주세요."));
  return true;
}

export function stopSounds() {
  for (const source of activeSounds) {
    try {
      source.stop();
    } catch (e) {}
  }
  activeSounds.clear();
}

export function updateVolume() {
  if (runtime.master)
    runtime.master.gain.setValueAtTime(
      runtime.muted ? 0 : runtime.volume,
      runtime.audioCtx.currentTime,
    );
  $("sound-toggle").textContent = runtime.muted ? "♫ 꺼짐" : "♫ 소리";
  const m = $("mute-button");
  if (m) m.textContent = runtime.muted ? "소리 켜기" : "소리 끄기";
}

export function playSyllable(letter, role = "mentor", delay = 0) {
  if (
    runtime.muted ||
    !runtime.audioCtx ||
    runtime.audioCtx.state !== "running" ||
    /\s|[.,!?…·]/.test(letter)
  )
    return;
  const clip = voiceClips.get(role),
    code = letter.codePointAt(0) || 0,
    rate = (role === "rookie" ? 1.7 : 1.4) + (code % 7) * 0.045;
  const source = runtime.audioCtx.createBufferSource(),
    gain = runtime.audioCtx.createGain();
  let offset = 0,
    segment = 0.085;
  if (clip) {
    source.buffer = clip.buffer;
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
  activeSounds.add(source);
  source.onended = () => {
    activeSounds.delete(source);
    source.disconnect();
    gain.disconnect();
  };
  source.start(when, offset, segment);
  source.stop(when + duration + 0.01);
}

export function chime() {
  if (runtime.muted || !runtime.audioCtx || runtime.audioCtx.state !== "running") return;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const s = runtime.audioCtx.createOscillator(),
      g = runtime.audioCtx.createGain(),
      t = runtime.audioCtx.currentTime + i * 0.11;
    s.type = "sine";
    s.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.17, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    s.connect(g);
    g.connect(runtime.master);
    activeSounds.add(s);
    s.onended = () => {
      activeSounds.delete(s);
      s.disconnect();
      g.disconnect();
    };
    s.start(t);
    s.stop(t + 0.27);
  });
}

export function soundSettings() {
  if (runtime.talkState) {
    runtime.muted = !runtime.muted;
    stopSounds();
    updateVolume();
    toast(runtime.muted ? "대화 소리를 껐어요." : "대화 소리를 켰어요.");
    return;
  }
  show(
    "사운드",
    /* HTML */ `<p>
        여성 기업 담당자 욘 대리는 팀원의 실제 녹음을 짧게 잘라 웅얼거리는 목소리로 말합니다.
      </p>
      <div class="sound-row">
        <label for="volume">음량</label
        ><input
          id="volume"
          type="range"
          min="0"
          max="70"
          value="${Math.round(runtime.volume * 100)}"
          aria-label="음량"
        />
      </div>
      <p>김주문과 조달달은 기본 합성 목소리를 사용합니다.</p>
      <div class="actions">
        <button class="primary" data-action="voice-preview">욘 대리 목소리 듣기</button
        ><button class="secondary" data-action="mute" id="mute-button">
          ${runtime.muted ? "소리 켜기" : "소리 끄기"}</button
        ><button class="secondary" data-action="close">닫기</button>
      </div>`,
    "sound",
  );
}

export async function previewVoice() {
  if (!unlockAudio()) return;
  await runtime.supplierVoiceReady;
  stopSounds();
  if (runtime.muted) {
    toast("소리를 켠 뒤 들어 주세요.");
    return;
  }
  Array.from("안녕하세요입찰에참여할게요").forEach((letter, i) =>
    playSyllable(letter, "supplier", i * 0.095),
  );
}

export { supplierVoiceData };
