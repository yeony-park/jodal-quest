(() => {
  // src/data/initial-state.js
  var fresh = () => ({
    version: 1,
    started: false,
    stage: 0,
    brief: false,
    contact: false,
    specAdvice: false,
    noticeChecked: false,
    product: false,
    eligibility: false,
    mistakes: 0,
    history: []
  });

  // src/core/runtime.js
  var keys = /* @__PURE__ */ new Set();
  var player = { x: 464, y: 144 };
  var runtime = {
    state: fresh(),
    storageOK: true,
    loaded: false,
    modalOpen: false,
    lastFocus: null,
    modalKind: "",
    toastTimer: null,
    target: null,
    last: 0,
    walk: 0,
    audioCtx: null,
    master: null,
    muted: false,
    volume: 0.28,
    supplierVoiceReady: null,
    talkState: null,
    talkTimer: null,
    titleVisible: true,
    view: { width: 940, height: 560, dpr: 1, scale: 1, x: 0, y: 0 },
    portalSignedIn: false
  };

  // src/core/dom.js
  var $ = (id) => document.getElementById(id);

  // src/core/storage.js
  var KEY = "jodal-master-v1";
  function loadGame() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.version === 1 && Number.isInteger(s.stage) && s.stage >= 0 && s.stage <= 4 && [
        "started",
        "brief",
        "contact",
        "specAdvice",
        "noticeChecked",
        "product",
        "eligibility"
      ].every((k) => typeof s[k] === "boolean") && Number.isInteger(s.mistakes) && s.mistakes >= 0 && Array.isArray(s.history) && s.history.every((x) => typeof x === "string")) {
        runtime.state = s;
        runtime.loaded = s.started;
      }
    } catch (e) {
      runtime.storageOK = false;
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(runtime.state));
      runtime.storageOK = true;
      $("save-status").textContent = "✓ 자동 저장됨";
    } catch (e) {
      runtime.storageOK = false;
      $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
    }
  }

  // src/data/quests.js
  var quests = [
    {
      title: "요청서의 빈칸을 채워라",
      desc: "새봄도서관에서 모니터 구매를 요청했어요. 빠진 정보를 찾아 접수 준비를 마치세요.",
      memo: "요청서는 구매의 출발점. 필요한 물품과 수량, 예산, 납기를 함께 확인해요.",
      dialogue: "조달달 주무관, 첫 의뢰가 왔어요! 먼저 저에게 업무를 듣고, 요청서를 살펴볼까요?"
    },
    {
      title: "브랜드보다 필요한 성능",
      desc: "특정 제품만 살 수 있는 규격인가요? 사용 목적을 지키면서 경쟁 가능한 규격을 검토하세요.",
      memo: "규격은 “어느 회사 제품”보다 “무엇을 할 수 있는가”에 집중해요.",
      dialogue: "꼼꼼한 접수였어요. 이번엔 규격서에 적힌 브랜드 이름이 꼭 필요한지 함께 살펴봐요."
    },
    {
      title: "같은 정보를, 모두에게",
      desc: "요청서와 공고 초안을 대조하고 선배에게 검토를 요청하세요.",
      memo: "신입은 초안 작성과 확인을 담당해요. 공고는 권한 있는 담당자의 검토·결재를 거쳐요.",
      dialogue: "공고 수량이 요청서와 같은지 확인해요. 초안이 준비되면 제가 검토할게요."
    },
    {
      title: "이번에는 기업의 시선으로",
      desc: "이제 공급기업 담당자입니다. 공고와 제품을 확인하고 모의 입찰서를 제출하세요.",
      memo: "입찰서 제출은 낙찰이나 계약 체결이 아니에요. 이후 별도 심사와 절차가 이어져요.",
      dialogue: "이제 공급기업 담당자의 시선으로 볼까요? 공고에 맞는 제품인지, 참가 준비가 되었는지 확인하세요."
    },
    {
      title: "첫 번째 퀘스트 완료!",
      desc: "요청의 빈칸부터 기업의 입찰 참여까지. 작은 확인들이 공정한 기회를 만들었어요.",
      memo: "공공조달은 필요한 물품과 공급기업을 공정한 절차로 연결하는 일이에요.",
      dialogue: "잘했어요, 조달달 주무관! 혼자 확정하지 않고, 확인하고 협의한 것이 오늘의 가장 큰 성과예요."
    }
  ];

  // src/data/world.js
  var spots = {
    doc: { x: 464, y: 144 },
    mentor: { x: 528, y: 144 },
    phone: { x: 80, y: 400 },
    terminal: { x: 464, y: 400 },
    supplier: { x: 272, y: 240 }
  };
  var TILE = 32;
  var MAP_W = 18;
  var MAP_H = 14;
  var furnishings = [
    { type: "shelf", x: 1, y: 1, w: 3, h: 1 },
    { type: "desk", x: 2, y: 3, w: 2, h: 1 },
    { type: "desk", x: 7, y: 2, w: 2, h: 1 },
    { type: "shelf", x: 9, y: 1, w: 1, h: 2 },
    { type: "desk", x: 13, y: 2, w: 2, h: 1 },
    { type: "desk", x: 16, y: 2, w: 1, h: 1 },
    { type: "phone", x: 2, y: 11, w: 2, h: 1 },
    { type: "shelf", x: 1, y: 12, w: 1, h: 1 },
    { type: "table", x: 7, y: 11, w: 3, h: 1 },
    { type: "terminal", x: 13, y: 11, w: 3, h: 1 },
    { type: "plant", x: 17, y: 12, w: 1, h: 1 }
  ];

  // src/world/canvas.js
  var canvas = $("world");
  var ctx = canvas.getContext("2d");

  // src/world/render.js
  function project(x, y, z = 0) {
    return { x: 426 + (x - y) / TILE * 22, y: 102 + (x + y) / TILE * 11 - z };
  }
  function polygon(points, color, stroke) {
    ctx.beginPath();
    points.forEach(
      (p, i) => i ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y))
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function tile(x, y, color) {
    polygon(
      [
        project(x * TILE, y * TILE),
        project((x + 1) * TILE, y * TILE),
        project((x + 1) * TILE, (y + 1) * TILE),
        project(x * TILE, (y + 1) * TILE)
      ],
      color,
      "#82938b33"
    );
  }
  function box(x, y, w, h, z, top = "#c5cbbd", left = "#899e91", right = "#72877e") {
    const a = project(x * TILE, y * TILE), b = project((x + w) * TILE, y * TILE), c = project((x + w) * TILE, (y + h) * TILE), d = project(x * TILE, (y + h) * TILE), up = (p) => ({ x: p.x, y: p.y - z });
    polygon([d, c, up(c), up(d)], left);
    polygon([b, c, up(c), up(b)], right);
    polygon([up(a), up(b), up(c), up(d)], top);
  }
  function drawFurniture(o) {
    if (o.type === "shelf") {
      box(o.x, o.y, o.w, o.h, 41, "#b6c4b8", "#758e86", "#536e69");
      const p2 = project((o.x + 0.1) * TILE, (o.y + o.h) * TILE, 26);
      for (let i = 0; i < Math.round(o.w * 5); i++) {
        ctx.fillStyle = ["#c58a69", "#e0c378", "#759aaf", "#9caf81"][i % 4];
        ctx.fillRect(Math.round(p2.x + i * 5), Math.round(p2.y + i * 2.5), 3, 10);
      }
      return;
    }
    if (o.type === "plant") {
      box(o.x + 0.15, o.y + 0.15, 0.65, 0.65, 13, "#d2a876", "#96704b", "#73563f");
      const p2 = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 30);
      ctx.fillStyle = "#4e7c53";
      ctx.fillRect(p2.x - 8, p2.y - 8, 16, 20);
      ctx.fillStyle = "#7a9e64";
      ctx.fillRect(p2.x - 12, p2.y - 2, 24, 8);
      return;
    }
    box(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.h - 0.16, 19, "#dfc695", "#ad8c68", "#92724e");
    if (o.type === "table") return;
    const p = project((o.x + 0.5) * TILE, (o.y + 0.5) * TILE, 21);
    if (o.type === "phone") {
      ctx.fillStyle = "#2f5356";
      ctx.fillRect(p.x - 9, p.y - 8, 18, 9);
      ctx.fillRect(p.x - 12, p.y - 12, 24, 5);
      return;
    }
    ctx.fillStyle = "#263e4d";
    ctx.fillRect(p.x - 12, p.y - 22, 24, 19);
    ctx.fillStyle = "#87c4c3";
    ctx.fillRect(p.x - 9, p.y - 19, 18, 12);
    ctx.fillStyle = "#d0f1da";
    ctx.fillRect(p.x - 7, p.y - 17, 12, 2);
    ctx.fillRect(p.x - 7, p.y - 12, 8, 2);
    ctx.fillStyle = "#51676c";
    ctx.fillRect(p.x - 2, p.y - 3, 4, 5);
    ctx.fillRect(p.x - 8, p.y + 1, 16, 3);
    if (o.w > 1) {
      const q = project((o.x + 1.45) * TILE, (o.y + 0.6) * TILE, 21);
      ctx.fillStyle = "#fff1c8";
      ctx.fillRect(q.x - 8, q.y - 8, 16, 10);
      ctx.fillStyle = "#b1ad8a";
      ctx.fillRect(q.x - 5, q.y - 5, 10, 2);
    }
  }
  function roomLabel(label, x, y) {
    const p = project(x * TILE, y * TILE);
    ctx.fillStyle = "#f7f4ddd9";
    ctx.fillRect(Math.round(p.x - 43), Math.round(p.y - 10), 86, 17);
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#527060";
    ctx.fillText(label, Math.round(p.x), Math.round(p.y + 2));
  }
  function draw(t, moving) {
    camera();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#738e84";
    ctx.fillRect(0, 0, 940, 620);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = i % 2 ? "#78958a" : "#6c877e";
      ctx.fillRect(i * 137 % 940, i * 83 % 620, 2, 2);
    }
    polygon(
      [
        project(0, 0),
        project(MAP_W * TILE, 0),
        project(MAP_W * TILE, MAP_H * TILE),
        project(0, MAP_H * TILE)
      ].map((p2) => ({ x: p2.x, y: p2.y + 8 })),
      "#385a54"
    );
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const corridor = y >= 6 && y <= 8 || x === 5 || x === 11;
        tile(
          x,
          y,
          corridor ? (x + y) % 2 ? "#b8c6bb" : "#c0cec2" : (x + y) % 2 ? "#d6d9c7" : "#dcdccc"
        );
      }
    box(0, 0, 18, 0.12, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
    box(0, 0, 0.12, 14, 37, "#e0e5d0", "#b6c2b2", "#9cae9f");
    for (const x of [5, 11]) {
      box(x, 0, 0.18, 5, 28, "#e0dfca", "#b8bdab", "#96aa9a");
      box(x, 10, 0.18, 4, 18, "#dedfc8", "#aebca8", "#91a48f");
    }
    for (const y of [5, 9]) {
      for (let x = 0; x < 18; x++)
        if (![2, 8, 14].includes(x))
          box(x, y, 1, 0.13, y === 5 ? 17 : 10, "#dce1cd", "#a3b5a7", "#93a994");
    }
    roomLabel("0505 공사원가", 2.5, 1);
    roomLabel("0506 보건의료", 8.5, 1);
    roomLabel("0507 전기전자", 14.5, 1);
    roomLabel("0504 구매총괄", 2.5, 13);
    roomLabel("0503 조달개혁", 8.5, 13);
    roomLabel("0502 건설환경", 14.5, 13);
    const objects = furnishings.map((o) => ({
      depth: (o.x + o.y + o.w + o.h) * TILE,
      draw: () => drawFurniture(o)
    }));
    if (runtime.state.stage !== 3) {
      objects.push({
        depth: spots.mentor.x + spots.mentor.y,
        draw: () => pixelPerson(spots.mentor.x, spots.mentor.y - 12, "mentor")
      });
      objects.push({
        depth: spots.supplier.x + spots.supplier.y,
        draw: () => pixelPerson(spots.supplier.x, spots.supplier.y, "supplier")
      });
    }
    objects.push({
      depth: player.x + player.y,
      draw: () => pixelPerson(player.x, player.y, runtime.state.stage === 3 ? "supplier" : "rookie", moving)
    });
    objects.sort((a, b) => a.depth - b.depth).forEach((o) => o.draw());
    const dest = spots[nextTarget()];
    if (dest && !runtime.modalOpen && !runtime.talkState) {
      const p2 = project(dest.x, dest.y);
      ctx.strokeStyle = "#ffe58a";
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(p2.x - 15), Math.round(p2.y - 7), 30, 11);
    }
    const p = project(player.x, player.y);
    ctx.fillStyle = "#fff4d7";
    ctx.fillRect(Math.round(p.x - 28), Math.round(p.y + 7), 56, 15);
    ctx.fillStyle = "#3e6359";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      runtime.state.stage === 3 ? "욘 대리" : "조달달",
      Math.round(p.x),
      Math.round(p.y + 18)
    );
  }
  function resizeWorld() {
    runtime.view.width = window.innerWidth;
    runtime.view.height = window.innerHeight;
    runtime.view.dpr = 0.65;
    canvas.width = Math.ceil(runtime.view.width * runtime.view.dpr);
    canvas.height = Math.ceil(runtime.view.height * runtime.view.dpr);
  }
  function camera() {
    runtime.view.scale = Math.max(runtime.view.width / 940, runtime.view.height / 620);
    const w = runtime.view.width / runtime.view.scale, h = runtime.view.height / runtime.view.scale, p = project(player.x, player.y);
    runtime.view.x = Math.max(0, Math.min(940 - w, (runtime.titleVisible ? 470 : p.x) - w / 2));
    runtime.view.y = Math.max(0, Math.min(620 - h, (runtime.titleVisible ? 310 : p.y) - h * 0.55));
    ctx.setTransform(
      runtime.view.dpr * runtime.view.scale,
      0,
      0,
      runtime.view.dpr * runtime.view.scale,
      -runtime.view.x * runtime.view.dpr * runtime.view.scale,
      -runtime.view.y * runtime.view.dpr * runtime.view.scale
    );
  }
  function updateMap() {
    for (const [id, s] of Object.entries(spots)) {
      const el = $("spot-" + id), p = project(s.x, s.y, id === "doc" ? 88 : 65);
      if (id === "mentor") {
        p.x += 60;
        p.y += 7;
      }
      el.style.left = (p.x - runtime.view.x) * runtime.view.scale + "px";
      el.style.top = (p.y - runtime.view.y) * runtime.view.scale + "px";
    }
    $("mini-player").setAttribute("cx", 10 + player.x / (MAP_W * TILE) * 168);
    $("mini-player").setAttribute("cy", 8 + player.y / (MAP_H * TILE) * 96);
    const next = spots[nextTarget()];
    $("mini-target").style.display = next ? "" : "none";
    if (next) {
      $("mini-target").setAttribute("cx", 10 + next.x / (MAP_W * TILE) * 168);
      $("mini-target").setAttribute("cy", 8 + next.y / (MAP_H * TILE) * 96);
    }
  }

  // src/world/characters.js
  var spriteRows = [
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHSSSSSSHH...",
    "...HSSSSSSSSH...",
    "...HSSSSSSSSH...",
    "...HSSXSSXSSH...",
    "....SSSSSSSS....",
    "....SSSMMSSS....",
    ".....SSSSSS.....",
    "......SSSS......",
    "....JJWWWWJJ....",
    "...JJJWWWWJJJ...",
    "...JJJJAAJJJJ...",
    "..SSJJJAAJJJSS..",
    "..SSJJJJJJJJSS..",
    "..SSJJJJJJJJSS..",
    "....JJJJJJJJ....",
    "....PPPPPPPP....",
    ".....PPP.PPP....",
    ".....PPP.PPP....",
    ".....XXX.XXX....",
    "....XXXX.XXXX..."
  ];
  function pixelPalette(kind) {
    return {
      H: kind === "supplier" ? "#49384d" : kind === "mentor" ? "#605049" : "#243a43",
      S: "#efba8d",
      X: "#26373d",
      M: "#a76557",
      J: kind === "supplier" ? "#956ba5" : kind === "mentor" ? "#c29458" : "#3b7c91",
      W: "#f9edcf",
      A: kind === "supplier" ? "#f0cb7a" : "#bd6e4b",
      P: kind === "supplier" ? "#654b73" : "#3a4e54"
    };
  }
  function spriteCells(kind) {
    const cells = [];
    spriteRows.forEach(
      (row, y) => [...row].forEach((c, x) => {
        if (c !== ".") cells.push([x, y, c]);
      })
    );
    if (kind === "supplier") {
      for (let y = 6; y < 15; y++) for (const x of [2, 3, 12, 13]) cells.push([x, y, "H"]);
      cells.push([12, 5, "A"], [13, 5, "A"], [12, 6, "A"]);
    }
    if (kind === "mentor")
      for (const [x, y] of [
        [4, 6],
        [5, 6],
        [6, 6],
        [8, 6],
        [9, 6],
        [10, 6],
        [4, 8],
        [5, 8],
        [6, 8],
        [8, 8],
        [9, 8],
        [10, 8],
        [3, 7],
        [7, 7],
        [11, 7]
      ])
        cells.push([x, y, "H"]);
    return cells;
  }
  function face(kind = "rookie") {
    const palette = pixelPalette(kind);
    return (
      /* HTML */
      `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 28"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    ${spriteCells(kind).map(
        ([x, y, c]) => (
          /* HTML */
          `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="${palette[c]}" />`
        )
      ).join("")}
  </svg>`
    );
  }
  function pixelPerson(x, y, kind, moving = false) {
    const p = project(x, y), s = 2, bob = moving ? Math.round(Math.sin(runtime.walk) * 1) : 0;
    ctx.fillStyle = "#263e4d30";
    ctx.fillRect(Math.round(p.x - 13), Math.round(p.y - 3), 26, 6);
    const palette = pixelPalette(kind);
    for (const [cx, cy, c] of spriteCells(kind)) {
      let step = cy > 19 && moving ? Math.round(Math.sin(runtime.walk) * (cx < 8 ? 1 : -1)) : 0;
      ctx.fillStyle = palette[c];
      ctx.fillRect(Math.round(p.x - 16 + cx * s), Math.round(p.y - 48 + cy * s + bob + step), s, s);
    }
  }

  // src/components/dialogue.js
  function stopTalk() {
    clearTimeout(runtime.talkTimer);
    runtime.talkTimer = null;
    runtime.talkState = null;
    $("speech").hidden = true;
    document.body.classList.remove("talking");
    stopSounds();
  }
  function speak(name, lines, onDone = () => {
  }, role = "mentor") {
    close();
    stopTalk();
    keys.clear();
    runtime.target = null;
    setNotebook(false);
    runtime.talkState = { name, lines, onDone, role, index: 0, revealed: 0 };
    $("speech").hidden = false;
    document.body.classList.add("talking");
    $("speech-name").textContent = name;
    $("speech-portrait").innerHTML = face(role === "contact" ? "supplier" : role);
    $("speech").focus();
    typeLine();
  }
  function typeLine() {
    if (!runtime.talkState) return;
    clearTimeout(runtime.talkTimer);
    const t = runtime.talkState, text = t.lines[t.index];
    t.revealed = 0;
    $("speech-text").textContent = "";
    $("speech-count").textContent = `${t.index + 1} / ${t.lines.length}`;
    $("speech-hint").textContent = "문장 모두 보기";
    function tick() {
      if (runtime.talkState !== t) return;
      t.revealed++;
      $("speech-text").textContent = text.slice(0, t.revealed);
      if (t.revealed % 2 === 1) playSyllable(text[t.revealed - 1], t.role);
      if (t.revealed < text.length)
        runtime.talkTimer = setTimeout(tick, /[,!?。.]$/.test(text.slice(0, t.revealed)) ? 160 : 42);
      else {
        $("speech-hint").textContent = t.index === t.lines.length - 1 ? "대화 마치기" : "다음 이야기";
        runtime.talkTimer = null;
      }
    }
    tick();
  }
  function revealLine() {
    if (!runtime.talkState) return;
    clearTimeout(runtime.talkTimer);
    runtime.talkTimer = null;
    stopSounds();
    runtime.talkState.revealed = runtime.talkState.lines[runtime.talkState.index].length;
    $("speech-text").textContent = runtime.talkState.lines[runtime.talkState.index];
    $("speech-hint").textContent = runtime.talkState.index === runtime.talkState.lines.length - 1 ? "대화 마치기" : "다음 이야기";
  }
  function nextLine() {
    if (!runtime.talkState) return;
    if (runtime.talkState.revealed < runtime.talkState.lines[runtime.talkState.index].length) {
      revealLine();
      return;
    }
    runtime.talkState.index++;
    if (runtime.talkState.index < runtime.talkState.lines.length) {
      stopSounds();
      typeLine();
    } else {
      const done = runtime.talkState.onDone;
      stopTalk();
      done();
      if (!runtime.modalOpen) canvas.focus({ preventScroll: true });
    }
  }

  // src/components/ending.js
  var MORE_QUESTS = "https://www.pps.go.kr/kor/bbs/list.do?key=00645";
  function ending() {
    player.x = 14.5 * TILE;
    player.y = 4.5 * TILE;
    speak(
      "조달달",
      [
        "빈칸을 확인하고, 공정한 기준을 세우고, 함께 검토하니 기업의 참여까지 이어졌어. 혼자 서두르는 것보다 중요한 게 있었구나!",
        "이제 나도... 조달의 왕이야!"
      ],
      result,
      "rookie"
    );
  }
  function result() {
    const score = Math.max(60, 100 - runtime.state.mistakes * 5);
    show(
      "이제 나도... 조달의 왕이야!",
      /* HTML */
      `<div class="level-up-tag">LEVEL UP!</div>
      <div class="level-up-hero">
        ${face("rookie")}<strong>Lv. 1 <span>〉</span> Lv. 2</strong>
      </div>
      <div class="level-progress"><i></i></div>
      <p class="center">첫 의뢰 완료 · 조달의 왕을 향한 첫걸음</p>
      <div class="stats">
        <div class="stat"><strong>4 / 4</strong><small>퀘스트</small></div>
        <div class="stat"><strong>5 / 5</strong><small>획득한 물건</small></div>
        <div class="stat"><strong>${score}</strong><small>학습 점수</small></div>
      </div>
      <div class="success">모의 입찰서 접수 완료. 낙찰·계약 체결은 아직 진행하지 않았습니다.</div>
      <a class="ending-link" href="${MORE_QUESTS}" target="_blank" rel="noopener noreferrer"
        >더 많은 퀘스트를 깨고 싶다면?</a
      >
      <p class="ending-destination">조달청 채용정보로 이동합니다 · 외부 사이트</p>
      ${buttons([
        ["close", "사무실로 돌아가기"],
        ["restart", "다시 플레이", true]
      ])}`,
      "result"
    );
  }

  // src/components/title.js
  function intro() {
    runtime.titleVisible = true;
    $("title-screen").hidden = false;
    $("continue-button").hidden = !runtime.loaded;
    $("title-chars").innerHTML = face() + face("mentor");
    document.body.classList.add("title-mode");
    $("game-shell").inert = true;
  }
  function startGame(isNew) {
    unlockAudio();
    stopTalk();
    close();
    if (isNew) {
      runtime.state = fresh();
      runtime.state.started = true;
      runtime.loaded = true;
      player.x = 464;
      player.y = 144;
      runtime.portalSignedIn = false;
      save();
    }
    runtime.titleVisible = false;
    $("title-screen").hidden = true;
    document.body.classList.remove("title-mode");
    $("game-shell").inert = false;
    setNotebook(false);
    render();
    if (runtime.state.stage === 0 && !runtime.state.brief) tutorial();
    else if (runtime.state.stage === 4) result();
  }

  // src/world/navigation.js
  function cellBlocked(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
    if ((x === 5 || x === 11) && (y < 6 || y > 8)) return true;
    if ((y === 5 || y === 9) && ![2, 8, 14].includes(x)) return true;
    return furnishings.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  }
  function canWalk(x, y) {
    return !cellBlocked(Math.floor(x / TILE), Math.floor(y / TILE));
  }
  function routeTo(id) {
    const goal = spots[id], sx = Math.floor(player.x / TILE), sy = Math.floor(player.y / TILE), gx = Math.floor(goal.x / TILE), gy = Math.floor(goal.y / TILE), queue = [[sx, sy]], seen = /* @__PURE__ */ new Map([[sx + "," + sy, null]]);
    let reached = false;
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (x === gx && y === gy) {
        reached = true;
        break;
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nx = x + dx, ny = y + dy, key = nx + "," + ny;
        if (!cellBlocked(nx, ny) && !seen.has(key)) {
          seen.set(key, [x, y]);
          queue.push([nx, ny]);
        }
      }
    }
    if (!reached) return [];
    const path = [];
    let cell = [gx, gy];
    while (cell) {
      path.unshift({ x: (cell[0] + 0.5) * TILE, y: (cell[1] + 0.5) * TILE });
      cell = seen.get(cell.join(","));
    }
    return path;
  }
  function go(id) {
    if (id === "result") {
      result();
      return;
    }
    if (!runtime.state.started || runtime.titleVisible || runtime.talkState) return;
    close();
    setNotebook(false);
    keys.clear();
    const path = routeTo(id);
    if (!path.length) {
      toast("복도를 따라 가까이 이동해 주세요.");
      return;
    }
    runtime.target = { id, path, index: 0 };
  }
  function stepPlayer(dx, dy) {
    if (canWalk(player.x + dx, player.y)) player.x += dx;
    if (canWalk(player.x, player.y + dy)) player.y += dy;
  }
  function interact() {
    let closest = null, distance = Infinity;
    for (const [id, p] of Object.entries(spots)) {
      if (runtime.state.stage === 3 && ["mentor", "phone", "supplier"].includes(id)) continue;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < distance) {
        distance = d;
        closest = id;
      }
    }
    if (distance < 55) actions[closest]();
    else toast("사람이나 모니터 가까이 다가가 주세요.");
  }
  function frame(t) {
    const dt = Math.min((t - runtime.last) / 1e3, 0.035) || 0;
    runtime.last = t;
    let moving = false;
    if (!runtime.modalOpen && !runtime.talkState && !runtime.titleVisible && runtime.state.started) {
      if (runtime.target) {
        const dest = runtime.target.path[runtime.target.index], dx = dest.x - player.x, dy = dest.y - player.y, d = Math.hypot(dx, dy), step = 145 * dt;
        if (d < step + 1) {
          player.x = dest.x;
          player.y = dest.y;
          runtime.target.index++;
          if (runtime.target.index === runtime.target.path.length) {
            const id = runtime.target.id;
            runtime.target = null;
            actions[id]();
          }
        } else {
          player.x += dx / d * step;
          player.y += dy / d * step;
          moving = true;
        }
      } else {
        let sx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft")), sy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
        if (sx || sy) {
          let dx = sx + sy, dy = sy - sx, n = Math.hypot(dx, dy);
          stepPlayer(dx / n * 105 * dt, dy / n * 105 * dt);
          moving = true;
        }
      }
    }
    if (moving) runtime.walk += dt * 12;
    draw(t, moving);
    updateMap();
    requestAnimationFrame(frame);
  }

  // src/components/portal.js
  function portalShell(content, page) {
    const supplier = runtime.state.stage === 3;
    return (
      /* HTML */
      `<div class="monitor-chrome">
      <span>▣ 업무용 모니터</span><span>나라장터 체험</span
      ><button data-action="close" aria-label="모니터 닫고 사무실로">×</button>
    </div>
    <div class="training-ribbon">게임 속 모의 나라장터 · 실제 서비스와 연결되지 않습니다</div>
    <div class="g2b-top">
      <span>나라장터　 종합쇼핑몰　 조달데이터허브　 누리장터</span
      ><button data-action="portal-login">
        ${runtime.portalSignedIn ? supplier ? "욘 대리" : "조달달 주무관" : "로그인"}</button
      ><button data-action="portal-guide">인증센터</button>
    </div>
    <div class="g2b-brand">
      <div class="g2b-logo">
        <i></i>
        <div>나라장터<small>국가종합전자조달 · 체험</small></div>
      </div>
      <div class="g2b-search">
        <input
          id="portal-search"
          aria-label="공고명 검색"
          placeholder="공고명 검색"
          value="모니터"
        /><button data-action="portal-search" aria-label="검색">⌕</button>
      </div>
    </div>
    <nav class="g2b-nav" aria-label="모의 나라장터 메뉴">
      <button data-action="portal-work">발주</button><button data-action="portal-list">입찰</button
      ><button data-action="portal-guide">공통</button
      ><button data-action="portal-guide">이용자관리</button
      ><button data-action="portal-home">홈</button>
    </nav>
    <div class="g2b-content">${content}</div>
    <footer class="g2b-footer">
      ${supplier ? "기업 입찰 참여" : "조달청 공고 초안 준비"} 체험 · 가상 구매 1건 ·
      ${page === "home" ? "팝업 없는 시작 화면" : "세부 서류와 인증 절차는 축약했습니다."}
    </footer>`
    );
  }
  function openPortal(page = "home", query = "모니터") {
    let content = "";
    if (page === "home")
      content = /* HTML */
      `<div class="g2b-hero">
        나라장터에서 전하는 다양한<br /><strong>입찰정보</strong>와 <em>소식</em>을 만나보세요
      </div>
      <div class="g2b-grid">
        <section class="g2b-card starter">
          <h3>나라장터 시작하기</h3>
          <p>오늘의 한 건을 차근차근 준비해 보세요.</p>
          <button class="g2b-primary" data-action="portal-login">
            ${runtime.portalSignedIn ? "나의 업무" : "체험 로그인"}
          </button>
          <div class="g2b-small-buttons">
            <button data-action="portal-guide">이용자등록</button
            ><button data-action="portal-guide">이용 안내</button>
          </div>
          <div class="g2b-guide-note">오늘의 의뢰<br /><b>새봄도서관 모니터 20대</b></div>
        </section>
        <section class="g2b-card">
          <h3>나라장터 공지사항</h3>
          <p class="g2b-news">[안내] 공정한 입찰의 첫걸음</p>
          <p class="g2b-news">[안내] 규격과 납기를 확인하세요</p>
          <p class="g2b-news">[안내] 제출 전 정보를 한 번 더 확인</p>
          <button
            class="g2b-notice-link"
            data-action="${runtime.state.stage === 2 ? "portal-work" : "portal-list"}"
          >
            ${runtime.state.stage === 2 ? "작성 중인 공고 초안 확인" : "새봄도서관 모니터 구매 공고"}
          </button>
        </section>
        <section class="g2b-card">
          <h3>기관별 공지사항</h3>
          <p>새봄지방조달청</p>
          <p class="g2b-news">모두에게 같은 정보를 공개합니다.</p>
          <div class="g2b-support">
            <b>처음이어도 괜찮아요.</b><span>김주문의 업무 노트와<br />함께 진행해 보세요.</span
            ><button data-action="portal-guide">체험 이용 안내</button>
          </div>
        </section>
      </div>`;
    else if (page === "login")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 체험 로그인</div>
      <h3>체험 계정으로 시작</h3>
      <div class="g2b-login-card">
        <div class="large-avatar">${face(runtime.state.stage === 3 ? "supplier" : "rookie")}</div>
        <h4>
          ${runtime.state.stage === 3 ? "욘 대리 · 새봄테크" : "조달달 주무관 · 새봄지방조달청"}
        </h4>
        <p>
          실제 아이디·비밀번호·인증서는 입력하지 않습니다.<br />미리 준비된 가상 계정으로
          진행합니다.
        </p>
        <button class="g2b-primary" data-action="portal-signin">가상 계정으로 로그인</button>
      </div>`;
    else if (page === "draft")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 발주 / 공고 초안</div>
      <h3>물품 구매 공고 초안</h3>
      <div class="g2b-form">
        <div><label>공고명</label><span>새봄도서관 모니터 구매</span></div>
        <div><label>계약 구분</label><span>물품구매 총액계약</span></div>
        <div>
          <label for="portal-quantity">구매 수량</label
          ><input
            id="portal-quantity"
            type="number"
            min="1"
            max="100"
            value="${runtime.state.noticeChecked ? 20 : 2}"
          /><small>요청서: 20대</small>
        </div>
        <div><label>물품 규격</label><span>24형 이상 / FHD 이상 / HDMI</span></div>
        <div><label>납품기한</label><span>계약일로부터 30일 이내</span></div>
      </div>
      <p id="portal-error" role="status">
        ${runtime.state.noticeChecked ? "검토본 저장 완료. 아직 공고 전입니다." : "요청서와 공고 초안의 수량을 대조하세요."}
      </p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="portal-save-draft">검토본 저장</button
        ><button data-action="close">사무실로 돌아가기</button>
      </div>`;
    else if (page === "list") {
      const matches = ["", "모니터", "새봄", "도서관", "새봄도서관 모니터 구매"].some(
        (term) => query.trim() === term
      ) || "새봄도서관 모니터 구매".includes(query.trim());
      const exists = runtime.state.stage >= 3 && matches;
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰공고목록</div>
      <h3>입찰공고목록</h3>
      <div class="g2b-filter">업무 구분 <b>물품</b>　공고명 <b id="portal-query-label"></b></div>
      <div class="g2b-results">검색 결과 ${exists ? "1" : "0"}건</div>
      <div class="g2b-table">
        <div class="g2b-table-head">
          <span>업무</span><span>공고명</span><span>수요기관</span><span>진행</span>
        </div>
        ${exists ? '<button class="g2b-table-row" data-action="portal-detail"><span>물품</span><strong>새봄도서관 모니터 구매</strong><span>새봄도서관</span><span>입찰 중</span></button>' : '<p class="g2b-empty">' + (runtime.state.stage < 3 ? "아직 공고가 게시되지 않았습니다. 검토와 결재를 먼저 마치세요." : "일치하는 공고가 없습니다. “모니터”로 검색해 보세요.") + "</p>"}
      </div>`;
    } else if (page === "detail")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 공고 상세</div>
      <h3>새봄도서관 모니터 구매</h3>
      <div class="g2b-form">
        <div><label>공고 상태</label><span>담당자 검토·결재 후 게시 완료</span></div>
        <div><label>수량 및 규격</label><span>20대 / 24형 이상 · FHD 이상 · HDMI</span></div>
        <div><label>납품기한</label><span>계약일로부터 30일 이내</span></div>
        <div>
          <label>선택 제품</label
          ><span
            >${runtime.state.product ? "새봄 M24 · 적합" : "제품 자료에서 적합 제품 선택 필요"}</span
          >
        </div>
      </div>
      <p>공고 조건과 참가 요건을 확인한 후 입찰서를 작성합니다.</p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="portal-bid">입찰서 작성</button
        ><button data-action="portal-list">목록</button>
      </div>`;
    else if (page === "bid")
      content = /* HTML */
      `<div class="g2b-breadcrumb">홈 / 입찰 / 입찰서 작성</div>
      <h3>모의 입찰서 작성</h3>
      <div class="g2b-form">
        <div><label>업체 / 담당자</label><span>새봄테크 / 욘 대리</span></div>
        <div>
          <label>구매 물품</label
          ><span>모니터 20대 / ${runtime.state.product ? "새봄 M24" : "적합 제품 미선택"}</span>
        </div>
        <div><label>입찰총액</label><span>18,400,000원 (부가세 포함·가상 금액)</span></div>
      </div>
      <label class="checkline"
        ><input id="eligible" type="checkbox" ${runtime.state.eligibility ? "checked" : ""} />공고의
        참가자격과 제출서류를 확인했습니다. 가상 기업은 등록·요건을 갖춘 것으로 설정합니다.</label
      >
      <p class="g2b-caution">
        모의 제출이며 실제 입찰로 전송되지 않습니다. 접수는 낙찰·계약 체결을 뜻하지 않습니다.
      </p>
      <div class="g2b-actions">
        <button class="g2b-primary" data-action="submit-bid">모의 입찰서 제출</button
        ><button data-action="portal-detail">공고 다시 보기</button>
      </div>`;
    else
      content = /* HTML */
      `<h3>나라장터 체험 이용 안내</h3>
      <p>
        이번 체험은 한 건만 다룹니다. 공무원은 공고 초안을 준비하고 선배에게 검토를 요청합니다. 기업
        담당자는 게시된 공고를 검색하고 입찰서를 제출합니다.
      </p>
      <p>실제 이용자등록, 인증서, 보증과 세부 서류는 생략했습니다.</p>
      <button class="g2b-primary" data-action="portal-home">나라장터 첫 화면</button>`;
    show("모의 나라장터", portalShell(content, page), "portal");
    if (page === "list") $("portal-query-label").textContent = query || "전체";
  }
  function terminal() {
    openPortal("home");
  }
  function portalWork() {
    if (runtime.state.stage < 2) {
      toast("요청서 접수와 규격 검토를 먼저 마치세요.");
      return;
    }
    if (runtime.state.stage === 2) {
      if (!runtime.portalSignedIn) {
        openPortal("login");
        return;
      }
      openPortal("draft");
    } else openPortal("list");
  }
  function portalDetail() {
    if (runtime.state.stage < 3) {
      toast("공고 게시 전입니다.");
      return;
    }
    openPortal("detail");
  }
  function portalBid() {
    if (runtime.state.stage !== 3) {
      toast("기업 입찰 참여 단계에서 작성할 수 있어요.");
      return;
    }
    if (!runtime.portalSignedIn) {
      openPortal("login");
      return;
    }
    if (!runtime.state.product) {
      toast("사무실의 제품 자료에서 적합한 제품을 먼저 선택하세요.");
      return;
    }
    openPortal("bid");
  }
  function savePortalDraft() {
    if (runtime.state.stage !== 2) return;
    if (Number($("portal-quantity").value) !== 20) {
      runtime.state.mistakes++;
      save();
      $("portal-error").textContent = "요청서는 20대입니다. 수량을 맞춘 뒤 검토본을 저장하세요.";
      return;
    }
    runtime.state.noticeChecked = true;
    save();
    render();
    openPortal("draft");
    toast("검토본 저장 완료. 모니터를 닫고 김주문에게 검토를 요청하세요.");
  }

  // src/components/inventory.js
  var inventoryItems = [
    {
      name: "사원증",
      description: "새봄지방조달청 신입 9급 주무관 조달달의 사원증. 김주문에게 첫 업무를 받은 증표입니다.",
      color: "#72a3ad"
    },
    {
      name: "요청서",
      description: "수요기관에 확인한 납기와 장소를 보완한 요청서. 모니터 20대, 계약일로부터 30일 이내입니다.",
      color: "#bd9f64"
    },
    {
      name: "규격서",
      description: "수요기관과 협의하고 선배가 검토한 성능 중심 규격서. 24형 이상, FHD 이상, HDMI 연결입니다.",
      color: "#789c72"
    },
    {
      name: "공고문",
      description: "담당자 검토·결재 후 게시된 모의 공고문. 수량은 요청서와 같은 20대입니다.",
      color: "#728dc3"
    },
    {
      name: "접수증",
      description: "새봄테크의 모의 입찰서가 접수되었습니다. 제출은 낙찰이나 계약 체결이 아닙니다.",
      color: "#b686b7"
    }
  ];
  function ownedItems() {
    return inventoryItems.map(
      (_, i) => i === 0 ? runtime.state.brief || runtime.state.stage > 0 : runtime.state.stage >= i
    );
  }
  function itemIcon(i) {
    const color = inventoryItems[i].color;
    return (
      /* HTML */
      `<svg viewBox="0 0 24 28" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M5 2H16V5H20V26H5Z" fill="#252c30" />
    <path d="M6 3H15V7H19V25H6Z" fill="#efe3ba" />
    <path d="M7 8H18V11H7Z" fill="${color}" />
    ${i === 0 ? '<path d="M9 13H15V19H9Z" fill="#609092"/><path d="M8 21H16V23H8Z" fill="#9b987c"/>' : '<path d="M8 14H17V16H8ZM8 18H16V20H8Z" fill="#a6a18b"/>'}${i === 4 ? '<path d="M14 20H20V25H14Z" fill="#b57aa0"/>' : ""}
  </svg>`
    );
  }
  function renderInventory() {
    const owned = ownedItems();
    $("inventory-slots").innerHTML = inventoryItems.map(
      (item, i) => (
        /* HTML */
        `<button
          class="inventory-slot ${owned[i] ? "owned" : ""}"
          data-action="item-${i}"
          aria-label="${i + 1}번 칸 · ${owned[i] ? item.name : "빈칸"}"
          title="${owned[i] ? item.name : "아직 얻지 못한 물건"}"
        >
          <span class="slot-number">${i + 1}</span
          >${owned[i] ? itemIcon(i) : '<span class="slot-empty">·</span>'}<span class="slot-name"
            >${owned[i] ? item.name : "빈칸"}</span
          >
        </button>`
      )
    ).join("");
    $("level-badge").textContent = runtime.state.stage === 4 ? "Lv. 2" : "Lv. 1";
  }
  function inspectItem(i) {
    if (!ownedItems()[i]) {
      toast("퀘스트를 마치면 물건이 이 칸에 들어와요.");
      return;
    }
    show(
      inventoryItems[i].name,
      /* HTML */
      `<div class="large-item">${itemIcon(i)}</div>
      <p>${inventoryItems[i].description}</p>
      ${buttons([["close", "가방 닫기"]])}`,
      "item"
    );
  }

  // src/game/actions.js
  var actions = {
    close,
    help,
    restart: () => show(
      "처음부터 다시 시작할까요?",
      /* HTML */
      `<p>저장된 진행 상황과 학습 점수가 초기화됩니다.</p>
        ${buttons([
        ["new", "새 게임 시작"],
        ["close", "취소", true]
      ])}`,
      "restart"
    ),
    new: () => startGame(true),
    continue: () => startGame(false),
    "start-new": () => {
      if (runtime.loaded) actions.restart();
      else startGame(true);
    },
    quests: () => setNotebook($("quest-panel").hidden),
    sound: soundSettings,
    "talk-next": nextLine,
    mute: () => {
      runtime.muted = !runtime.muted;
      stopSounds();
      updateVolume();
    },
    "voice-preview": previewVoice,
    guide: () => {
      setNotebook(false);
      go(nextTarget());
    },
    mentor,
    phone,
    doc: documentDesk,
    terminal,
    approve: () => {
      if (runtime.state.stage === 2 && runtime.state.noticeChecked)
        complete(
          "검토·결재 후 공고 게시",
          "선배의 검토와 권한 있는 담당자의 결재를 거쳐 모의 공고가 게시됐습니다."
        );
    },
    advance: () => {
      close();
      player.x = 464;
      player.y = 144;
      runtime.portalSignedIn = false;
      if (runtime.state.stage === 3)
        speak(
          "욘 대리",
          [
            "공고가 게시됐군요! 이제 새봄테크 사무실의 욘 대리로 플레이합니다.",
            "제품 자료를 비교한 뒤 업무용 모니터에서 공고를 검색하고 모의 입찰서를 준비해 볼게요."
          ],
          () => {
          },
          "supplier"
        );
    },
    "intake-good": () => {
      if (runtime.state.stage !== 0) return;
      if (!runtime.state.brief || !runtime.state.contact) {
        show(
          "확인할 정보가 남았어요",
          /* HTML */
          `<p>
            선배에게 업무를 듣고 수요기관에 납품기한을 확인해 주세요. 추측으로 요청서를 채울 수는
            없어요.
          </p>
          ${buttons([["close", "정보 수집하러 가기"]])}`
        );
        return;
      }
      complete("요청서 접수 준비 완료", "확인한 납기를 보완하고 선배 검토를 거쳐 접수했습니다.");
    },
    "intake-bad": () => wrong(
      "납기는 구매 목적과 공급 가능성에 영향을 줍니다. 수요기관 확인 없이 임의로 정하지 않아요.",
      "doc"
    ),
    "spec-good": () => {
      if (runtime.state.stage !== 1) return;
      if (!runtime.state.specAdvice) {
        show(
          "수정 근거를 먼저 확인해요",
          /* HTML */
          `<p>선배 김주문에게 수요기관과 확인한 성능 조건을 들어 보세요.</p>
          ${buttons([["close", "선배에게 가기"]])}`
        );
        return;
      }
      complete(
        "규격 검토 완료",
        "수요기관과 협의한 성능 중심 수정안을 작성하고, 선배의 검토를 받았습니다."
      );
    },
    "spec-bad": () => wrong(
      "이 사례에는 특정 브랜드만 필요한 사유가 없어요. 필요한 성능으로 표현하면 여러 기업이 경쟁할 수 있습니다.",
      "doc"
    ),
    "spec-empty": () => wrong(
      "규격을 모두 없애면 목적에 맞지 않는 물품이 올 수 있어요. 필요한 성능은 명확히 남겨야 해요.",
      "doc"
    ),
    "product-good": () => {
      if (runtime.state.stage !== 3) return;
      runtime.state.product = true;
      save();
      render();
      show(
        "공고에 맞는 제품을 골랐어요",
        /* HTML */
        `<div class="success">새봄 M24 · 크기, 해상도, 연결 방식 및 납기 충족</div>
        <p>모의 나라장터에서 참가 조건을 확인하고 입찰서를 제출하세요.</p>
        ${buttons([["close", "모의 입찰 준비하기"]])}`
      );
    },
    "product-bad": () => wrong(
      "22형은 공고의 24형 이상 조건에 미달해요. 가격만 보지 말고 규격과 납기를 함께 확인하세요.",
      "doc"
    ),
    "submit-bid": finishBid
  };
  Object.assign(actions, {
    supplier: supplierNPC,
    "portal-home": () => openPortal("home"),
    "portal-login": () => openPortal(runtime.portalSignedIn ? runtime.state.stage === 2 ? "draft" : "list" : "login"),
    "portal-signin": () => {
      runtime.portalSignedIn = true;
      openPortal(runtime.state.stage === 2 ? "draft" : "list");
    },
    "portal-work": portalWork,
    "portal-list": () => openPortal("list"),
    "portal-search": () => openPortal("list", $("portal-search").value),
    "portal-guide": () => openPortal("guide"),
    "portal-detail": portalDetail,
    "portal-bid": portalBid,
    "portal-save-draft": savePortalDraft
  });
  for (let i = 0; i < 5; i++) actions["item-" + i] = () => inspectItem(i);

  // src/game/quests.js
  function nextTarget() {
    if (runtime.state.stage === 0)
      return !runtime.state.brief ? "mentor" : !runtime.state.contact ? "phone" : "doc";
    if (runtime.state.stage === 1) return !runtime.state.specAdvice ? "mentor" : "doc";
    if (runtime.state.stage === 2) return !runtime.state.noticeChecked ? "terminal" : "mentor";
    if (runtime.state.stage === 3) return !runtime.state.product ? "doc" : "terminal";
    return "result";
  }
  function wrong(text, back) {
    runtime.state.mistakes++;
    save();
    show(
      "잠깐, 한 번 더 확인해요",
      /* HTML */
      `<div class="alert">${text}</div>
      <p>아직 제출되지 않았어요. 자료를 다시 확인하고 수정할 수 있어요.</p>
      ${buttons([[back, "다시 검토하기"]])}`,
      "feedback",
      false
    );
  }
  function complete(title, body) {
    const completed = runtime.state.stage;
    if (completed > 2) return;
    runtime.state.history.push(
      ["요청서 확인 및 접수 준비", "경쟁 가능한 규격 수정", "검토·결재 후 공고 게시"][completed]
    );
    runtime.state.stage++;
    save();
    render();
    show(
      title,
      /* HTML */
      `<div class="success">✓ ${body}</div>
      <p>
        ${completed === 2 ? "검토·결재를 거쳐 공고가 게시됐습니다. 다음 장면에서는 기업 담당자로 전환합니다." : "퀘스트 완료! 진행 상황을 이 브라우저에 저장했습니다."}
      </p>
      ${buttons([["advance", completed === 2 ? "기업 담당자로 전환" : "다음 퀘스트"]])}`,
      "advance",
      false
    );
    chime();
  }
  function mentor() {
    if (runtime.state.stage === 0) {
      speak(
        "김주문",
        [
          "새봄도서관에서 모니터 20대를 요청했어요. 요청서에 납품기한이 빠져 있네요.",
          "왼쪽 연락 데스크에서 수요기관에 납기를 확인해 주세요. 확인한 내용으로 요청서를 보완하면 됩니다."
        ],
        () => {
          runtime.state.brief = true;
          save();
          render();
        }
      );
    } else if (runtime.state.stage === 1) {
      speak(
        "김주문",
        [
          "규격서에 특정 브랜드가 적혀 있네요. 이번 사례에서는 그 브랜드만 필요한 사유가 확인되지 않았어요.",
          "수요기관과 확인했더니 문서 열람용 24형 이상, FHD 이상, HDMI 연결이면 된대요.",
          "이 성능 기준을 담아 수정안을 만들어 주세요. 필요한 조건은 지키고, 다른 기업도 참여할 수 있게요."
        ],
        () => {
          runtime.state.specAdvice = true;
          save();
          render();
        }
      );
    } else if (runtime.state.stage === 2) {
      if (!runtime.state.noticeChecked) {
        speak("김주문", [
          "공고 초안을 먼저 확인해 주세요. 요청서는 모니터 20대였죠? 수량이 같은지 대조해 보세요."
        ]);
        return;
      }
      speak(
        "김주문",
        [
          "수량 20대와 성능 조건을 확인했어요. 초안 검토를 마쳤습니다.",
          "이제 권한 있는 담당자의 구매결의·결재 절차로 넘길게요. 그 절차가 끝나야 공고가 게시됩니다."
        ],
        () => actions.approve()
      );
    } else speak("김주문", ["수고했어요, 조달달 주무관! 확인하고 협의하는 습관을 기억하세요."]);
  }
  function phone() {
    if (runtime.state.stage === 0) {
      if (!runtime.state.brief) {
        speak("안내", ["먼저 김주문 선배에게 첫 업무를 들어 보세요."]);
        return;
      }
      speak(
        "수요기관 담당자",
        [
          "새봄도서관입니다. 아, 요청서에 납기를 빠뜨렸네요!",
          "계약일로부터 30일 이내에 도서관 2층 자료실로 부탁드려요. 이용자들이 문서를 읽을 때 쓸 모니터예요."
        ],
        () => {
          runtime.state.contact = true;
          save();
          render();
          toast("납기 30일 · 2층 자료실을 기록했어요.");
        },
        "contact"
      );
    } else show("수요기관 확인 메모", `${requestDoc()}${buttons([["close", "돌아가기"]])}`);
  }
  function requestDoc() {
    return doc("물품 구매 요청서", [
      ["수요기관", "새봄도서관"],
      ["구매 물품", "이용자용 모니터 20대"],
      ["배정 예산", "20,000,000원 (가상 설정)"],
      ["사용 목적", "자료실에서 문서·자료 열람"],
      ["납품기한", runtime.state.contact ? "계약일로부터 30일 이내" : "미기재 · 확인 필요"],
      ["납품 장소", runtime.state.contact ? "새봄도서관 2층 자료실" : "새봄도서관"]
    ]);
  }
  function documentDesk() {
    if (runtime.state.stage === 0) {
      show(
        "첫 요청서를 검토하세요",
        `${requestDoc()}<p>접수 준비를 마치려면 어떻게 해야 할까요?</p><div class="choices"><button class="choice" data-action="intake-good">확인한 납기를 보완하고 검토를 요청한다<small>수요기관 확인 내용으로 빈칸을 채웁니다.</small></button><button class="choice" data-action="intake-bad">급하니 납기를 임의로 7일로 적는다<small>빠른 처리를 위해 내가 정합니다.</small></button></div>`
      );
    } else if (runtime.state.stage === 1) {
      show(
        "규격서에서 공정한 기준 찾기",
        `${doc("물품 규격서 초안", [
          ["기존 문구", "“별빛전자 S24 제품만 허용”"],
          ["사용 목적", "문서 및 자료 열람"],
          ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
          ["수량", "20대"]
        ])}<p>검토 의견으로 가장 알맞은 것은?</p><div class="choices"><button class="choice" data-action="spec-bad">기존 브랜드와 모델명 제한을 그대로 유지한다</button><button class="choice" data-action="spec-good">협의한 성능 기준으로 수정안을 작성한다<small>브랜드 제한 대신 크기·해상도·연결 조건을 명시합니다.</small></button><button class="choice" data-action="spec-empty">경쟁이 쉬워지도록 모든 규격을 삭제한다</button></div>`
      );
    } else if (runtime.state.stage === 3) {
      show(
        "공고 규격과 제품을 비교하세요",
        `${doc("공고의 납품 조건", [
          ["구매 수량", "20대"],
          ["필요 성능", "24형 이상 · FHD 이상 · HDMI 연결"],
          ["납품기한", "계약일로부터 30일 이내"]
        ])}<div class="choices"><button class="choice" data-action="product-good">새봄 M24 · 24형 / FHD / HDMI<small>20대 공급 가능 · 계약 후 20일 내 납품 가능</small></button><button class="choice" data-action="product-bad">새봄 C22 · 22형 / FHD / HDMI<small>20대 공급 가능 · 저렴하지만 화면 크기가 부족합니다.</small></button></div>`
      );
    } else show("확인한 구매 요청서", `${requestDoc()}${buttons([["close", "확인 완료"]])}`);
  }
  function tutorial() {
    speak(
      "김주문",
      [
        "반가워요, 조달달 주무관! 새봄지방조달청에 온 걸 환영해요. 첫 업무는 제가 옆에서 알려 줄게요.",
        "방향키나 WASD로 걸어 보세요. 사람이나 책상 이름을 누르면 알아서 찾아가요. 대화는 스페이스바로 넘기면 돼요.",
        "왼쪽 위 작은 지도에서 내 위치를 볼 수 있어요. 오른쪽 위는 제 업무 노트, 아래 5칸은 물건을 모으는 인벤토리예요.",
        "우리는 내용을 확인하고 초안을 준비해요. 공고는 검토와 담당자 결재를 거칩니다. 혼자 확정하면 안 돼요.",
        "첫 의뢰는 도서관 모니터 20대예요. 요청서에 납기가 빠졌네요. 연락 데스크에서 확인해 주세요. 노트에도 적어 둘게요."
      ],
      () => {
        runtime.state.brief = true;
        save();
        render();
        setNotebook(true);
        toast("첫 업무를 받았어요. 김주문의 노트를 확인해 보세요.");
      }
    );
  }
  function supplierNPC() {
    speak(
      "욘 대리",
      [
        "안녕하세요! 새봄테크에서 입찰 업무를 맡고 있는 욘입니다.",
        "공고가 게시되면 나라장터에서 같은 정보를 확인하고 참여할 거예요. 규격과 납기를 꼼꼼히 읽어야죠."
      ],
      () => {
      },
      "supplier"
    );
  }
  function finishBid() {
    if (runtime.state.stage !== 3) return;
    const checked = $("eligible") && $("eligible").checked;
    runtime.state.eligibility = !!checked;
    if (!runtime.state.product || !checked) {
      save();
      render();
      toast(
        !runtime.state.product ? "규격에 맞는 제품을 먼저 선택하세요." : "참가 조건 확인란에 체크해 주세요."
      );
      return;
    }
    runtime.state.history.push("기업 모의 입찰서 접수");
    runtime.state.stage = 4;
    runtime.portalSignedIn = false;
    save();
    render();
    close();
    chime();
    speak(
      "욘 대리",
      [
        "모의 입찰서가 접수됐어요! 공고를 꼼꼼히 읽으니 제출까지 할 수 있었네요.",
        "접수는 낙찰이나 계약 체결이 아니에요. 다음 절차가 남아 있다는 점도 기억할게요."
      ],
      ending,
      "supplier"
    );
  }

  // src/components/hud.js
  function render() {
    const q = quests[runtime.state.stage];
    $("steps").innerHTML = ["요청서 접수", "규격 검토", "입찰 공고", "기업 입찰 참여"].map(
      (n, i) => (
        /* HTML */
        `<div
          class="step ${i < runtime.state.stage ? "done" : i === runtime.state.stage ? "active" : ""}"
          ${i === runtime.state.stage ? 'aria-current="step"' : ""}
        >
          <span class="num">${i < runtime.state.stage ? "✓" : String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>${n}</strong
            ><small
              >${i < runtime.state.stage ? "완료" : i === runtime.state.stage ? "진행 중" : "다음 퀘스트"}</small
            >
          </div>
        </div>`
      )
    ).join("");
    $("quest-title").textContent = q.title;
    $("quest-desc").textContent = q.desc;
    $("memo").textContent = q.memo;
    $("quest-count").textContent = runtime.state.stage + " / 4";
    const tasks = runtime.state.stage === 0 ? [
      [runtime.state.brief, "선배에게 첫 업무 듣기"],
      [runtime.state.contact, "수요기관에 납기 확인"],
      [false, "요청서 검토 및 접수 준비"]
    ] : runtime.state.stage === 1 ? [
      [runtime.state.specAdvice, "선배에게 규격 검토 조언 듣기"],
      [false, "규격 수정안 작성"]
    ] : runtime.state.stage === 2 ? [
      [runtime.state.noticeChecked, "공고 초안 수량 대조"],
      [false, "선배 검토 및 결재 절차"]
    ] : runtime.state.stage === 3 ? [
      [runtime.state.product, "공고에 맞는 제품 선택"],
      [runtime.state.eligibility, "참가 조건 확인"],
      [false, "모의 입찰서 제출"]
    ] : [
      [true, "요청서 확인"],
      [true, "규격 수정 및 공고"],
      [true, "기업 입찰 참여"]
    ];
    $("todos").innerHTML = tasks.map(
      ([ok, t]) => (
        /* HTML */
        `<li class="${ok ? "checked" : ""}">
          <span class="check">${ok ? "✓" : ""}</span>${t}
        </li>`
      )
    ).join("");
    $("location").textContent = runtime.state.stage === 3 ? "새봄테크 · 영업팀 사무실" : "새봄지방조달청 · 구매팀";
    $("player-label").textContent = runtime.state.stage === 3 ? "욘 대리 · 기업 담당자" : "플레이어 · 조달달 / 신입 9급 주무관";
    $("scene-time").textContent = [
      "DAY 01 · 09:00",
      "DAY 01 · 10:00",
      "공고 준비 · 시간 축약",
      "입찰 참여 · 시간 축약",
      "EPISODE CLEAR"
    ][runtime.state.stage];
    $("spot-doc").textContent = runtime.state.stage === 3 ? "제품 자료 · 내 책상" : runtime.state.stage === 1 ? "규격서 · 내 책상" : "요청서 · 내 책상";
    $("spot-mentor").hidden = runtime.state.stage === 3;
    $("spot-phone").hidden = runtime.state.stage === 3;
    $("spot-supplier").hidden = runtime.state.stage === 3;
    $("spot-terminal").textContent = runtime.state.stage === 3 ? "업무용 모니터" : "업무용 모니터";
    ["doc", "mentor", "phone", "terminal"].forEach(
      (id) => $("spot-" + id).classList.toggle("target", nextTarget() === id)
    );
    $("guide-button").textContent = runtime.state.stage === 4 ? "완료 기록 보기" : "다음 목표로 이동";
    $("quest-label").textContent = runtime.state.stage === 4 ? "완료" : `퀘스트 ${runtime.state.stage + 1}`;
    renderInventory();
    if (!runtime.storageOK) $("save-status").textContent = "저장 불가 · 현재 창에서 계속";
  }
  function setNotebook(open) {
    $("quest-panel").hidden = !open;
    $("quest-toggle").setAttribute("aria-expanded", String(open));
  }

  // src/components/modal.js
  function toast(t) {
    $("toast").textContent = t;
    $("toast").hidden = false;
    clearTimeout(runtime.toastTimer);
    runtime.toastTimer = setTimeout(() => $("toast").hidden = true, 3e3);
  }
  function show(title, body, kind = "", closable = true) {
    stopSounds();
    setNotebook(false);
    $("game-shell").inert = true;
    keys.clear();
    runtime.target = null;
    runtime.lastFocus = document.activeElement;
    runtime.modalOpen = true;
    runtime.modalKind = kind;
    $("modal").classList.toggle("portal-modal", kind === "portal");
    $("modal").innerHTML = `${closable ? '<button class="close" data-action="close" aria-label="닫기">×</button>' : ""}<div class="eyebrow">${runtime.state.stage === 3 ? "SUPPLIER SIDE" : "PROCUREMENT QUEST"}</div><h2 id="modal-title">${title}</h2>${body}`;
    $("overlay").hidden = false;
    $("modal").scrollTop = 0;
    $("modal").focus();
  }
  function close() {
    stopSounds();
    $("game-shell").inert = runtime.titleVisible;
    runtime.modalOpen = false;
    $("overlay").hidden = true;
    runtime.modalKind = "";
    if (runtime.lastFocus && runtime.lastFocus.isConnected) runtime.lastFocus.focus();
  }
  function buttons(items) {
    return (
      /* HTML */
      `<div class="actions">
    ${items.map(([a, t, secondary]) => (
        /* HTML */
        `<button class="${secondary ? "secondary" : "primary"}" data-action="${a}">${t}</button>`
      )).join("")}
  </div>`
    );
  }
  function doc(title, rows) {
    return (
      /* HTML */
      `<div class="document">
    <div class="doc-header"><strong>${title}</strong><small>게임용 가상 문서</small></div>
    ${rows.map(([a, b]) => (
        /* HTML */
        `<div class="row"><span>${a}</span><b>${b}</b></div>`
      )).join("")}
  </div>`
    );
  }
  function help() {
    show(
      "조달달의 업무 수첩",
      /* HTML */
      `<p>
        <strong>대화:</strong> 스페이스바 한 번으로 현재 문장을 모두 보고, 다시 누르면 다음 말로
        넘어갑니다. 화면의 Space 버튼도 누를 수 있어요.
      </p>
      <p>
        <strong>퀘스트:</strong> 오른쪽 위 버튼 또는 Q로 김주문의 줄노트를 펼칩니다. 퀘스트를 완료할
        때마다 브라우저에 저장합니다.
      </p>
      <p>
        <strong>사운드:</strong> 소리 버튼에서 음량을 조절하거나 욘 대리의 녹음 목소리를 들어 볼 수
        있어요. 대화 중 소리 버튼을 누르면 음소거를 전환합니다.
      </p>
      <p>
        <strong>이동:</strong> 방향키 또는 WASD. 가까운 대상과 Space 또는 E로 상호작용합니다. 대상
        이름을 클릭·터치하면 자동으로 이동해 대화합니다.
      </p>
      <p>
        <strong>다음 목표로 이동:</strong> 현재 해야 할 일을 바로 찾아갑니다. 잘못 선택해도 설명을
        읽고 다시 시도할 수 있습니다.
      </p>
      <p>
        <strong>인벤토리:</strong> 하단 5칸에 사원증과 완료한 업무의 문서가 쌓입니다. 물건을 눌러
        내용을 다시 볼 수 있어요.
      </p>
      <p>
        <strong>업무용 모니터:</strong> 모니터를 사용할 때만 나라장터 체험 화면이 열립니다. 초안
        저장 후에는 사무실로 돌아와 선배에게 검토를 요청하세요.
      </p>
      <p>
        <strong>공간:</strong> 조달청 본청 5층의 중앙 복도와 방 배치를 참고한 가상 지방청입니다.
        기업 단계는 별도 사무실로 전환하며 공간 배치는 체험을 위해 재사용합니다.
      </p>
      <p>
        <strong>저장:</strong> 같은 브라우저·같은 주소에서 진행 상황이 자동 저장됩니다. 시크릿
        모드나 저장 제한 환경에서는 이어하기가 제한됩니다.
      </p>
      <p>
        <strong>업무 범위:</strong> 요청 접수 → 규격 검토 → 공고 → 기업 입찰 참여까지. 구매결의와
        결재는 장면으로 압축하고, 예정가격 결정·낙찰·계약·납품은 체험 범위에서 제외했습니다.
      </p>
      <p>
        원자료:
        <a href="https://www.pps.go.kr/kor/content.do?key=00179" target="_blank" rel="noopener"
          >조달청 총액계약 업무처리절차</a
        >
        (확인 2026-11-21). 금액·품목·납기·기업·규격은 게임용 창작입니다.
      </p>
      ${buttons([["close", "게임으로 돌아가기"]])}`,
      "help"
    );
  }

  // assets/audio/yon-voice-bank.wav
  var yon_voice_bank_default = "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";

  // src/audio/sound.js
  var voiceClips = /* @__PURE__ */ new Map();
  var activeSounds = /* @__PURE__ */ new Set();
  function loadSupplierVoice() {
    if (runtime.supplierVoiceReady) return;
    runtime.supplierVoiceReady = runtime.audioCtx.decodeAudioData(Uint8Array.from(atob(yon_voice_bank_default), (c) => c.charCodeAt(0)).buffer).then((buffer) => {
      voiceClips.set("supplier", {
        buffer,
        offsets: Array.from({ length: 24 }, (_, i) => i * 0.1)
      });
    }).catch(() => toast("녹음 재생을 지원하지 않아 기본 목소리를 사용합니다."));
  }
  function unlockAudio() {
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
      runtime.audioCtx.resume().catch(() => toast("소리 재생을 위해 사운드 버튼을 다시 눌러 주세요."));
    return true;
  }
  function stopSounds() {
    for (const source of activeSounds) {
      try {
        source.stop();
      } catch (e) {
      }
    }
    activeSounds.clear();
  }
  function updateVolume() {
    if (runtime.master)
      runtime.master.gain.setValueAtTime(
        runtime.muted ? 0 : runtime.volume,
        runtime.audioCtx.currentTime
      );
    $("sound-toggle").textContent = runtime.muted ? "♫ 꺼짐" : "♫ 소리";
    const m = $("mute-button");
    if (m) m.textContent = runtime.muted ? "소리 켜기" : "소리 끄기";
  }
  function playSyllable(letter, role = "mentor", delay = 0) {
    if (runtime.muted || !runtime.audioCtx || runtime.audioCtx.state !== "running" || /\s|[.,!?…·]/.test(letter))
      return;
    const clip = voiceClips.get(role), code = letter.codePointAt(0) || 0, rate = (role === "rookie" ? 1.7 : 1.4) + code % 7 * 0.045;
    const source = runtime.audioCtx.createBufferSource(), gain = runtime.audioCtx.createGain();
    let offset = 0, segment = 0.085;
    if (clip) {
      source.buffer = clip.buffer;
      offset = clip.offsets[code % clip.offsets.length];
    } else {
      const length = Math.floor(runtime.audioCtx.sampleRate * segment), buffer = runtime.audioCtx.createBuffer(1, length, runtime.audioCtx.sampleRate), data = buffer.getChannelData(0), f0 = 155 + code % 9 * 14;
      for (let i = 0; i < length; i++) {
        const t = i / runtime.audioCtx.sampleRate;
        let value = 0;
        for (let h = 1; h <= 7; h++) {
          const hz = f0 * h, weight = (0.25 + Math.exp(-Math.pow((hz - 750) / 350, 2)) + 0.6 * Math.exp(-Math.pow((hz - 1450) / 500, 2))) / h;
          value += Math.sin(2 * Math.PI * hz * t) * weight;
        }
        data[i] = value * 0.25;
      }
      source.buffer = buffer;
    }
    source.playbackRate.value = rate;
    const when = runtime.audioCtx.currentTime + delay, duration = segment / rate;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.7, when + 8e-3);
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
  function chime() {
    if (runtime.muted || !runtime.audioCtx || runtime.audioCtx.state !== "running") return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const s = runtime.audioCtx.createOscillator(), g = runtime.audioCtx.createGain(), t = runtime.audioCtx.currentTime + i * 0.11;
      s.type = "sine";
      s.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.17, t + 0.015);
      g.gain.exponentialRampToValueAtTime(1e-3, t + 0.25);
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
  function soundSettings() {
    if (runtime.talkState) {
      runtime.muted = !runtime.muted;
      stopSounds();
      updateVolume();
      toast(runtime.muted ? "대화 소리를 껐어요." : "대화 소리를 켰어요.");
      return;
    }
    show(
      "사운드",
      /* HTML */
      `<p>
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
      "sound"
    );
  }
  async function previewVoice() {
    if (!unlockAudio()) return;
    await runtime.supplierVoiceReady;
    stopSounds();
    if (runtime.muted) {
      toast("소리를 켠 뒤 들어 주세요.");
      return;
    }
    Array.from("안녕하세요입찰에참여할게요").forEach(
      (letter, i) => playSyllable(letter, "supplier", i * 0.095)
    );
  }

  // src/game/input.js
  function handleKey(e) {
    if (runtime.talkState) {
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) {
          unlockAudio();
          nextLine();
        }
      }
      return;
    }
    if (runtime.modalOpen) {
      if (e.key === "Escape" && !["advance", "feedback"].includes(runtime.modalKind)) close();
      if (e.key === "Tab") {
        const list = [...$("modal").querySelectorAll("button,a,input,select")].filter(
          (el) => !el.disabled
        ), first = list[0], end = list.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $("modal"))) {
          e.preventDefault();
          end?.focus();
        } else if (!e.shiftKey && (document.activeElement === end || document.activeElement === $("modal"))) {
          e.preventDefault();
          first?.focus();
        }
      }
      return;
    }
    if (runtime.titleVisible) return;
    const k = e.key.toLowerCase();
    if (k === "q") {
      e.preventDefault();
      if (!e.repeat) setNotebook($("quest-panel").hidden);
      return;
    }
    if (e.code === "Space" && ["BUTTON", "INPUT", "SELECT"].includes(e.target.tagName)) return;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e"].includes(k) || e.code === "Space") {
      e.preventDefault();
      if (k === "e" || e.code === "Space") {
        if (!e.repeat) {
          unlockAudio();
          interact();
        }
      } else {
        keys.add(k);
        runtime.target = null;
        canvas.focus({ preventScroll: true });
      }
    }
  }
  function bindInput() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-action]");
      if (b) {
        const a = b.dataset.action;
        if (runtime.talkState && !["talk-next", "sound"].includes(a)) return;
        unlockAudio();
        if (a.startsWith("go-")) go(a.slice(3));
        else if (actions[a]) actions[a]();
      }
      const m = e.target.closest("[data-move]");
      if (m && !runtime.modalOpen && !runtime.talkState && !runtime.titleVisible) {
        runtime.target = null;
        const d = { left: [-18, 18], right: [18, -18], up: [-18, -18], down: [18, 18] }[m.dataset.move];
        stepPlayer(d[0], d[1]);
      }
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "eligible") {
        runtime.state.eligibility = e.target.checked;
        save();
        render();
      }
    });
    document.addEventListener("input", (e) => {
      if (e.target.id === "volume") {
        runtime.volume = Number(e.target.value) / 100;
        updateVolume();
      }
    });
    document.addEventListener("keydown", handleKey);
    document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => {
      keys.clear();
      revealLine();
      stopSounds();
    });
    window.addEventListener("resize", resizeWorld);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        keys.clear();
        revealLine();
        stopSounds();
      }
    });
  }

  // src/main.js
  loadGame();
  bindInput();
  resizeWorld();
  render();
  intro();
  requestAnimationFrame(frame);
})();
