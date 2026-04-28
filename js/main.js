import { DragonScope } from './base/prop_schema.js';
import { showToast } from './base/MathUtils.js';
import { dragonManager } from './core/DragonManager.js';
import { paneSetupUI, buildDPS } from './ui/Inspector.js';
import { ResetSaveLoad } from './ui/ResetSaveLoad.js';

//TODO 画面の画像を右クリックメニューで保存するとページが勝手にリロードされる。jsのコードではなくブラウザの機能だが、要修正。画像保存は必要。

//webGPUのライブラリ
import * as PIXI from '../lib/pixi.mjs';
// --- 描画モードとキャンバスの定義 ---
let drawMode = 1;
const canvasContainer = document.getElementById("canvas-container");
const canvas2d = document.getElementById("canvas-2d");
const canvasWebGPU = document.getElementById("canvas-webgpu");
const ctx = canvas2d.getContext("2d");
const app = new PIXI.Application();
const modeInfo = document.getElementById('mode-info');
const RGBInfo = document.getElementById('RGB-info');
const ratioInfo = document.getElementById('ratio-info');

async function initPixi() {
    await app.init({
        canvas: canvasWebGPU, // WebGPU専用のキャンバスを指定
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        preference: 'webgpu',
        manageCanvasResize: false});}
initPixi();
dragonManager.initApp(app);

  // 1,2,3,4 キーで回転モード切替. z keyで描写反転. m keyでmouse追従のon,off切替
let rotationMode = 0;
let reverseMode = 0;   // 0:通常順, 1:反転順後ろから描写
let mouseOffMode = 0;  // 0:追従off, 1:追従on
let clearOffMode = 0;  // 0:描画クリア, 1: 描画ノンクリア
let writeMode = 0;  // 0:off, 1:on
const noticeMode = () => {
  modeInfo.textContent = `MODE - Rotation(1~4):${rotationMode} Reverse(z):${reverseMode} MouseOff(m):${mouseOffMode} ClearOff(c):${clearOffMode} Write(w):${writeMode}`;};

function resizeCanvas() {
  if(window.APP_MODE === "PC_MODE"){
    const dpr = window.devicePixelRatio;
    [canvas2d, canvasWebGPU].forEach(c => {
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;});
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (app.renderer) {
        app.renderer.resolution = Math.max(1, Math.min(5, dpr ** 2));
        app.renderer.resize(window.innerWidth, window.innerHeight);}
    ratioInfo.textContent = `Ratio:${dpr.toFixed(3)}`;
    } else {
    const dpr = DragonScope.mobileRatio;
    [canvas2d, canvasWebGPU].forEach(c => {
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;
        c.style.width = "100%";
        c.style.height = "100%";
      });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (app.renderer) {
      app.renderer.resolution = Math.max(1, Math.min(5, dpr ** 2));
      app.renderer.resize(window.innerWidth /dpr, window.innerHeight /dpr);}
      ratioInfo.textContent = `Ratio:${dpr.toFixed(3)}`;}}

window.addEventListener("resize", () => {
  if(clearOffMode){return;}
  resizeCanvas()});

const zoomUp = () => {
    if(DragonScope.mobileRatio > 10) return;
    const zu = document.getElementById('btn-zoomup');
    DragonScope.mobileRatio *= 1.1;
    resizeCanvas();};
const zoomDown = () => {
    if(DragonScope.mobileRatio < 0.1) return;
    const zu = document.getElementById('btn-zoomup');
    DragonScope.mobileRatio *= 0.9;
    resizeCanvas();};
const resizerV = document.getElementById("resizer_v");
const maxPaneWidth = 500;
let isDraggingV = false;
resizerV.addEventListener("pointerdown", (e) => {
    isDraggingV = true;
    resizerV.setPointerCapture(e.pointerId);});
window.addEventListener("pointermove", (e) => {
    if (!isDraggingV || clearOffMode) return;
    const dpr = window.devicePixelRatio;
    const newWidth = window.innerWidth - e.clientX;
    const finalWidth = Math.max(0, Math.min(maxPaneWidth / dpr, newWidth));
    document.documentElement.style.setProperty('--pane-width', finalWidth * dpr);});

const btnIds = ["r-color", "g-color", "b-color", "multiply", "divide", "add", "subtract", "rotation", "reverse", "mouse-off", "clear-off", "write", "fullscreen", "hide-ui", "zoomup", "zoomdown"];
const [rColorBtn, gColorBtn, bColorBtn, multiplyBtn, divideBtn, addBtn, subtractBtn, rotationBtn, reverseBtn, mouseOffBtn, clearOffBtn, writeBtn, fsBtn, hideUiBtn, zuBtn, zdBtn] =
      btnIds.map(id => document.getElementById(`btn-${id}`));
const touchButtons = [rColorBtn, gColorBtn, bColorBtn, multiplyBtn, divideBtn, addBtn, subtractBtn, rotationBtn, reverseBtn, mouseOffBtn, clearOffBtn, writeBtn, fsBtn, hideUiBtn, zuBtn, zdBtn];
export const lumpCalculationKey = { m:multiplyBtn, d:divideBtn, a:addBtn, s:subtractBtn };
let uiTimer = null;
let colorChangeFlag = 0;
export const showMobileButtons = () => {
    // クラスを付与して表示
    for (const btn of touchButtons.values()) {btn.classList.add('show');}
    // 既存のタイマーがあればリセット
    if (uiTimer) {clearTimeout(uiTimer);}
    // 3秒後にクラスを外して隠す
    uiTimer = setTimeout(() => {
        for (const btn of touchButtons.values()) {
          btn.classList.remove('show');}
          colorChangeFlag = 0;
          //色編集もリセットされるのでボタンハイライトも元に戻す
          [rColorBtn, gColorBtn, bColorBtn].forEach(button => {
            button.style.borderColor = "";
            button.style.background = "";});
      }, 3000);};
//ボタン操作中は表示継続のため呼び出し続ける
for (const btn of touchButtons.values()) {
    btn.addEventListener('pointerdown', () => {
        showMobileButtons();});};

//タッチパネル用 背景色変更
const editingColor = (myColor) => {
    colorChangeFlag = colorChangeFlag === myColor ? 0 : myColor;
    [{btn:rColorBtn, key:"r"}, {btn:gColorBtn, key:"g"}, {btn:bColorBtn, key:"b"}].forEach(({btn, key}) => {
        const isActive = colorChangeFlag === key;
        btn.style.borderColor = isActive ? "#2a8" : "";
        btn.style.background = isActive ? "#242" : "";});};
rColorBtn.addEventListener("click", () => {
  editingColor("r");});
gColorBtn.addEventListener("click", () => {
  editingColor("g" );});
bColorBtn.addEventListener("click", () => {
  editingColor("b");});

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
    RGBInfo.textContent = `R:${rgb.r} G:${rgb.g} B:${rgb.b}`;});

let isWriting = false;
canvas2d.addEventListener("pointerdown", (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (writeMode) isWriting = true;});

// --- ポインター（マウス・タッチ共通）追従ロジック ---
const mouse = window.APP_MODE === "PC_MODE" ? { x: window.innerWidth/2, y: window.innerHeight/2 } :
      { x: window.innerWidth/(DragonScope.mobileRatio * 2), y: window.innerHeight/(DragonScope.mobileRatio * 2) };
const updateMouseCoordinates = (e) => {
    if (mouseOffMode) return;
      if(window.APP_MODE === "PC_MODE"){
    mouse.x = e.clientX;
    mouse.y = e.clientY;
      }else{
    mouse.x = e.clientX / DragonScope.mobileRatio;
    mouse.y = e.clientY / DragonScope.mobileRatio;}};

const activePointers = new Map();
const COLOR_THRESHOLD = 1; // 色変更の値（ピクセル）
const ZOOM_THRESHOLD = 30; // ズーム判定を行う距離のしきい値（ピクセル）
let lastPinchDistance = 0; // 前回の2本指の距離を保持
// 2本指の距離を計算するヘルパー関数
const getDistance = () => {
  const points = Array.from(activePointers.values());
  if (points.length !== 2) {return;}
  return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);};
// 3本指用 重心（X座標の平均）を計算するヘルパー関数
const getCentroidX = () => {
    const points = Array.from(activePointers.values());
    if (points.length === 0) {return 0;}
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    return sumX / points.length;};
let touchStartCentroidX = null; //3本指スワイプの初期座標値
let THREE_SWIPE_THRESHOLD = 100; //3本指スワイプの閾値

// 指がタッチ（１～３本） / マウスが押された
canvas2d.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 3) {
        showMobileButtons();
        touchStartCentroidX = getCentroidX();
    } else if (activePointers.size === 2) {
        lastPinchDistance = getDistance();
    }
    canvas2d.setPointerCapture(e.pointerId);});


// 移動中（PCならホバー、スマホならなぞり操作）
window.addEventListener("pointermove", (e) => {
    if(window.APP_MODE === "PC_MODE" && e.pointerType === 'mouse'){
      return updateMouseCoordinates(e);}
    if (!activePointers.has(e.pointerId)) {return;}
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
// -----=====1本指処理=====-----
    if (activePointers.size === 1) {
        updateMouseCoordinates(e);
// -----=====2本指処理=====-----
      } else if (activePointers.size === 2) {
        const currentDistance = getDistance();
        // 前回の距離との差分を計算
        const diff = currentDistance - lastPinchDistance;
// -----拡大縮小-----
          if(colorChangeFlag === 0 && !clearOffMode){
                if (Math.abs(diff) >= ZOOM_THRESHOLD) {
                  if (diff > 0) {
                    zoomUp();
                  } else {
                  zoomDown();}
              lastPinchDistance = currentDistance;}
            } else {
// -----背景色変更-----
              if (colorChangeFlag === 'r') {
                rgb.r = Math.min(255, Math.max(0, rgb.r + COLOR_THRESHOLD * Math.sign(diff)));}
              if (colorChangeFlag === 'g') {
                rgb.g = Math.min(255, Math.max(0, rgb.g + COLOR_THRESHOLD * Math.sign(diff)));}
              if (colorChangeFlag === 'b') {
                rgb.b = Math.min(255, Math.max(0, rgb.b + COLOR_THRESHOLD * Math.sign(diff)));}
            showToast(`edit:【${colorChangeFlag.toUpperCase()}】`, 300);
            lastPinchDistance = currentDistance;
            changeBackgroundColor();
            //ボタン表示継続
            showMobileButtons();
            RGBInfo.textContent = `R:${rgb.r} G:${rgb.g} B:${rgb.b}`;}
// -----=====3本指スワイプ処理=====-----
          } else if (activePointers.size === 3 && touchStartCentroidX !== null){
            const total = dragonManager.individuals.length;
            if (total === 1) {return;}

//----- 3本指スワイプの時はボタン消す 単発なので直書き ------
              for (const btn of touchButtons.values()) {
                  btn.classList.remove('show');}
                  colorChangeFlag = 0;
              [rColorBtn, gColorBtn, bColorBtn].forEach(button => {
                  button.style.borderColor = "";
                  button.style.background = "";});

            const currentCentroidX = getCentroidX();
            const diffThreeX = currentCentroidX - touchStartCentroidX;

// function debug(){
// const debugLog = document.getElementById("debug");
// debugLog.textContent = `${touchStartCentroidX}_${diffThreeX}`;};
// debug();

            if (Math.abs(diffThreeX) >= THREE_SWIPE_THRESHOLD) {
              // 座標をnullにして指を離すまでロック（物理ロック）
                touchStartCentroidX = null;
                if (diffThreeX > 0) {
                    switchToNext();
                } else {
                    switchToPrev();}
                showToast(` current:【${dragonManager.currentIndex + 1} / ${total}】`, 3000);
              }}});

//指が離れた時の処理をまとめる
const removePointer = (e) => {
    isWriting = false;
    isDraggingV = false;
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) {
        touchStartCentroidX = null;}
    canvas2d.releasePointerCapture(e.pointerId);};

canvas2d.addEventListener("dblclick", (e) => {
    if (window.APP_MODE === "MOBILE_MODE") {
    mouse.x = e.clientX / DragonScope.mobileRatio;
    mouse.y = e.clientY / DragonScope.mobileRatio;}
    DragonScope.master.isBoosting = true;});

// ==============================
// 全画面表示 & UI非表示 制御
// ==============================
// 1. 全画面表示トリガー（スマホでバーを消す）
const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error: ${err.message}`);});
        fsBtn.style.borderColor = "#2a8";
        fsBtn.style.background = "#242";
    } else {
        await document.exitFullscreen();
        fsBtn.style.borderColor = "";
        fsBtn.style.background = "";}};

// 2. ペイン非表示トリガー（UIを隠して描画に集中）
const toggleUIPane = () => {
    const pane = document.getElementById('controls');
    const resizerV = document.getElementById("resizer_v");
    if (!pane) return;
    pane.classList.toggle('pane-hidden');
    resizerV.classList.toggle('resizerV-hidden');
    hideUiBtn.style.borderColor = pane.classList.contains('pane-hidden') ? "#2a8" : "";
    hideUiBtn.style.background = pane.classList.contains('pane-hidden') ? "#242" : "";};

window.addEventListener("keydown", e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 4) {rotationMode = (rotationMode === num) ? 0 : num;}
  if (e.key === "z") {reverseMode ^= 1;}
  if (e.key === "m") {mouseOffMode ^= 1;}
  if (e.key === "w") {writeMode ^= 1;}
  if (e.key === "c") {
    //描画中にキャンバスサイズを変えるとリサイズイベントも発火してしまうため、clearModeがonのときのみリサイズしてキャンバスをクリアするようにする。
    if (clearOffMode) {
        clearOffMode = 0;
        drawMode = 1;
        resizeCanvas();
    } else {
        clearOffMode = 1;
        drawMode = 0;
        resizeCanvas();
      }
    resizeCanvas();
    }
    noticeMode();});

const modeActiveStyle = (btn, mode) => {
  btn.style.borderColor = mode === 0 ? "" : "#2a8";
  btn.style.background = mode === 0 ? "" : "#242";};

rotationBtn.addEventListener("click", () => {
// 0, 1, 2, 3, 4 の範囲でループさせる（5になったら0に戻る）
  rotationMode = (++ rotationMode) % 5;
  modeActiveStyle(rotationBtn, rotationMode);
  noticeMode();});
reverseBtn.addEventListener("click", () => {
  reverseMode ^= 1;
  modeActiveStyle(reverseBtn, reverseMode);
  noticeMode();});
mouseOffBtn.addEventListener("click", () => {
  mouseOffMode ^= 1;
  modeActiveStyle(mouseOffBtn, mouseOffMode);
  noticeMode();});
writeBtn.addEventListener("click", () => {
  writeMode ^= 1;
  modeActiveStyle(writeBtn, writeMode);
  noticeMode();});
clearOffBtn.addEventListener("click", () => {
      if (clearOffMode) {
        clearOffMode = 0;
        drawMode = 1;
    } else {
        clearOffMode = 1;
        drawMode = 0;
        // resizeCanvas();
    }
  modeActiveStyle(clearOffBtn, clearOffMode);
  noticeMode();});

//removePointerにまとめてるので、それを呼び出し
['pointerup', 'pointerleave', 'pointercancel'].forEach(type => {window.addEventListener(type, removePointer);});
fsBtn.addEventListener("click", toggleFullscreen);
hideUiBtn.addEventListener("click", toggleUIPane);
zuBtn.addEventListener("click", zoomUp);
zdBtn.addEventListener("click", zoomDown);


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

// NEXT 切替処理_index頭に戻る
function switchToNext() {
  //switch処理は重いので、不要な時は実行しない
    if(dragonManager.individuals.length === 1) {return;}
    const newIndex = dragonManager.currentIndex + 1;
    if (newIndex >= dragonManager.individuals.length){
      dragonManager.switch(0);
      updateUIStatus();
      return;}
        dragonManager.switch(newIndex);
        updateUIStatus();};
document.getElementById("next-ui-switch").addEventListener("click", switchToNext);
//PCはsキーのみなので、nextのみ
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (e.key === "s"){
    switchToNext();}});

// PREVIOUS 切替処理_index最後に移る(タッチパネル用にprevも用意。ホイスティングの為,function宣言)
function switchToPrev() {
    //switch処理は重いので、不要な時は実行しない
  if(dragonManager.individuals.length === 1){return;}
    const newIndex = dragonManager.currentIndex - 1;
    if (newIndex < 0){
      dragonManager.switch(dragonManager.individuals.length-1);
      updateUIStatus();
      return;}
        dragonManager.switch(newIndex);
        updateUIStatus();};
document.getElementById("prev-ui-switch").addEventListener("click", switchToPrev);


//============================
// individual 削除ボタン
//============================
document.getElementById("del-ui-display").addEventListener("click", () => {
  const deletedIndex = DragonScope.individualCurrentIndex;
  dragonManager.deleteCurrentIndividual(deletedIndex);
  updateUIStatus();});

// UI上の「0 / 1」などのテキスト更新関数
function updateUIStatus() {
    const display = document.getElementById("current-ui-display");
    if (display) {
        const current = dragonManager.currentIndex + 1;
        const total = dragonManager.individuals.length;
        display.textContent = `${current} / ${total}`;
        return `${current} / ${total}`;
      }}

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
      img.src = "." + src;}
    img.onload=()=>{resolve(img)};
    img.onerror=reject;});}

const updateWebGPUResources = () => {
    DragonScope.textures = DragonScope.images.map(img => {
        const source = new PIXI.CanvasSource({ resource: img });
        return new PIXI.Texture({ source });});};

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
  // dpr解像度を起動時にも適応させるため呼び出し
  if(window.devicePixelRatio >= 1){
    resizeCanvas();}
  const dpr = window.APP_MODE === "PC_MODE" ? window.devicePixelRatio : DragonScope.mobileRatio;
  ratioInfo.textContent = `Ratio:${dpr.toFixed(3)}`;
  loop();
}


  function loop() {
    function frame() {
      requestAnimationFrame(frame);
      // 座標計算（全モード共通）
      for (const individual of dragonManager.individuals) {
        for (const d of individual.individualDragon) {
          d.update(mouse, rotationMode);}}
      // 描画リスト(allDps)の再構築
      if (DragonScope.needsRebuildDPS) {
        buildDPS();
        dragonManager.buildAllDps();
        DragonScope.needsRebuildDPS = false;}
      // モードによる描画の切り替え
      if (drawMode === 1) {
          if(writeMode && !isWriting) {return;}
        // WebGPU モード
        if (dragonManager.container) {dragonManager.container.visible = true;}
        dragonManager.syncWebGPUSprites(reverseMode);
      } else {
        // 2D モード(描画重ねる)
        if (dragonManager.container) {dragonManager.container.visible = false;}
        drawAll();}}
    frame();}

  start();

