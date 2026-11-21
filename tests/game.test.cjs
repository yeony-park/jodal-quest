const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const path = require("node:path"),
  { buildSync } = require("esbuild");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "dist/game.css"), "utf8");
const production = fs.readFileSync(path.join(root, "dist/game.js"), "utf8");
function modules(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? modules(path.join(dir, e.name))
        : e.name.endsWith(".js")
          ? [path.join(dir, e.name)]
          : [],
    );
}
const files = modules(path.join(root, "src")).filter((p) => path.basename(p) !== "main.js");
const imports = files
  .map((p, i) => "import * as m" + i + " from " + JSON.stringify(p) + ";")
  .join("\n");
// Test-only exports keep the shipped bundle free of a debug API.
const entry =
  imports +
  "\nimport " +
  JSON.stringify(path.join(root, "src/main.js")) +
  ";\n" +
  "Object.assign(globalThis," +
  files.map((_, i) => "m" + i).join(",") +
  ");\n" +
  "for(const key of Object.keys(globalThis.runtime))Object.defineProperty(globalThis,key,{get(){return runtime[key]},set(v){runtime[key]=v},configurable:true});";
const source = buildSync({
  stdin: { contents: entry, resolveDir: root, sourcefile: "test-entry.js" },
  bundle: true,
  write: false,
  outdir: "test-output",
  format: "iife",
  platform: "browser",
  target: "es2020",
  loader: { ".css": "empty", ".wav": "base64" },
}).outputFiles[0].text;
let checks = 0;
function boot(saved = null, blocked = false, realCanvas = null, productionOnly = false) {
  const ids = [...html.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]),
    elements = new Map(),
    store = new Map(saved === null ? [] : [["jodal-master-v1", saved]]),
    timers = new Map(),
    nodes = [],
    listeners = {};
  let timerId = 0,
    doc;
  const drawing = realCanvas
    ? realCanvas.getContext("2d")
    : new Proxy({}, { get: (t, k) => t[k] ?? (() => {}), set: (t, k, v) => ((t[k] = v), true) });
  function el(id) {
    if (!elements.has(id)) {
      const attrs = {};
      let content = "";
      const node = {
        id,
        textContent: "",
        hidden: false,
        checked: false,
        value: "mentor",
        files: [],
        style: {},
        inert: false,
        tagName: "DIV",
        isConnected: true,
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute(k, v) {
          attrs[k] = String(v);
        },
        getAttribute(k) {
          return attrs[k];
        },
        focus() {
          doc.activeElement = node;
        },
        querySelectorAll() {
          return [];
        },
        getContext() {
          return drawing;
        },
      };
      Object.defineProperty(node, "innerHTML", {
        get() {
          return content;
        },
        set(v) {
          content = v;
          for (const m of v.matchAll(/id="([\w-]+)"/g)) el(m[1]);
        },
      });
      if (id === "world" && realCanvas)
        for (const key of ["width", "height"])
          Object.defineProperty(node, key, {
            get() {
              return realCanvas[key];
            },
            set(v) {
              realCanvas[key] = v;
            },
          });
      elements.set(id, node);
    }
    return elements.get(id);
  }
  doc = {
    getElementById: (id) => elements.get(id) || null,
    addEventListener(k, fn) {
      (listeners[k] ??= []).push(fn);
    },
    body: { classList: { add() {}, remove() {} } },
    activeElement: { isConnected: true, focus() {} },
    hidden: false,
  };
  ids.forEach(el);
  const param = () => ({
    value: 1,
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v) {
      this.value = v;
    },
  });
  class AudioContext {
    constructor() {
      this.sampleRate = 24000;
      this.currentTime = 0;
      this.state = "running";
      this.destination = {};
      this.decoded = null;
    }
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    }
    createBuffer(channels, len, rate) {
      const data = new Float32Array(len);
      return {
        duration: len / rate,
        sampleRate: rate,
        getChannelData() {
          return data;
        },
      };
    }
    createBufferSource() {
      const n = {
        buffer: null,
        playbackRate: param(),
        connect() {},
        disconnect() {},
        start(...args) {
          n.args = args;
        },
        stop() {
          n.stopped = true;
        },
      };
      nodes.push(n);
      return n;
    }
    createOscillator() {
      const n = this.createBufferSource();
      n.frequency = param();
      return n;
    }
    resume() {
      return Promise.resolve();
    }
    decodeAudioData(bytes) {
      this.decoded = this.createBuffer(1, 57600, 24000);
      const data = this.decoded.getChannelData(0);
      const wav = new DataView(bytes);
      for (let i = 0; i < data.length; i++) data[i] = wav.getInt16(44 + i * 2, true) / 32768;
      return Promise.resolve(this.decoded);
    }
  }
  const window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    AudioContext,
    addEventListener() {},
  };
  const c = vm.createContext({
    document: doc,
    window,
    localStorage: {
      getItem: (k) => {
        if (blocked) throw Error("blocked");
        return store.get(k);
      },
      setItem: (k, v) => {
        if (blocked) throw Error("blocked");
        store.set(k, v);
      },
    },
    requestAnimationFrame() {},
    setTimeout(fn) {
      timers.set(++timerId, fn);
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    console,
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
  });
  vm.runInContext(productionOnly ? production : source, c);
  const run = (s) => vm.runInContext(s, c),
    finish = () => run("while(talkState){revealLine();nextLine();}");
  return {
    run,
    el,
    store,
    window,
    doc,
    timers,
    nodes,
    finish,
    listeners,
    context: c,
    fire(k, event) {
      for (const fn of listeners[k] || []) fn(event);
    },
  };
}
function check(name, fn) {
  fn();
  checks++;
  console.log("PASS " + name);
}

async function main() {
  let b = boot();
  check("Title precedes play and blocks office input", () => {
    assert.equal(b.run("titleVisible"), true);
    assert.equal(b.el("game-shell").inert, true);
  });
  b.run("actions.new()");
  await b.run("supplierVoiceReady");
  check("Automatic tutorial starts with five lines", () =>
    assert.equal(b.run("talkState.lines.length"), 5),
  );
  check("Space reveals then advances, held key never skips", () => {
    b.run("handleKey({code:'Space',key:' ',repeat:false,preventDefault(){}})");
    assert.equal(b.run("talkState.index"), 0);
    b.run("handleKey({code:'Space',key:' ',repeat:true,preventDefault(){}})");
    assert.equal(b.run("talkState.index"), 0);
    b.run("handleKey({code:'Space',key:' ',repeat:false,preventDefault(){}})");
    assert.equal(b.run("talkState.index"), 1);
  });
  check("Movement is blocked during tutorial", () => {
    b.run("handleKey({code:'KeyD',key:'d',repeat:false,preventDefault(){}})");
    assert.equal(b.run("keys.size"), 0);
  });
  b.finish();
  check("Tutorial awards badge and opens ruled notebook", () => {
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 1);
    assert.equal(b.el("quest-panel").hidden, false);
    assert.match(css, /repeating-linear-gradient/);
    assert.match(css, /Gaegu-Regular/);
    assert.match(html, /김주문 씀/);
  });
  check("Exactly five visible inventory slots", () =>
    assert.equal((b.el("inventory-slots").innerHTML.match(/data-action="item-/g) || []).length, 5),
  );
  check("All map destinations reachable without crossing walls or furniture", () => {
    for (const start of ["doc", "mentor", "phone", "terminal", "supplier"])
      for (const end of ["doc", "mentor", "phone", "terminal", "supplier"]) {
        b.run(`player.x=spots.${start}.x;player.y=spots.${start}.y`);
        const path = b.run(`routeTo('${end}')`);
        assert.ok(path.length, `${start}->${end}`);
        for (const p of path) assert.equal(b.run(`canWalk(${p.x},${p.y})`), true);
      }
  });
  check("Movement respects office boundaries and furniture", () => {
    assert.equal(b.run("canWalk(-1,100)"), false);
    assert.equal(b.run("canWalk(2.5*TILE,11.5*TILE)"), false);
    b.run("player.x=16;player.y=16;stepPlayer(-32,0)");
    assert.equal(b.run("player.x"), 16);
  });
  check("Target button actually walks to NPC and opens dialogue", () => {
    b.run('player.x=464;player.y=144;go("phone")');
    for (let i = 0; i < 1400 && b.run("target!==null"); i++) b.run(`frame(${i * 35})`);
    assert.equal(b.run("talkState.name"), "수요기관 담당자");
  });
  b.finish();
  check("Wrong request choice explains issue and preserves stage", () => {
    b.run("actions['intake-bad']()");
    assert.equal(b.run("state.stage"), 0);
    assert.match(b.el("modal").innerHTML, /임의로 정하지/);
  });
  check("Request completion saves checkpoint and inventory before advance", () => {
    b.run("actions['intake-good']()");
    assert.equal(JSON.parse(b.store.get("jodal-master-v1")).stage, 1);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 2);
  });
  check("Continue restores completed quest and inventory", () => {
    const c = boot(b.store.get("jodal-master-v1"));
    c.run("actions.continue()");
    assert.equal(c.run("state.stage"), 1);
    assert.equal(c.run("ownedItems().filter(Boolean).length"), 2);
  });
  check("Specification requires mentor information", () => {
    b.run("actions.advance();actions['spec-good']()");
    assert.equal(b.run("state.stage"), 1);
    b.run("mentor()");
    b.finish();
    assert.equal(b.run("state.specAdvice"), true);
  });
  check("Bad specification can be corrected", () => {
    b.run("actions['spec-bad']();actions['spec-empty']();actions['spec-good']()");
    assert.equal(b.run("state.stage"), 2);
    b.run("actions.advance()");
  });
  check("No portal is opened automatically when a quest changes", () =>
    assert.equal(b.run("modalOpen"), false),
  );
  check("Monitor opens G2B homepage with no credential form or popups", () => {
    b.run("terminal()");
    assert.equal(b.run("modalKind"), "portal");
    assert.match(b.el("modal").innerHTML, /나라장터 시작하기/);
    assert.match(b.el("modal").innerHTML, /기관별 공지사항/);
    assert.doesNotMatch(b.el("modal").innerHTML, /type="password"|window.open/);
  });
  check("Unpublished notice is absent from search", () => {
    b.run("openPortal('list')");
    assert.match(b.el("modal").innerHTML, /검색 결과 0건/);
  });
  check("Draft workflow uses mock login", () => {
    b.run("portalWork()");
    assert.match(b.el("modal").innerHTML, /가상 계정으로 로그인/);
    b.run("actions['portal-signin']()");
    assert.match(b.el("modal").innerHTML, /공고 초안/);
  });
  check("Wrong quantity cannot be saved or published", () => {
    b.el("portal-quantity").value = "2";
    b.run("savePortalDraft();close();mentor()");
    b.finish();
    assert.equal(b.run("state.noticeChecked"), false);
    assert.equal(b.run("state.stage"), 2);
  });
  check("Correct quantity persists without independent publication", () => {
    b.run("terminal();portalWork()");
    b.el("portal-quantity").value = "20";
    b.run("savePortalDraft()");
    assert.equal(b.run("state.noticeChecked"), true);
    assert.equal(b.run("state.stage"), 2);
    assert.match(b.el("modal").innerHTML, /아직 공고 전/);
  });
  check("Mentor review and authorized approval precede supplier stage", () => {
    b.run("close();mentor()");
    b.finish();
    assert.equal(b.run("state.stage"), 3);
    assert.match(b.el("modal").innerHTML, /권한 있는 담당자/);
    b.run("actions.advance()");
    assert.equal(b.run("talkState.name"), "욘 대리");
    assert.equal(b.run("talkState.role"), "supplier");
    b.finish();
    assert.equal(b.run("portalSignedIn"), false);
  });
  check("Published notice appears in search with minimal detail", () => {
    b.run("terminal();openPortal('list','모니터')");
    assert.match(b.el("modal").innerHTML, /검색 결과 1건/);
    b.run("openPortal('list','다른물건')");
    assert.match(b.el("modal").innerHTML, /검색 결과 0건/);
  });
  check("Unmatched search text is safely inserted as text", () => {
    b.run(`openPortal('list','<img src=x onerror=alert(1)>')`);
    assert.doesNotMatch(b.el("modal").innerHTML, /<img src=x/);
    assert.equal(b.el("portal-query-label").textContent, "<img src=x onerror=alert(1)>");
  });
  check("Supplier cannot prepare bid without login and suitable product", () => {
    b.run("portalBid()");
    assert.match(b.el("modal").innerHTML, /체험 로그인/);
    b.run("actions['portal-signin']();portalBid()");
    assert.equal(b.run("state.product"), false);
    assert.match(b.el("toast").textContent, /제품/);
  });
  check("Wrong product preserves progress and correct product unlocks form", () => {
    b.run(
      "close();actions['product-bad']();actions['product-good']();close();terminal();portalDetail();portalBid()",
    );
    assert.match(b.el("modal").innerHTML, /18,400,000/);
    assert.match(b.el("modal").innerHTML, /id="eligible"/);
  });
  check("Unchecked requirements prevent bid completion", () => {
    b.el("eligible").checked = false;
    b.run("finishBid()");
    assert.equal(b.run("state.stage"), 3);
  });
  check("Completed bid saves all four quests and five items immediately", () => {
    b.el("eligible").checked = true;
    b.run("finishBid()");
    assert.equal(b.run("state.stage"), 4);
    assert.equal(b.run("state.history.length"), 4);
    assert.equal(JSON.parse(b.store.get("jodal-master-v1")).stage, 4);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 5);
  });
  check("Ending restores rookie and includes exact line and level up", () => {
    b.finish();
    assert.equal(b.run("modalKind"), "result");
    assert.match(b.el("modal").innerHTML, /이제 나도... 조달의 왕이야!/);
    assert.match(b.el("modal").innerHTML, /LEVEL UP!/);
    assert.equal(b.el("level-badge").textContent, "Lv. 2");
    assert.match(b.el("modal").innerHTML, /https:\/\/www.pps.go.kr\/kor\/bbs\/list.do\?key=00645/);
    assert.match(b.el("modal").innerHTML, /채용정보/);
  });
  check("Repeated submit cannot duplicate completed history", () => {
    b.run("finishBid()");
    assert.equal(b.run("state.history.length"), 4);
  });
  check("Completed saved game resumes at level two with full bag", () => {
    const c = boot(b.store.get("jodal-master-v1"));
    c.run("actions.continue()");
    assert.equal(c.run("modalKind"), "result");
    assert.equal(c.run("ownedItems().filter(Boolean).length"), 5);
  });
  check("Embedded actual recording is assigned only to female supplier", () => {
    assert.equal(b.run("voiceClips.has('supplier')"), true);
    assert.equal(b.run("voiceClips.has('mentor')"), false);
    assert.equal(b.run("voiceClips.get('supplier').buffer.duration"), 2.4);
    assert.equal(b.run("voiceClips.get('supplier').offsets.length"), 24);
  });
  check("Female dialogue plays decoded recording, not synthesized PCM", () => {
    b.run("playSyllable('안','supplier')");
    assert.equal(b.nodes.at(-1).buffer, b.run("voiceClips.get('supplier').buffer"));
    assert.ok(b.nodes.at(-1).playbackRate.value > 1);
  });
  check("Every grain is within recording duration and has voiced samples", () => {
    const clip = b.run("voiceClips.get('supplier')");
    for (const offset of clip.offsets) {
      assert.ok(offset + 0.085 <= clip.buffer.duration);
      assert.ok(
        clip.buffer
          .getChannelData(0)
          .slice(offset * 24000, (offset + 0.085) * 24000)
          .some((x) => Math.abs(x) > 0.01),
      );
    }
  });
  check("Sound settings no longer contain team voice upload or character picker", () => {
    b.run("soundSettings()");
    assert.match(b.el("modal").innerHTML, /욘 대리 목소리 듣기/);
    assert.doesNotMatch(
      production,
      /voice-file|voice-role|voice-clear|importVoice|팀원 목소리 불러오기/,
    );
  });
  check("Mute immediately stops all samples", () => {
    b.run("actions.mute()");
    const count = b.nodes.length;
    b.run("playSyllable('안','supplier')");
    assert.equal(b.nodes.length, count);
    assert.equal(b.run("activeSounds.size"), 0);
    b.run("actions.mute()");
  });
  check("Default mentor voice has nonzero bounded samples", () => {
    b.run("playSyllable('안','mentor')");
    const data = b.nodes.at(-1).buffer.getChannelData(0);
    assert.ok(data.some((x) => Math.abs(x) > 0.01));
    assert.ok(data.every((x) => Number.isFinite(x) && Math.abs(x) <= 1));
  });
  check("Dialogue reveal stops ongoing syllables", () => {
    b.run("speak('욘 대리',['안녕하세요'],()=>{},'supplier');revealLine()");
    assert.equal(b.run("activeSounds.size"), 0);
    b.finish();
  });
  check("Camera covers full desktop and mobile viewport without stretching", () => {
    for (const [w, h] of [
      [1920, 1080],
      [1280, 720],
      [390, 844],
      [844, 390],
    ]) {
      b.window.innerWidth = w;
      b.window.innerHeight = h;
      b.run("resizeWorld();draw(1,false);updateMap()");
      assert.ok(b.run("940*view.scale") >= w - 1e-6);
      assert.ok(b.run("620*view.scale") >= h - 1e-6);
      assert.ok(b.run("view.x") >= 0);
      assert.ok(b.run("view.y") >= 0);
    }
  });
  check("Corrupted save still allows a new game", () => {
    const c = boot("{broken");
    c.run("actions.new()");
    assert.equal(c.run("storageOK"), true);
  });
  check("Unavailable storage does not stop entire playthrough", () => {
    const c = boot(null, true);
    c.run("actions.new()");
    c.finish();
    c.run("phone()");
    c.finish();
    c.run("actions['intake-good']();actions.advance();mentor()");
    c.finish();
    c.run("actions['spec-good']();actions.advance();terminal();actions['portal-signin']()");
    c.el("portal-quantity").value = 20;
    c.run("savePortalDraft();close();mentor()");
    c.finish();
    c.run("actions.advance()");
    c.finish();
    c.run(
      "actions['product-good']();close();terminal();actions['portal-signin']();portalDetail();portalBid()",
    );
    c.el("eligible").checked = true;
    c.run("finishBid()");
    c.finish();
    assert.equal(c.run("state.stage"), 4);
    assert.equal(c.run("storageOK"), false);
  });
  check("Fresh game resets quest, inventory, level, and portal account", () => {
    b.run("actions.new()");
    assert.equal(b.run("state.stage"), 0);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 0);
    assert.equal(b.run("portalSignedIn"), false);
    assert.equal(b.el("level-badge").textContent, "Lv. 1");
  });
  check("Offline distribution needs no remote requests or audio fetch", () => {
    assert.doesNotMatch(html, /(?:src|href)="https?:/);
    assert.doesNotMatch(production, /fetch\(|XMLHttpRequest/);
    assert.doesNotMatch(css, /url\(https?:/);
  });
  check("Actual shipped bundle boots and binds the Start button", () => {
    const c = boot(null, false, null, true);
    assert.equal(c.el("game-shell").inert, true);
    c.fire("click", {
      target: {
        closest(selector) {
          return selector === "[data-action]" ? { dataset: { action: "new" } } : null;
        },
      },
    });
    assert.equal(c.el("title-screen").hidden, true);
    assert.equal(c.el("speech-name").textContent, "김주문");
  });
  console.log(`${checks} checks passed.`);
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
module.exports = { boot };
