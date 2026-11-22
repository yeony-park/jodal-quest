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
  loader: { ".css": "empty", ".wav": "base64", ".mp3": "base64" },
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
  const drawCalls = [], drawEvents = [];
  const drawing = realCanvas
    ? realCanvas.getContext("2d")
    : new Proxy({ drawImage(...args) { drawCalls.push(args); drawEvents.push("sprite"); }, strokeRect() { drawEvents.push("target"); } }, { get: (t, k) => t[k] ?? (() => {}), set: (t, k, v) => ((t[k] = v), true) });
  function offscreen() {
    const pixels = new Map();
    const g = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) pixels.set(xx + "," + yy, g.fillStyle);
      },
    };
    return { width: 0, height: 0, pixels, getContext: () => g };
  }
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
    createElement: (tag) => tag === "canvas"
      ? offscreen()
      : el("created-" + ++timerId),
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
      if (Buffer.from(bytes).toString("ascii", 0, 4) !== "RIFF")
        return Promise.resolve(this.createBuffer(1, 24000, 24000));
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
    drawCalls,
    drawEvents,
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
  check("Cached sprites have solid body pixels and attached legs in every walk pose", () => {
    for (const kind of ["rookie", "mentor", "supplier", "officer"])
      for (let pose = 0; pose < 4; pose++) {
        const sheet = b.run(`spriteSheet('${kind}',${pose})`);
        assert.equal(sheet, b.run(`spriteSheet('${kind}',${pose})`));
        assert.equal(sheet.width, 16);
        assert.equal(sheet.height, 24);
        const pixels = sheet.pixels, seen = new Set(), queue = [pixels.keys().next().value];
        for (let i = 0; i < queue.length; i++) {
          const key = queue[i];
          if (seen.has(key)) continue;
          seen.add(key);
          const [x, y] = key.split(",").map(Number);
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const next = (x + dx) + "," + (y + dy);
            if (pixels.has(next) && !seen.has(next)) queue.push(next);
          }
        }
        assert.equal(seen.size, pixels.size, `${kind} pose ${pose} has detached pixels`);
        for (let y = 13; y <= 19; y++)
          for (let x = 5; x <= 11; x++) assert.ok(pixels.has(x + "," + y));
      }
  });
  check("Sprites draw once at integer device pixels under fractional camera scales", () => {
    for (const [w, h, dpr] of [[1280,720,1],[390,844,2],[844,390,1.25]]) {
      b.window.innerWidth = w;
      b.window.innerHeight = h;
      b.window.devicePixelRatio = dpr;
      b.run("resizeWorld();camera();pixelPerson(464.3,144.7,'rookie',true)");
      const args = b.drawCalls.at(-1);
      assert.equal(args.length, 5);
      assert.ok(args.slice(1).every(Number.isInteger));
      assert.ok(args[3] >= 16 && args[4] >= 24);
    }
    b.window.innerWidth = 1280;
    b.window.innerHeight = 720;
    b.window.devicePixelRatio = 1;
    b.run("resizeWorld()");
  });
  check("Furniture and floor target markers are painted behind characters", () => {
    const order = b.run("paintOrder([{id:'person',x0:13.5,y0:12.5,x1:13.5,y1:12.5},{id:'desk',x0:13,y0:11,x1:16,y1:12}]).map(x=>x.id).join(',')");
    assert.equal(order, "desk,person");
    b.drawEvents.length = 0;
    b.run("draw(1,false)");
    assert.ok(b.drawEvents.indexOf("target") >= 0);
    assert.ok(b.drawEvents.indexOf("target") < b.drawEvents.lastIndexOf("sprite"));
  });
  check("Malformed recovery IDs cannot enable Continue or trap a resumed game", () => {
    for(const fields of [{pendingRecovery:['spec-brand']},{recoveries:[['spec-brand']]},{pendingRecovery:{id:'spec-brand'}},{recoveries:[null]},{recoveries:[1]}]) {
      const saved=JSON.parse(b.run('JSON.stringify(fresh())'));
      Object.assign(saved,{stage:1,xp:100,started:true,brief:true},fields);
      const c=boot(JSON.stringify(saved));
      assert.equal(c.run('loaded'),false,JSON.stringify(fields));
      c.run('actions.continue()');
      assert.notEqual(c.run('modalKind'),'recovery');
      assert.equal(c.run('state.pendingRecovery'),null);
    }
    const saved=JSON.parse(b.run('JSON.stringify(fresh())'));
    Object.assign(saved,{stage:1,xp:100,started:true,brief:true,pendingRecovery:'spec-brand'});
    const c=boot(JSON.stringify(saved));c.run('actions.continue();recover()');c.finish();c.run('finishRecovery()');
    assert.equal(c.run('state.stage'),2);
    assert.equal(c.run('state.pendingRecovery'),null);
  });
  check("Supplier furnishings outline only the active desk and terminal", () => {
    const c=boot();c.run('state.stage=3');
    const counts={};
    for(const id of ['phone','doc','terminal']) {
      c.drawEvents.length=0;
      c.run(`player.x=spots.${id}.x;player.y=spots.${id}.y;drawFurniture(floors[0].furnishings.find(o=>o.spot==='${id}'))`);
      counts[id]=c.drawEvents.filter(e=>e==='target').length;
    }
    assert.equal(counts.phone,0);assert.ok(counts.doc>0);assert.ok(counts.terminal>0);
    c.run('state.stage=1');c.drawEvents.length=0;
    c.run("player.x=spots.phone.x;player.y=spots.phone.y;drawFurniture(floors[0].furnishings.find(o=>o.spot==='phone'))");
    assert.ok(c.drawEvents.includes('target'));
  });
  check("Mentor and monitor labels clear silhouettes and each other at desktop and phone sizes", () => {
    const c=boot();
    for(const [w,h] of [[1280,720],[390,844]]) for(const [stage,floor] of [[1,0],[3,0],[4,1]]) {
      c.window.innerWidth=w;c.window.innerHeight=h;
      c.run(`state.stage=${stage};runtime.floor=${floor};state.brief=true;player.x=448;player.y=112;resizeWorld();camera();updateMap()`);
      const visuals=c.run('labelVisuals()'), placed=[];
      for(const id of ['mentor','doc','terminal','phone','supplier','elevator','officer','bidroom']) {
        const el=c.el('spot-'+id);if(el.hidden)continue;
        const rect={x:parseFloat(el.style.left)-65,y:parseFloat(el.style.top)-17,w:130,h:34};
        if (el.style.visibility === "hidden") continue;
        for(const other of [...visuals,...placed]) assert.ok(!(rect.x<other.x+other.w&&rect.x+rect.w>other.x&&rect.y<other.y+other.h&&rect.y+rect.h>other.y),`${w} stage ${stage} ${id} overlaps a silhouette/label`);
        const own=visuals.find(v=>v.id===id);
        // 화면 밖 대상의 이름표는 가장자리에 붙으므로 화면 안 대상만 거리를 봅니다.
        if(own&&own.x>=0&&own.x+own.w<=w&&own.y>=0&&own.y+own.h<=h){
          const dx=Math.max(own.x-(rect.x+rect.w),rect.x-(own.x+own.w),0), dy=Math.max(own.y-(rect.y+rect.h),rect.y-(own.y+own.h),0);
          assert.ok(Math.hypot(dx,dy)<=100,`${w} stage ${stage} ${id} label sits ${Math.round(Math.hypot(dx,dy))}px from its target`);
        }
        placed.push(rect);
      }
    }
  });
  check("Destination labels stay anchored to their desks throughout the approach", () => {
    for (const [width, height] of [[1280,720], [390,844]]) {
      const c = boot();
      c.window.innerWidth = width;
      c.window.innerHeight = height;
      c.run("titleVisible=false;state.started=true;state.brief=true;resizeWorld()");
      for (const [stage, id] of [[0,"phone"], [2,"terminal"]]) {
        c.run(`state.stage=${stage}`);
        let anchor;
        for (const offset of [100, 55, 25, 5, 0, -24]) {
          c.run(`player.x=spots.${id}.x+${offset};player.y=spots.${id}.y;camera();positionLabels()`);
          const label = c.el("spot-" + id), view = c.run("view");
          const world = [parseFloat(label.style.left) / view.scale + view.x,
            parseFloat(label.style.top) / view.scale + view.y];
          if (!anchor) anchor = world;
          assert.ok(world.every((v,i) => Math.abs(v - anchor[i]) < 0.01));
          if (!offset) assert.equal(c.run("interactionTarget()"), id);
        }
      }
    }
  });
  check("Occluded goal markers disappear whole while an open floor marker remains a diamond", () => {
    const c=boot();
    assert.equal(c.run('floorMarkerBounds(spots.mentor)'),null);
    assert.equal(c.run('drawFloorMarker(spots.mentor,sceneItems(false))'),false);
    const open=c.run(`(() => {for(let x=16;x<MAP_W*TILE;x+=32)for(let y=16;y<MAP_H*TILE;y+=32)if(canWalk(x,y)&&floorMarkerBounds({x,y}))return {x,y};})()`);
    assert.ok(open);
    assert.equal(c.run(`drawFloorMarker(${JSON.stringify(open)},sceneItems(false))`),true);
  });
  check("Both floors order every furnishing type before front cells and after rear cells", () => {
    const c = boot();
    const count = c.run(`(() => {
      let count = 0;
      for (let f=0; f<2; f++) for (const o of floors[f].furnishings) {
        for (const [x,y,front] of [
          [o.x+o.w/2,o.y+o.h+0.5,true],
          [o.x+o.w+0.5,o.y+o.h/2,true],
          [o.x+o.w/2,o.y-0.5,false],
          [o.x-0.5,o.y+o.h/2,false],
        ]) {
          runtime.floor=f; player.x=x*TILE; player.y=y*TILE;
          const items=paintOrder(sceneItems(false));
          const person=items.findIndex(i=>i.actor==='rookie');
          const furnishing=items.findIndex(i=>i.furniture===o);
          if ((person>furnishing)!==front) throw Error(f+':'+o.type+':'+x+','+y);
          count++;
        }
      }
      return count;
    })()`);
    assert.equal(count, c.run("4 * (floors[0].furnishings.length + floors[1].furnishings.length)"));
  });
  check("All 77 item and step pairs submit only the matching document without score loss", () => {
    const config={intake:[0,true,true,false,false,false,false,false,false],specification:[1,true,true,true,false,false,false,false,false],notice:[2,true,true,true,false,false,false,false,false],approval:[2,true,true,true,true,false,false,false,false],product:[3,true,true,true,true,false,false,false,false],bid:[3,true,true,true,true,true,false,false,false],award:[4,true,true,true,true,true,false,false,false],price:[4,true,true,true,true,true,true,false,false],contract:[4,true,true,true,true,true,true,true,false],delivery:[5,true,true,true,true,true,true,true,false],payment:[5,true,true,true,true,true,true,true,true]};
    const required={intake:1,specification:2,notice:2,approval:2,product:3,bid:3,award:4,price:4,contract:4,delivery:5,payment:5};
    let pairs=0;
    for (const [step,values] of Object.entries(config)) for(let item=0;item<7;item++) {
      const c=boot();
      const [stage,brief,contact,specAdvice,noticeChecked,product,awardBrief,openingChecked,inspectionChecked]=values;
      c.run(`Object.assign(state,${JSON.stringify({stage,brief,contact,specAdvice,noticeChecked,product,awardBrief,openingChecked,inspectionChecked})});runtime.floor=${stage===4?1:0};requestSubmission(submissionSteps['${step}'].target,()=>state.history.push('submitted'))`);
      assert.equal(c.run("pendingSubmission.step"),step);
      const expected=required[step]===item;
      assert.equal(c.run(`submitItem(${item})`),expected,step+':'+item);
      assert.equal(c.run("state.mistakes"),0);
      assert.equal(c.run("state.stage"),stage);
      assert.equal(c.run("state.history.length"),expected?1:0);
      if(!expected) assert.equal(c.run("pendingSubmission.step"),step);
      pairs++;
    }
    assert.equal(pairs,77);
  });
  check("Interactable outline contrast exceeds WCAG non-text 3 to 1", () => {
    assert.ok(b.run("contrastRatio(interactableColors.bright,interactableColors.edge)")>=3);
    for(const surface of ['#e5e2cc','#f0ecd9','#b7d8d2','#c5e1d8','#f2d6b4','#cea890','#b18776'])
      assert.ok(b.run(`contrastRatio(interactableColors.edge,'${surface}')`)>=3,surface);
    assert.match(css,/prefers-reduced-motion/);
    assert.match(css,/goal-glow/);
  });
  check("Each recovery teaches a corrective step and rejoins one storyline exactly once", () => {
    for(const id of b.run("Object.keys(recoveryScenes)")) {
      const c=boot();
      c.run(`Object.assign(state,{stage:recoveryScenes['${id}'].stage,brief:true,contact:true,specAdvice:true,noticeChecked:false,product:false,awardBrief:true,openingChecked:true,deliveryIssueReported:true,inspectionChecked:true});runtime.floor=state.stage===4?1:0;state.xp=state.stage*100;beginRecovery('${id}')`);
      const originalStage=c.run("state.stage");
      assert.equal(c.run("state.pendingRecovery"),id);
      assert.equal(c.run("state.mistakes"),1);
      assert.doesNotMatch(c.el("modal").innerHTML,/다시 검토하기|다시 고르/);
      const resumed=boot(c.store.get('jodal-master-v1'));
      resumed.run('actions.continue()');
      assert.equal(resumed.run('modalKind'),'recovery');
      c.run('recover()');c.finish();
      assert.match(c.el('modal').innerHTML,/key=00179/);
      c.run('finishRecovery()');c.finish();
      assert.equal(c.run('state.pendingRecovery'),null);
      assert.equal(c.run('state.recoveries.length'),1);
      assert.equal(c.run('state.mistakes'),1);
      assert.ok(c.run('state.stage')>=originalStage);
      c.run('finishRecovery()');
      assert.equal(c.run('state.recoveries.length'),1);
    }
  });
  check("Version one stages zero through six load with safe new defaults", () => {
    for(let stage=0;stage<=6;stage++) {
      const old=JSON.parse(b.run('JSON.stringify(fresh())')); old.stage=stage;old.started=true;
      delete old.recoveries;delete old.pendingRecovery;delete old.xp;delete old.questMistakes;delete old.contractFarewell;
      const c=boot(JSON.stringify(old));
      assert.equal(c.run('state.stage'),stage);
      assert.equal(c.run('state.recoveries.length'),0);
      assert.equal(c.run('state.pendingRecovery'),null);
    }
    for(const fields of [{recoveries:['unknown']},{recoveries:['intake','intake']},{pendingRecovery:'payment'},{recoveries:'intake'}]) {
      const old=JSON.parse(b.run('JSON.stringify(fresh())'));old.started=true;Object.assign(old,fields);
      assert.equal(boot(JSON.stringify(old)).run('loaded'),false);
    }
  });
  check("Ending titles and achievement lists distinguish proper and recovered runs", () => {
    const c=boot();
    c.run('state.stage=6;result()');
    assert.match(c.el('modal').innerHTML,/<h2 id="modal-title">정파<\/h2>/);
    c.run("state.recoveries=['intake','spec-empty','payment'];result()");
    assert.match(c.el('modal').innerHTML,/<h2 id="modal-title">사파<\/h2>/);
    assert.match(c.el('modal').innerHTML,/빈 규격서 수습/);
    assert.equal(c.run("endingTitle([],3)"),"사파");
    assert.equal(c.run("endingTitle([],1)"),"정파 · 수습을 배운 신입");
  });
  check("All choice buttons contain only their decision text", () => {
    const c=boot();
    for(const stage of [0,1,3]) {
      c.run(`state.stage=${stage};documentDesk()`);
      assert.doesNotMatch(c.el('modal').innerHTML,/<button class="choice"[^>]*>[^]*?<small>/);
    }
  });
  check("Every conversation replies in the rookie recording before its callback", () => {
    const c=boot();
    c.run(`speak('김주문',['확인해 주세요.'],()=>{state.brief=true;},'mentor','네, 확인할게요.');revealLine();nextLine()`);
    assert.equal(c.run("talkState.role"), "rookie");
    assert.equal(c.run("state.brief"), false);
    c.finish();
    assert.equal(c.run("state.brief"), true);
  });
  check("Rookie replies are written per conversation and never play while the supplier is the player", () => {
    const c=boot();
    c.run(`speak('안내',['먼저 선배에게 가 보세요.']);revealLine();nextLine()`);
    assert.equal(c.run("talkState"), null);
    c.run(`state.stage=3;speak('욘 대리',['공고를 읽어 볼게요.'],()=>{},'supplier','네!');revealLine();nextLine()`);
    assert.equal(c.run("talkState"), null);
    c.run(`state.stage=0;mentor();`);
    c.run(`while(talkState&&talkState.role!=='rookie'){revealLine();nextLine()}`);
    assert.match(c.run("talkState.lines[0]"), /납기/);
    c.run(`state.stage=1;mentor();`);
    c.run(`while(talkState&&talkState.role!=='rookie'){revealLine();nextLine()}`);
    assert.match(c.run("talkState.lines[0]"), /성능 기준/);
  });
  b.run("actions.new()");
  await b.run("Promise.all([supplierVoiceReady,rookieVoiceReady])");
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
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 2);
    assert.equal(b.el("quest-panel").hidden, false);
    assert.match(css, /repeating-linear-gradient/);
    assert.match(css, /Gaegu-Regular/);
    assert.match(html, /김주문 씀/);
  });
  check("Exactly seven visible inventory slots", () =>
    assert.equal((b.el("inventory-slots").innerHTML.match(/data-action="item-/g) || []).length, 7),
  );
  check("All map destinations reachable without crossing walls or furniture", () => {
    for (const start of ["doc", "mentor", "phone", "terminal", "supplier", "elevator"])
      for (const end of ["doc", "mentor", "phone", "terminal", "supplier", "elevator"]) {
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
  check("NPCs stand beside reachable interaction positions without occupying furniture", () => {
    for (const id of ["mentor", "supplier", "officer"]) {
      const spot = b.run(`spots.${id}`);
      assert.equal(b.run(`cellBlocked(Math.floor(${spot.npcX}/TILE),Math.floor(${spot.npcY}/TILE),${spot.floor})`), false);
      assert.ok(Math.hypot(spot.x - spot.npcX, spot.y - spot.npcY) < 55);
      const stop = b.run(`project(${spot.x},${spot.y})`), npc = b.run(`project(${spot.npcX},${spot.npcY})`);
      assert.ok(Math.abs(stop.x - npc.x) >= 32, `${id} overlaps the arriving player`);
      if (id === "officer") {
        const otherStop = b.run("project(spots.bidroom.x,spots.bidroom.y)");
        assert.ok(Math.abs(otherStop.x - npc.x) >= 32, "officer overlaps the bidroom arrival");
      }
    }
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
    assert.match(b.el("modal").innerHTML, /원래 요청한 일정/);
  });
  check("Request completion saves checkpoint and inventory before advance", () => {
    b.run("finishRecovery()");
    assert.equal(JSON.parse(b.store.get("jodal-master-v1")).stage, 1);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 3);
  });
  check("Continue restores completed quest and inventory", () => {
    const c = boot(b.store.get("jodal-master-v1"));
    c.run("actions.continue()");
    assert.equal(c.run("state.stage"), 1);
    assert.equal(c.run("ownedItems().filter(Boolean).length"), 3);
  });
  check("Specification requires mentor information", () => {
    b.run("actions.advance();actions['spec-good']()");
    assert.equal(b.run("state.stage"), 1);
    b.run("mentor()");
    b.finish();
    assert.equal(b.run("state.specAdvice"), true);
  });
  check("Bad specification can be corrected", () => {
    b.run("actions['spec-bad']();recover();while(talkState){revealLine();nextLine();}finishRecovery()");
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
    assert.match(b.el("modal").innerHTML, /업무 계정으로 로그인/);
    b.run("actions['portal-signin']()");
    assert.match(b.el("modal").innerHTML, /공고 초안/);
  });
  check("Wrong quantity cannot be saved or published", () => {
    b.el("portal-quantity").value = "2";
    b.run("savePortalDraft()");
    b.finish();
    assert.equal(b.run("state.noticeChecked"), false);
    assert.equal(b.run("state.stage"), 2);
  });
  check("Correct quantity persists without independent publication", () => {
    b.run("terminal();portalWork()");
    b.el("portal-quantity").value = "20";
    b.run("finishRecovery()");
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
    assert.equal(b.run("talkState"), null);
    assert.equal(b.run("sceneItems(false).at(-1).actor"), "supplier");
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
    assert.match(b.el("modal").innerHTML, /홈 \/ 로그인/);
    b.run("actions['portal-signin']();portalBid()");
    assert.equal(b.run("state.product"), false);
    assert.match(b.el("toast").textContent, /제품/);
  });
  check("Wrong product preserves progress and correct product unlocks form", () => {
    b.run(
      "close();actions['product-bad']();finishRecovery();close();terminal();portalDetail();portalBid()",
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
  b.finish();
  check("Bid receipt teaches the distinction between submission and contract", () => {
    assert.equal(b.run("modalKind"), "advance");
    assert.match(b.el("modal").innerHTML, /이번 업무에서 배운 것/);
    b.run("actions['return-rookie']()");
    b.finish();
  });
  check("Bid receipt returns to rookie and routes the next objective through the elevator", () => {
    assert.equal(b.run("state.stage"), 4);
    assert.equal(b.run("modalKind"), "");
    assert.equal(b.run("nextTarget()"), "officer");
    assert.equal(b.run("guideTarget(nextTarget())"), "elevator");
    assert.equal(b.run("spotActive('officer')"), false);
    assert.equal(b.run("spotActive('elevator')"), true);
  });
  check("Legacy version-one stage-four saves continue into the new quests", () => {
    const old = JSON.parse(b.store.get("jodal-master-v1"));
    for (const key of ["floor", "awardBrief", "openingChecked", "deliveryIssueReported", "inspectionChecked"]) delete old[key];
    const c = boot(JSON.stringify(old));
    c.run("actions.continue()");
    assert.equal(c.run("state.stage"), 4);
    assert.equal(c.run("state.awardBrief"), false);
    assert.equal(c.run("floor"), 0);
    assert.equal(c.run("modalKind"), "");
  });
  check("Elevator travels to 2F, updates hotspots and persists its floor", () => {
    b.run("actions.elevator();actions['floor-1']();updateMap()");
    assert.equal(b.run("floor"), 1);
    assert.equal(b.el("spot-doc").hidden, true);
    assert.equal(b.el("spot-officer").hidden, false);
    assert.equal(b.el("spot-elevator").hidden, false);
    assert.equal(JSON.parse(b.store.get("jodal-master-v1")).floor, 1);
    assert.match(b.el("location").textContent, /2층/);
    assert.equal(b.el("mini-layout").innerHTML, b.run("miniLayout()"));
    const c = boot(b.store.get("jodal-master-v1"));
    c.run("actions.continue()");
    assert.equal(c.run("floor"), 1);
    assert.equal(c.run("canWalk(player.x,player.y)"), true);
    assert.equal(c.run("player.x"), 48);
  });
  check("Every 2F destination is reachable without crossing partitions", () => {
    for (const start of ["elevator", "officer", "bidroom"])
      for (const end of ["elevator", "officer", "bidroom"]) {
        b.run(`player.x=spots.${start}.x;player.y=spots.${start}.y`);
        const route = b.run(`routeTo('${end}')`);
        assert.ok(route.length, `${start}->${end}`);
        for (const p of route) assert.equal(b.run(`canWalk(${p.x},${p.y})`), true);
      }
  });
  check("Contract requires the briefing and confirmation of the already determined price", () => {
    b.run("actions['contract-good']();actions['opening-good']()");
    assert.equal(b.run("state.stage"), 4);
    assert.equal(b.run("state.openingChecked"), false);
    b.run("officer()");
    b.finish();
    b.run("bidroom();actions['opening-bad']()");
    assert.equal(b.run("state.openingChecked"), false);
    assert.match(b.el("modal").innerHTML, /순서 오류/);
    b.run("finishRecovery();officer()");
    b.finish();
    b.run("actions['contract-bad']()");
    assert.equal(b.run("state.stage"), 4);
    b.run("finishRecovery()");
    assert.equal(b.run("state.stage"), 5);
    assert.equal(b.run("state.history.length"), 5);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 6);
    assert.equal(b.run("guideTarget(nextTarget())"), "officer");
    b.run("actions['contract-farewell']()");
    b.finish();
    assert.equal(b.run("guideTarget(nextTarget())"), "elevator");
  });
  check("Payment and inspection cannot skip delivery correction or the return to 5F", () => {
    b.run("actions['delivery-report']();actions['delivery-good']();actions['payment-good']()");
    assert.equal(b.run("state.deliveryIssueReported"), false);
    assert.equal(b.run("state.stage"), 5);
    b.run("actions.advance();actions['floor-0']();actions.terminal();if(pendingSubmission)submitItem(submissionSteps[pendingSubmission.step].item)");
    assert.match(b.el("modal").innerHTML, /납품 자료/);
    b.run("actions['payment-good']();actions.phone();if(pendingSubmission)submitItem(submissionSteps[pendingSubmission.step].item);actions['delivery-bad']()");
    assert.equal(b.run("state.inspectionChecked"), false);
    b.run("finishRecovery()");
    b.finish();
    b.run("actions.phone();if(pendingSubmission)submitItem(submissionSteps[pendingSubmission.step].item)");
    assert.match(b.el("modal").innerHTML, /20대 · 부족분 보완/);
    b.run("actions['delivery-good']()");
    assert.equal(b.run("state.inspectionChecked"), true);
    assert.equal(b.run("nextTarget()"), "terminal");
  });
  check("Payment completion saves six quests and seven items before the ending", () => {
    b.run("actions.terminal();if(pendingSubmission)submitItem(submissionSteps[pendingSubmission.step].item);actions['payment-bad']()");
    assert.equal(b.run("state.stage"), 5);
    b.run("actions.terminal();if(pendingSubmission)submitItem(submissionSteps[pendingSubmission.step].item);finishRecovery()");
    assert.equal(JSON.parse(b.store.get("jodal-master-v1")).stage, 6);
    assert.equal(b.run("state.history.length"), 6);
    assert.equal(b.run("ownedItems().filter(Boolean).length"), 7);
  });
  check("Ending restores rookie and includes exact line and earned level", () => {
    b.finish();
    assert.equal(b.run("modalKind"), "result");
    assert.match(b.el("modal").innerHTML, /이제 나도... 조달의 왕이야!/);
    assert.match(b.el("modal").innerHTML, /최종 Lv. 5/);
    assert.equal(b.el("level-badge").textContent, "Lv. 5");
    assert.match(b.el("modal").innerHTML, /https:\/\/www.pps.go.kr\/kor\/bbs\/list.do\?key=00645/);
    assert.doesNotMatch(b.el("modal").innerHTML, /채용정보로 이동합니다|외부 사이트/);
  });
  check("Repeated submit cannot duplicate completed history", () => {
    b.run("finishBid()");
    assert.equal(b.run("state.history.length"), 6);
  });
  check("Six completed quests each play one two-accent fanfare through scene changes", () => {
    const notes = b.nodes.filter(n => n.type === "triangle");
    assert.equal(notes.length, 6 * 6);
    for (let i = 0; i < notes.length; i += 6) {
      const accents = notes.slice(i, i + 6).map(n => n.args[0]);
      assert.deepEqual(accents, [0, 0, 0, .16, .16, .16]);
    }
  });
  check("Completed saved game resumes at its earned level with full bag", () => {
    const c = boot(b.store.get("jodal-master-v1"));
    c.run("actions.continue()");
    assert.equal(c.run("modalKind"), "result");
    assert.equal(c.run("ownedItems().filter(Boolean).length"), 7);
  });
  check("Physical WASD, Q and E work with Hangul and Process key values and release cleanly", () => {
    const c=boot();c.run('state.started=true;titleVisible=false;player.x=272;player.y=240');
    for(const [code,key] of [['KeyW','ㅈ'],['KeyA','ㅁ'],['KeyS','ㄴ'],['KeyD','ㅇ'],['KeyW','Process']]) {
      c.run('player.x=272;player.y=240;runtime.last=965');
      const e={code,key,target:{tagName:'CANVAS'},preventDefault(){}};
      c.fire('keydown',e);c.run('frame(1000)');
      assert.ok(c.run('Math.hypot(player.x-272,player.y-240)')>4);
      c.fire('keyup',e);
      const position=c.run('JSON.stringify(player)');c.run('frame(1035)');
      assert.equal(c.run('JSON.stringify(player)'),position);
      assert.equal(c.run('keys.size'),0);
    }
    c.el('quest-panel').hidden=true;
    c.fire('keydown',{code:'KeyQ',key:'ㅂ',target:{tagName:'CANVAS'},preventDefault(){}});
    assert.equal(c.el('quest-panel').hidden,false);
    c.run('state.brief=true;player.x=spots.phone.x;player.y=spots.phone.y');
    c.fire('keydown',{code:'KeyE',key:'ㄷ',target:{tagName:'CANVAS'},preventDefault(){}});
    assert.equal(c.run('talkState.name'),'수요기관 담당자');
  });
  check("Manual, arrow and auto movement all travel at 145 world pixels per second", () => {
    const c=boot();c.run('state.started=true;titleVisible=false');
    const distances=[];
    for(const key of ['w','arrowup','auto']) {
      c.run(`keys.clear();target=null;player.x=272;player.y=240;runtime.last=965;${key==='auto'?'target={id:"doc",path:[{x:372,y:240}],index:0}':`keys.add('${key}')`};frame(1000)`);
      distances.push(c.run('Math.hypot(player.x-272,player.y-240)'));
    }
    distances.forEach(d=>assert.ok(Math.abs(d-145*0.035)<1e-8));
  });
  check("NPC and furniture outlines appear only inside the two-tile interaction radius", () => {
    const c=boot();c.run('state.stage=1;view.scale=1;view.dpr=1');
    for(const id of ['phone','doc','terminal']) {
      for(const [offset,expected] of [[64,true],[65,false],[250,false]]) {
        c.drawEvents.length=0;
        c.run(`player.x=spots.${id}.x+${offset};player.y=spots.${id}.y;drawFurniture(floors[0].furnishings.find(o=>o.spot==='${id}'))`);
        assert.equal(c.drawEvents.includes('target'),expected,id+' '+offset);
      }
    }
    for(const id of ['mentor','supplier','officer']) {
      c.run(`runtime.floor=spots.${id}.floor`);
      for(const [offset,width] of [[0,20],[65,16]]) {
        c.run(`player.x=spots.${id}.x+${offset};player.y=spots.${id}.y;pixelPerson(spots.${id}.npcX,spots.${id}.npcY,'${id}')`);
        assert.equal(c.drawCalls.at(-1)[0].width,width);
      }
    }
  });
  check("Only the distant goal keeps its name and minimap dot while nearby names appear", () => {
    const c=boot();c.run('state.stage=1;player.x=16;player.y=240;render();updateMap()');
    assert.equal(c.el('spot-mentor').hidden,false);
    assert.equal(c.el('spot-terminal').hidden,true);
    assert.equal(c.el('mini-target').style.display,'');
    c.run('player.x=spots.terminal.x;player.y=spots.terminal.y;updateMap()');
    assert.equal(c.el('spot-terminal').hidden,false);
    assert.equal(c.el('spot-mentor').hidden,false);
    assert.equal(c.el('spot-doc').hidden,true);
  });
  check("Rooms have no department signs and map captions follow the active office", () => {
    const c=boot();assert.equal(c.run("floors.every(f=>!f.labels)"),true);
    for(const [stage,floor,label] of [[1,0,'5층 구매팀'],[4,1,'2층 계약 체험실'],[3,0,'새봄테크 영업팀']]) {
      c.run(`state.stage=${stage};runtime.floor=${floor};render()`);
      assert.ok(c.el('location').textContent.includes(label));
    }
    assert.doesNotMatch(production,/0502|0503|0303|건설환경|조달개혁/);
  });
  check("Portal draft requires checking the request without a quantity answer hint", () => {
    const c=boot();c.run('state.stage=2;portalSignedIn=true;openPortal("draft")');
    assert.match(c.el('modal').innerHTML,/portal-quantity/);
    assert.doesNotMatch(c.el('modal').innerHTML,/요청서\s*:\s*20|<small>[^<]*20대/);
  });
  check("2F officer explains the price review and sees the rookie off before the elevator becomes the goal", () => {
    const c=boot();c.run('Object.assign(state,{started:true,stage:4,xp:400,awardBrief:true,openingChecked:true});runtime.floor=state.floor=1;officer()');
    assert.equal(c.run('talkState.role'),'officer');assert.ok(c.run('talkState.lines.length')>=3);
    c.finish();assert.equal(c.run('modalKind'),'contract');
    c.run('contractGood()');assert.equal(c.run('state.stage'),5);
    assert.equal(c.run('nextTarget()'),'officer');
    const resumed=boot(c.store.get('jodal-master-v1'));resumed.run('actions.continue()');
    assert.equal(resumed.run('nextTarget()'),'officer');
    c.run("actions['contract-farewell']()");
    assert.ok(c.run('talkState.lines.length')>=4);
    assert.match(c.run('talkState.lines.join(" ")'),/5층.*납품/);
    c.run('while(talkState && talkState.role!=="rookie"){revealLine();nextLine();}');
    assert.equal(c.run('talkState.role'),'rookie');
    assert.equal(c.run('state.contractFarewell'),false);assert.equal(c.run('nextTarget()'),'officer');
    c.finish();assert.equal(c.run('state.contractFarewell'),true);
    assert.equal(c.run('guideTarget(nextTarget())'),'elevator');
  });
  check("Quest completions award XP, clean bonuses, visible progress and level-up notices", () => {
    const c=boot();c.run('Object.assign(state,{started:true,brief:true,contact:true});actions["intake-good"]()');
    assert.equal(c.run('state.xp'),125);assert.equal(c.el('xp-bar').value,125);
    assert.match(c.el('modal').innerHTML,/수습 없이 완료 보너스 25 XP/);
    c.run('state.specAdvice=true;actions["spec-good"]()');
    assert.equal(c.run('state.xp'),250);assert.equal(c.el('level-badge').textContent,'Lv. 2');
    assert.equal(c.el('xp-bar').value,100);assert.match(c.el('modal').innerHTML,/레벨 업! Lv. 2/);
    assert.equal(JSON.parse(c.store.get('jodal-master-v1')).xp,250);
    c.run('actions["spec-good"]()');assert.equal(c.run('state.xp'),250);
    c.run('actions.new()');assert.equal(c.run('state.xp'),0);
  });
  check("Recovery removes only that quest's bonus, including after reload", () => {
    const c=boot();c.run('Object.assign(state,{started:true,brief:true,contact:true});beginRecovery("intake")');
    const d=boot(c.store.get('jodal-master-v1'));d.run('actions.continue();finishRecovery()');
    assert.equal(d.run('state.xp'),100);
    d.run('state.specAdvice=true;actions["spec-good"]()');assert.equal(d.run('state.xp'),225);
    const legacy=JSON.parse(c.store.get('jodal-master-v1'));delete legacy.xp;delete legacy.questMistakes;
    const e=boot(JSON.stringify(legacy));e.run('actions.continue();finishRecovery()');
    assert.equal(e.run('state.xp'),100);
  });
  check("Pre-change version-one saves retain progress and receive base XP for completed quests", () => {
    for(let stage=0;stage<=6;stage++) {
      const old=JSON.parse(b.run('JSON.stringify(fresh())'));Object.assign(old,{started:true,stage});
      delete old.xp;delete old.questMistakes;delete old.contractFarewell;
      const c=boot(JSON.stringify(old));assert.equal(c.run('loaded'),true);
      assert.equal(c.run('state.stage'),stage);assert.equal(c.run('state.xp'),stage*100);
      c.run('actions.continue()');assert.equal(c.el('level-badge').textContent,'Lv. '+(1+Math.floor(stage*100/150)));
    }
    const old=JSON.parse(b.run('JSON.stringify(fresh())'));old.started=true;
    for(const fields of [{xp:-1},{xp:'100'},{xp:Infinity},{questMistakes:1},{contractFarewell:'yes'}])
      assert.equal(boot(JSON.stringify({...old,...fields})).run('loaded'),false);
  });
  check("In-game notices keep the story clock and one accuracy note each in title help and ending", () => {
    assert.doesNotMatch(production.replace("체험을 위해 가상으로 설정되었습니다.", ""),/축약|가상|대기 시간은 줄|심사 세부 내용과 대기/);
    assert.doesNotMatch(html,/축약|가상/);
    assert.doesNotMatch(html,/실제 업무와 다를 수 있습니다/);
    const help = boot(); help.run("actions['title-help']()");
    assert.match(help.el("modal").innerHTML, /실제 업무와 다를 수 있습니다/);
    assert.match(help.el("modal").innerHTML, /Space.*클릭 또는 방향키로 이동/);
    const c=boot();for(let stage=0;stage<=6;stage++) {
      c.run(`state.stage=${stage};render()`);assert.match(c.el('scene-time').textContent,/^DAY \d{2} · \d{2}:\d{2}$/);
    }
    c.run('state.xp=750;result()');assert.match(c.el('modal').innerHTML,/최종 Lv. 6/);
    assert.equal((c.el('modal').innerHTML.match(/실제 업무와 다를 수 있습니다/g)||[]).length,1);
    assert.doesNotMatch(c.el('modal').innerHTML,/채용정보로 이동합니다|외부 사이트/);
    assert.match(c.el('modal').innerHTML,/더 많은 퀘스트를 깨고 싶다면/);
  });
  check("Production banks use the supplied rookie and supplier recordings", () => {
    assert.equal(b.run("voiceClips.has('supplier')"), true);
    assert.equal(b.run("voiceClips.has('mentor')"), false);
    assert.equal(b.run("voiceClips.has('rookie')"), true);
    assert.equal(b.run("voiceClips.get('rookie').buffer.duration"), 2.4);
    assert.equal(b.run("voiceClips.get('rookie').offsets.length"), 24);
    assert.notDeepEqual(b.run("voiceClips.get('rookie').buffer.getChannelData(0)"), b.run("voiceClips.get('supplier').buffer.getChannelData(0)"));
    assert.equal(b.run("voiceClips.get('supplier').buffer.duration"), 2.4);
    assert.equal(b.run("voiceClips.get('supplier').offsets.length"), 24);
  });
  check("Female dialogue plays decoded recording, not synthesized PCM", () => {
    b.run("playSyllable('안','supplier')");
    assert.equal(b.nodes.at(-1).buffer, b.run("voiceClips.get('supplier').buffer"));
    assert.ok(b.nodes.at(-1).playbackRate.value > 1);
  });
  check("Every grain is within recording duration and has voiced samples", () => {
    for (const role of ["rookie", "supplier"]) {
    const clip = b.run(`voiceClips.get('${role}')`);
    for (const offset of clip.offsets) {
      assert.ok(offset + 0.085 <= clip.buffer.duration);
      assert.ok(
        clip.buffer
          .getChannelData(0)
          .slice(offset * 24000, (offset + 0.085) * 24000)
          .some((x) => Math.abs(x) > 0.01),
      );
    }
    }
  });
  check("Sound settings no longer contain team voice upload or character picker", () => {
    b.run("soundSettings()");
    assert.match(b.el("modal").innerHTML, /욘 대리 목소리 듣기/);
    assert.match(b.el("modal").innerHTML, /조달달 목소리 듣기/);
    assert.match(b.el("modal").innerHTML, /실제 녹음된 목소리/);
    assert.doesNotMatch(
      production,
      /voice-file|voice-role|voice-clear|importVoice|팀원 목소리 불러오기/,
    );
  });
  check("A rookie dialogue line plays the owner's decoded voice bank", () => {
    b.run("speak('조달달',['안녕하세요'],()=>{},'rookie')");
    assert.equal(b.nodes.at(-1).buffer, b.run("voiceClips.get('rookie').buffer"));
    assert.equal(b.nodes.at(-1).args[2], 0.085);
    assert.equal(b.nodes.at(-1).playbackRate.value, 1.4 + ("안".codePointAt(0)%7)*0.045);
    b.finish();
  });
  const fallback = boot();
  fallback.window.AudioContext.prototype.decodeAudioData = () => Promise.reject(new Error("unsupported WAV"));
  fallback.run("unlockAudio()");
  await fallback.run("Promise.all([supplierVoiceReady,rookieVoiceReady])");
  check("Recording decode failure keeps rookie dialogue playable with fallback audio", () => {
    assert.equal(fallback.run("voiceClips.has('rookie')"), false);
    fallback.run("playSyllable('안','rookie')");
    assert.ok(fallback.nodes.at(-1).buffer.getChannelData(0).some(x => Math.abs(x) > 0.01));
  });
  const supplierBuffer = b.run("voiceClips.get('supplier').buffer");
  await b.run("loadVoiceBank('rookie',Uint8Array.from(atob(supplierVoiceData),c=>c.charCodeAt(0)).buffer,[0,0.1],0.06)");
  check("A second processed voice bank uses independent role and segment settings", () => {
    b.run("playSyllable('안','rookie')");
    assert.equal(b.nodes.at(-1).buffer, b.run("voiceClips.get('rookie').buffer"));
    assert.equal(b.nodes.at(-1).args[2], 0.06);
    assert.equal(b.run("voiceClips.get('supplier').buffer"), supplierBuffer);
  });
  const priorRookie = b.run("voiceClips.get('rookie')");
  for (const args of ["'rookie',[2.39],0.085", "'rookie',[],0.085", "'rookie',[0],0", "'mentor',[0],0.085"]) {
    // Separate role from the remaining literal arguments without changing array commas.
    const pos = args.indexOf(",");
    await assert.rejects(b.run(`loadVoiceBank(${args.slice(0,pos)},Uint8Array.from(atob(supplierVoiceData),c=>c.charCodeAt(0)).buffer,${args.slice(pos+1)})`));
  }
  check("Invalid voice segments cannot replace an existing valid recording", () => {
    assert.equal(b.run("voiceClips.get('rookie')"), priorRookie);
  });
  check("Dialogue, music and effects can be changed independently", () => {
    const toggle = (key, checked) => b.fire("change", { target: { dataset: { sound: key }, checked } });
    b.run("soundSettings();playSyllable('안');questFanfare()");
    const music = b.nodes.find(n => n.loop);
    assert.ok(music && !music.stopped);
    toggle("dialogue", false);
    const count = b.nodes.length;
    b.run("playSyllable('안')");
    assert.equal(b.nodes.length, count);
    assert.equal(b.run("activeVoices.size"), 0);
    assert.ok(!music.stopped);
    toggle("effects", false);
    b.run("chime();questFanfare()");
    assert.equal(b.nodes.length, count);
    toggle("dialogue", true);
    b.run("playSyllable('안')");
    assert.equal(b.nodes.length, count + 1);
    for (const value of [0, 47, 100]) {
      b.fire("input", { target: { id: "music-volume", value: String(value) } });
      assert.equal(b.el("music-level").textContent, value + "%");
      assert.equal(b.nodes.filter(n => n.loop).length, 1);
    }
    toggle("music", false);
    assert.ok(music.stopped);
    assert.equal(b.run("activeVoices.size"), 1);
    assert.deepEqual(JSON.parse(b.store.get("jodal-sound-v1")),
      { dialogue: true, music: false, effects: false, musicVolume: 100 });
    toggle("effects", true);
    toggle("music", true);
    assert.equal(b.nodes.filter(n => n.loop && !n.stopped).length, 1);
  });
  check("Default mentor voice has nonzero bounded samples", () => {
    b.run("playSyllable('안','mentor')");
    const data = b.nodes.at(-1).buffer.getChannelData(0);
    assert.ok(data.some((x) => Math.abs(x) > 0.01));
    assert.ok(data.every((x) => Number.isFinite(x) && Math.abs(x) <= 1));
  });
  check("Dialogue reveal stops ongoing syllables", () => {
    b.run("speak('욘 대리',['안녕하세요'],()=>{},'supplier');revealLine()");
    assert.equal(b.run("activeVoices.size"), 0);
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
  check("Touch movement holds until release and cancels without a stuck key", () => {
    const c = boot();
    c.run("actions.new()");
    c.finish();
    const control = { dataset: { move: "right" }, setPointerCapture() {} };
    const event = { target: { closest: () => control }, pointerId: 1, preventDefault() {} };
    c.fire("pointerdown", event);
    assert.equal(c.run("keys.has('arrowright')"), true);
    c.fire("pointerup", event);
    assert.equal(c.run("keys.size"), 0);
    c.fire("pointerdown", event);
    c.fire("pointercancel", event);
    assert.equal(c.run("keys.size"), 0);
    c.run("speak('김주문',['테스트'])");
    c.fire("pointerdown", event);
    assert.equal(c.run("keys.size"), 0);
  });
  check("Supplier scene cannot travel to another floor or expose an elevator", () => {
    const c = boot();
    c.run("state.stage=3;state.started=true;titleVisible=false;travelTo(1);updateMap()");
    assert.equal(c.run("floor"), 0);
    assert.equal(c.el("spot-elevator").hidden, true);
    assert.equal(c.el("spot-officer").hidden, true);
    assert.equal(c.run("spotActive('doc')"), true);
  });
  check("Invalid new save fields are rejected and valid six-stage saves load", () => {
    const valid = b.run("JSON.stringify(state)");
    for (const patch of [{ floor: 99 }, { openingChecked: "yes" }, { stage: 7 }]) {
      const c = boot(JSON.stringify({ ...JSON.parse(valid), ...patch }));
      assert.equal(c.run("loaded"), false);
      assert.equal(c.run("state.stage"), 0);
    }
    const c = boot(valid);
    assert.equal(c.run("state.stage"), 6);
  });
  check("All ten agency floors have a walkable lift and a distinct collectible cabinet card", () => {
    const c = boot();
    c.run("actions.new();stopTalk();state.brief=true");
    assert.equal(c.run("floorOrder.map(i=>floors[i].level).join(',')"), "B1F,1F,2F,3F,4F,5F,6F,7F,8F,9F");
    for (const index of c.run("floorOrder")) {
      c.run(`travelTo(${index});showFloorMap(${index});close()`);
      for (const id of ["cabinet", "elevator"]) assert.ok(c.run(`routeTo('${id}').length > 0`));
      c.run("go('cabinet');for(let i=0;i<500 && target;i++) frame(last+35)");
      assert.equal(c.run("modalKind"), "cabinet");
      assert.match(c.el("modal").innerHTML,/용어 카드를 발견/);
      c.run("close();interact()");
      assert.match(c.el("modal").innerHTML,/다시 펼친 용어 카드/);
      c.run("close()");
      const restored = boot(c.store.get("jodal-master-v1"));
      assert.equal(restored.run("floor"),index);
      assert.equal(restored.run("state.learnedTerms.length"),c.run("state.learnedTerms.length"));
    }
    assert.equal(c.run("state.learnedTerms.length"),10);
    assert.equal(c.run("state.stage"),0);
  });
  check("Individual explanations unlock once, persist mid-dialogue and reset for a new game", () => {
    const c = boot();
    c.run("actions.new();openGlossary()");
    assert.doesNotMatch(c.el("modal").innerHTML, /<summary>/);
    c.run("close();while(talkState.index<3){revealLine();nextLine()}");
    assert.equal(c.run("state.learnedTerms.length"), 0);
    c.run("revealLine();revealLine()");
    assert.equal(c.el("learned-terms").innerHTML, "<li>수요기관</li>");
    const loaded = boot(c.store.get("jodal-master-v1"));
    assert.equal(loaded.el("learned-terms").innerHTML, "<li>수요기관</li>");
    loaded.run("actions.new()");
    assert.equal(loaded.el("learned-terms").innerHTML, "");
    const old = JSON.parse(c.store.get("jodal-master-v1"));
    delete old.learnedTerms;
    old.stage = 4; old.xp = 400; old.awardBrief = false;
    const legacy = boot(JSON.stringify(old));
    legacy.run("openGlossary()");
    assert.equal((legacy.el("modal").innerHTML.match(/<summary>/g)||[]).length, 3);
    assert.doesNotMatch(legacy.el("learned-terms").innerHTML, /예정가격/);
  });
  check("Glossary cites the official procedure and completed ending reviews all six lessons", () => {
    b.run("result()");
    assert.equal((b.el("modal").innerHTML.match(/<li><strong>/g) || []).length, 6);
    assert.match(b.el("modal").innerHTML, /이번 업무|여섯 업무/);
    b.run("openGlossary()");
    assert.match(b.el("modal").innerHTML, /예정가격/);
    assert.match(b.el("modal").innerHTML, /key=00179/);
    assert.match(b.el("modal").innerHTML, /공식 업무처리절차/);
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
    c.run("travelTo(1);officer()");
    c.finish();
    c.run("openingGood();contractGood();actions.advance();travelTo(0);reportDeliveryIssue()");
    c.finish();
    c.run("inspectDelivery();finishPayment()");
    c.finish();
    assert.equal(c.run("state.stage"), 6);
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
