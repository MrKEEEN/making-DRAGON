import { DragonScope } from './base/prop_schema.js';
import { dragonManager } from './core/DragonManager.js';
import { paneSetupUI, buildDPS } from './ui/Inspector.js';
import { ResetSaveLoad } from './ui/ResetSaveLoad.js';

//TODO 画面の画像を右クリックメニューで保存するとページが勝手にリロードされる。jsのコードではなくブラウザの機能だが、要修正。画像保存は必要。


//webGPUのライブラリ
import * as PIXI from '../lib/pixi.mjs';
// --- 描画モードとキャンバスの定義 ---
let drawMode = 1;
const canvas2d = document.getElementById("canvas-2d");
const canvasWebGPU = document.getElementById("canvas-webgpu");
const ctx = canvas2d.getContext("2d");

export const app = new PIXI.Application();

async function initPixi() {
    await app.init({
        canvas: canvasWebGPU, // WebGPU専用のキャンバスを指定
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        preference: 'webgpu',
        manageCanvasResize: false
    });}
initPixi();
dragonManager.initApp(app);

let rgb = { r: 0, g: 0, b: 0 };
const changeBackgroundColor = () => {
      canvasWebGPU.style.setProperty('--bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);};
window.addEventListener("keydown", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
    const key = e.key.toLowerCase();
    const step = e.shiftKey ? -1 : 1;
    if (key === 'r') {
        rgb.r = Math.min(255, Math.max(0, rgb.r + step));
    } else if (key === 'g') {
        rgb.g = Math.min(255, Math.max(0, rgb.g + step));
    } else if (key === 'b') {
        rgb.b = Math.min(255, Math.max(0, rgb.b + step));}
    changeBackgroundColor();
    const RGBInfo = document.getElementById('RGB-info');
    RGBInfo.textContent = `R:${rgb.r} G:${rgb.g} B:${rgb.b}`;});

const resizerV = document.getElementById("resizer_v");
const maxPaneWidth = 500;


  function resizeCanvas() {
    const dpr = window.devicePixelRatio ?? 1;
    [canvas2d, canvasWebGPU].forEach(c => {
  // 物理ピクセルサイズを設定（解像度）
  c.width = window.innerWidth * dpr;
  c.height = window.innerHeight * dpr;
  // CSS上の見た目（論理ピクセル）を固定
  c.style.width = window.innerWidth + "px";
  c.style.height = window.innerHeight + "px";
  });
  // 描画コンテキストのスケーリング（既存の描画ロジックを維持するため）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (app.renderer) {
      app.renderer.resolution = dpr;
      app.renderer.resize(window.innerWidth, window.innerHeight);}}

window.addEventListener("resize", () => {
  if(!clearMode){return;}
  resizeCanvas()
});
resizeCanvas();

// let isDraggingV = false;
// resizerV.addEventListener("mousedown", () => {
//   isDraggingV = true;
//   document.body.style.cursor = "ew-resize";});
// window.addEventListener("mouseup", () => {
//   isDraggingV = false;
//   document.body.style.cursor = "default";});

// window.addEventListener("mousemove", (e) => {
//   if (!isDraggingV || !clearMode) { return; }
//   // 1. CSS変数から現在のズーム倍率を取得
//   const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom-ratio')) ?? 1;
//   const newWidth = window.innerWidth - e.clientX;
//   // 3. ブラウザの拡大縮小に適応するための処理込み
//   const finalWidth = Math.max(0, Math.min(maxPaneWidth / zoom, newWidth));

//   document.documentElement.style.setProperty('--pane-width', finalWidth * zoom);
//   resizeCanvas();});


let isDraggingV = false;
resizerV.addEventListener("pointerdown", (e) => {
    isDraggingV = true;
    resizerV.setPointerCapture(e.pointerId);
});

window.addEventListener("pointermove", (e) => {
    if (!isDraggingV || !clearMode) return;
    const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom-ratio')) ?? 1;
    const newWidth = window.innerWidth - e.clientX;
    const finalWidth = Math.max(0, Math.min(maxPaneWidth / zoom, newWidth));
    document.documentElement.style.setProperty('--pane-width', finalWidth * zoom);
    resizeCanvas();
});

window.addEventListener("pointerup", () => {
    isDraggingV = false;
});



  // 1,2,3,4 キーで回転モード切替. z keyで描写反転. m keyでmouse追従のon,off切替
let rotationMode = 0;
let reverseMode = 0;   // 0:通常順, 1:反転順後ろから描写
let mouseMode = 1;  // 0:追従off, 1:追従on
let clearMode = 1;  // 0:描画クリア, 1: 描画ノンクリア
let writeMode = 0;  // 0:off, 1:on
window.addEventListener("keydown", e => {
if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
const noticeMode = () => {
  const modeInfo = document.getElementById('mode-info');
  modeInfo.textContent = `MODE - Rotation(1~4):${rotationMode} reverse(z):${reverseMode} Mouse(m):${mouseMode} Clear(c):${clearMode} Write(w):${writeMode}`;};
if (e.key === "1") {
    rotationMode = (rotationMode === 1) ? 0 : 1;}
if (e.key === "2") {
    rotationMode = (rotationMode === 2) ? 0 : 2;}
if (e.key === "3"){
    rotationMode = (rotationMode === 3) ? 0 : 3;}
if (e.key === "4"){
    rotationMode = (rotationMode === 4) ? 0 : 4;}
if (e.key === "z"){
    reverseMode = (reverseMode === 1) ? 0 : 1;}
if (e.key === "m") {
    mouseMode = (mouseMode === 1) ? 0 : 1;}
if (e.key === "w") {
    writeMode = (writeMode === 1) ? 0 : 1;}
if (e.key === "c") {
//描画中にキャンバスサイズを変えるとリサイズイベントも発火してしまうため、clearModeがonのときのみリサイズしてキャンバスをクリアするようにする。
    if (clearMode) {
        clearMode = 0;
        drawMode = 0;
    } else {
        clearMode = 1;
        drawMode = 1;
        resizeCanvas();}}
    noticeMode();});

let isWriting = false;
canvas2d.addEventListener("mousedown", (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (writeMode) isWriting = true;});
window.addEventListener("mouseup", () => {
  isWriting = false;});
window.addEventListener("mouseleave", () => {
  isWriting = false;});


// --- 修正：ポインター（マウス・タッチ共通）追従ロジック ---
const mouse = { x: window.innerWidth/2, y: window.innerHeight/2 };
let isPointerActive = false; // スマホ等で「触れている間だけ」を判定するフラグ
// 座標更新用の共通関数
const updateMouseCoordinates = (e) => {
    if (!mouseMode) return;
    const rect = canvas2d.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
};


// 指が触れた / マウスが押された
canvas2d.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey) return;
    isPointerActive = true;
    updateMouseCoordinates(e);
    // 指がキャンバス外に出ても追跡を継続（スマホ操作の安定化）
    canvas2d.setPointerCapture(e.pointerId);
});
// 移動中（PCならホバー、スマホならなぞり操作）
window.addEventListener("pointermove", (e) => {
    // PC（mouse）の場合は常に追従。スマホ（touch）の場合は触れている間だけ追従。
    if (e.pointerType === 'mouse' || isPointerActive) {
        updateMouseCoordinates(e);
    }
});
window.addEventListener("pointerup", (e) => {
    isPointerActive = false;
    if (canvas2d.hasPointerCapture(e.pointerId)) {
        canvas2d.releasePointerCapture(e.pointerId);
    }
});
canvas2d.addEventListener("dblclick", (e) => {
    if (DragonScope.master) {
        DragonScope.master.isBoosting = true;
    }
});




// ==============================
// 全画面表示 & UI非表示 制御
// ==============================

// 1. 全画面表示トリガー（スマホでバーを消す）
const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error: ${err.message}`);});
    } else {
        await document.exitFullscreen();}};
// 2. ペイン非表示トリガー（UIを隠して描画に集中）
const toggleUIPane = () => {
    const pane = document.getElementById('controls');
    const resizerV = document.getElementById("resizer_v");

    if (!pane) return;
    pane.classList.toggle('pane-hidden');
    resizerV.classList.toggle('resizerV-hidden');
    resizeCanvas();};

const fsBtn = document.getElementById("btn-fullscreen");
const hideUiBtn = document.getElementById("btn-hide-ui");
let uiTimer = null;
const activePointers = new Set();

const showMobileButtons = () => {
    if (window.APP_MODE === "PC_MODE") return;
    // クラスを付与して表示
    fsBtn?.classList.add('show');
    hideUiBtn?.classList.add('show');
    // 既存のタイマーがあればリセット
    if (uiTimer) clearTimeout(uiTimer);
    // 3秒後にクラスを外して隠す
    uiTimer = setTimeout(() => {
        fsBtn?.classList.remove('show');
        hideUiBtn?.classList.remove('show');
    }, 3000);};

window.addEventListener("pointerdown", (e) => {
    activePointers.add(e.pointerId);

    // 3本以上の指が検知されたら表示
    if (activePointers.size >= 3) {
        showMobileButtons();}});

// ポインターが離れた時、またはキャンセルされた時
const removePointer = (e) => {
    activePointers.delete(e.pointerId);};

window.addEventListener("pointerup", removePointer);
window.addEventListener("pointercancel", removePointer);
fsBtn.addEventListener("click", toggleFullscreen);
hideUiBtn.addEventListener("click", toggleUIPane);





//============================
//新個体-individual作成ボタン
//============================
document.getElementById("add-ui-display").addEventListener("click", async () => {
    const { Dragon } = await import('./core/Dragon.js');
    const newDragon = new Dragon({
        meta: { name: "Master", _imgIndex: 5, followId: null, followIndex: null },
        basic: { numParts: 1 }});
    // Individualとして追加（内部でUI生成なども完結）
    dragonManager.add([newDragon]);
    const newIndex = dragonManager.individuals.length - 1;
    dragonManager.switch(newIndex);
    // 全体描画リストの更新
    updateUIStatus();});

// PREVIOUS 切替処理_index最後に移る
document.getElementById("prev-ui-switch").addEventListener("click", () => {
  //switch処理は重いので、不要な時は実行しない
  if(dragonManager.individuals.length === 1){return;}
      const newIndex = dragonManager.currentIndex - 1;
    if (newIndex < 0){
      dragonManager.switch(dragonManager.individuals.length-1);
      updateUIStatus();
      return;}
        dragonManager.switch(newIndex);
        updateUIStatus();});

// NEXT 切替処理_index頭に戻る
const switchToNext = () => {
    //switch処理は重いので、不要な時は実行しない
    if(dragonManager.individuals.length === 1){return;}
    const newIndex = dragonManager.currentIndex + 1;
    if (newIndex >= dragonManager.individuals.length){
      dragonManager.switch(0);
      updateUIStatus();
      return;}
        dragonManager.switch(newIndex);
        updateUIStatus();};

document.getElementById("next-ui-switch").addEventListener("click", switchToNext);

window.addEventListener("keydown", (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (e.key === "s"){
    switchToNext();}});


//============================
// individual 削除ボタン
//============================
document.getElementById("del-ui-display").addEventListener("click", () => {
  const deletedIndex = DragonScope.individualCurrentIndex;
  dragonManager.deleteCurrentIndividual(deletedIndex);
  updateUIStatus();
});

// UI上の「0 / 1」などのテキスト更新関数
function updateUIStatus() {
    const display = document.getElementById("current-ui-display");
    if (display) {
        const current = dragonManager.currentIndex + 1;
        const total = dragonManager.individuals.length;
        display.textContent = `${current} / ${total}`;}}

// ==============================
// 描画
// ==============================
function drawAll() {
  if(writeMode && !isWriting){return;}
  const displayList = dragonManager.allDps;
  const modeDrawing = (item) => {
    const part = item.part;
    const img = DragonScope.images[part.imgIndex];
    if (!img){return;}
    ctx.save();
    ctx.translate(part.x, part.y);
    ctx.rotate(part.angle);
    const sX = part.scaleX;
    const sY = part.scaleY;
    ctx.drawImage(img, -sX/2, -sY/2, sX, sY);
    ctx.restore();};
  if(reverseMode === 0){
  for (let i = displayList.length - 1; i >= 0; i--) {
    modeDrawing(displayList[i]);}
  } else if (reverseMode === 1){
    for (let i = 0; i < displayList.length; i++) {
    modeDrawing(displayList[i]);}
  }}



  //配列の途中から両端に向かって描画していく計算式（仮テスト用）
  // if(reverseMode === 0){
  // for (let i = displayList.length - 1; i >= 0; i--) {
  //   modeDrawing(displayList[i]);}
  // } else if (reverseMode === 1){
  //   for (let i = displayList.length-1 ; i >= 0 ; i--){
  //     const offset = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
  //     const index = Math.floor(displayList.length / 2) + offset;
  //     if (index >= 0 && index < displayList.length){
  //        modeDrawing(displayList[index]);}}}


// ==============================
// 画像読み込み
// ==============================
export async function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    if (src.startsWith('blob:')) {
      img.src=src;
    } else {
      img.src = "." + src;
    }
    img.onload=()=>{resolve(img)};
    img.onerror=reject;
  });}

const updateWebGPUResources = () => {
    DragonScope.textures = DragonScope.images.map(img => {
        const source = new PIXI.CanvasSource({ resource: img });
        return new PIXI.Texture({ source });
    });};

DragonScope.updateWebGPUResources = updateWebGPUResources;

  //==========
  //start関数
  //==========
  async function start() {
  const images = [];
  let i = 0;
  let running = true;
  while (running) {
    try {
      const img = await loadImage(`/imgs/img${i}.png`);
      images.push(img);
      i++;
    } catch (error) {
      running = false;}
  DragonScope.images = images;}

  DragonScope.updateWebGPUResources();


const sampleUrls = DragonScope.initialData;
if(sampleUrls.length > 1){
  rgb.r = 255;
  canvasWebGPU.style.setProperty('--bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  const RGBInfo = document.getElementById('RGB-info');
  RGBInfo.textContent = `R:${rgb.r} G:${rgb.g} B:${rgb.b}`;}

paneSetupUI();
ResetSaveLoad.setupUI();
const { Dragon } = await import('./core/Dragon.js');

for (let i = 0; i < sampleUrls.length; i++) {
        try {
            // i番目のパスのみを読み込む
            const url = sampleUrls[i];
            const response = await fetch(url);
            const jsonData = await response.json();
            // 3. 個体（Master）の器を生成
            const newDragon = new Dragon({
                meta: { name: "Master", _imgIndex: 0, followId: null, followIndex: null },
                basic: { numParts: 1 }
              });
            // 4. switch関数で重要な処理を行っているが、初期時に複数体を同タイミングで生成するため、順番を分けて2回呼出。
            dragonManager.add([newDragon]);
            dragonManager.switch(i);
            ResetSaveLoad.applyData(jsonData);
            dragonManager.switch(i);
        } catch (e) {
            console.error(`Failed at index ${i}:`, e);
        }}

    //最初の個体を選択済とさせる
    dragonManager.switch(0);
    updateUIStatus();
    //dpr解像度を起動時にも適応させるため呼び出し
    resizeCanvas();

  loop();
}

  // function loop() {
  // function frame() {
  //   requestAnimationFrame(frame);
  //   if(clearMode){ ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  //   for (const individual of dragonManager.individuals) {
  //   for (const d of individual.individualDragon) {
  //       d.update(mouse, rotationMode);}}
  //   if (DragonScope.needsRebuildDPS) {
  //     buildDPS();
  //     dragonManager.buildAllDps();
  //     DragonScope.needsRebuildDPS = false;}
  //     drawAll();}
  //   frame(0);}


  function loop() {
    function frame() {
      requestAnimationFrame(frame);
      // 座標計算（全モード共通）
      for (const individual of dragonManager.individuals) {
        for (const d of individual.individualDragon) {
          d.update(mouse, rotationMode);
        }}
      // 描画リスト(allDps)の再構築
      if (DragonScope.needsRebuildDPS) {
        buildDPS();
        dragonManager.buildAllDps();
        DragonScope.needsRebuildDPS = false;}
      // モードによる描画の切り替え
      if (drawMode === 1) {
          if(writeMode && !isWriting){return;}
        // WebGPU モード
        if (dragonManager.container) {dragonManager.container.visible = true;}
        dragonManager.syncWebGPUSprites(reverseMode);
      } else {
        // 2D モード(描画重ねる)
        if (dragonManager.container) {dragonManager.container.visible = false;}
        drawAll();
      }}
    frame();
  }



  start();

