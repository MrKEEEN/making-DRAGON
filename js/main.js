import { DragonScope } from './base/prop_schema.js';
import { dragonManager } from './core/DragonManager.js';
import { paneSetupUI, buildDPS } from './ui/Inspector.js';
import { ResetSaveLoad } from './ui/ResetSaveLoad.js';

//TODO 画面の画像を右クリックメニューで保存するとページが勝手にリロードされる。jsのコードではなくブラウザの機能だが、要修正。画像保存は必要。

const canvas = document.getElementById("canvas");

let rgb = { r: 0, g: 0, b: 0 };
const changeBackgroundColor = () => {
      canvas.style.setProperty('--bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);};
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

const ctx = canvas.getContext("2d");
const resizerV = document.getElementById("resizer_v");
const maxPaneWidth = 500;

  function resizeCanvas() {
  const dpr = window.devicePixelRatio ?? 1;
  // 物理ピクセルサイズを設定（解像度）
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  // CSS上の見た目（論理ピクセル）を固定
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  // 描画コンテキストのスケーリング（既存の描画ロジックを維持するため）
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);}

window.addEventListener("resize", () => {
  if(!clearMode){return;}
  resizeCanvas()
});
resizeCanvas();

let isDraggingV = false;
resizerV.addEventListener("mousedown", () => {
  isDraggingV = true;
  document.body.style.cursor = "ew-resize";});
window.addEventListener("mouseup", () => {
  isDraggingV = false;
  document.body.style.cursor = "default";});

window.addEventListener("mousemove", (e) => {
  if (!isDraggingV || !clearMode) { return; }
  // 1. CSS変数から現在のズーム倍率を取得
  const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom-ratio')) ?? 1;
  const newWidth = window.innerWidth - e.clientX;
  // 3. ブラウザの拡大縮小に適応するための処理込み
  const finalWidth = Math.max(0, Math.min(maxPaneWidth / zoom, newWidth));

  document.documentElement.style.setProperty('--pane-width', finalWidth * zoom);
  resizeCanvas();});

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
    } else {
        clearMode = 1;
        resizeCanvas();}}
    noticeMode();});

let isWriting = false;
canvas.addEventListener("mousedown", (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (writeMode) isWriting = true;});
window.addEventListener("mouseup", () => {
  isWriting = false;});
window.addEventListener("mouseleave", () => {
  isWriting = false;});
const mouse = { x: canvas.width/2, y: canvas.height/2 };
canvas.addEventListener("mousemove", e => {
    if(!mouseMode){return;}
    mouse.x = e.clientX;
    mouse.y = e.clientY;});
canvas.addEventListener("dblclick", () => {
    DragonScope.master.isBoosting = true;});


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
    const sX = part.scaleX ?? 30;
    const sY = part.scaleY ?? 30;
    ctx.drawImage(img, -sX/2, -sY/2, sX, sY);
    ctx.restore();};
  if(reverseMode === 0){
  for (let i = displayList.length - 1; i >= 0; i--) {
    modeDrawing(displayList[i]);}
  } else if (reverseMode === 1){
    for (let i = 0; i < displayList.length-1; i++) {
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

const sampleUrls = DragonScope.initialData;
if(sampleUrls.length > 1){
  rgb.r = 255;
  canvas.style.setProperty('--bg-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
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
                meta: { name: "Master", _imgIndex: 5, followId: null, followIndex: null },
                basic: { numParts: 1 }});
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

  loop();
}

  function loop() {
  function frame() {
    requestAnimationFrame(frame);
    if(clearMode){ ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    for (const individual of dragonManager.individuals) {
    for (const d of individual.individualDragon) {
        d.update(mouse, rotationMode);}}
    if (DragonScope.needsRebuildDPS) {
      buildDPS();
      dragonManager.buildAllDps();
      DragonScope.needsRebuildDPS = false;}
      drawAll();}
    frame(0);}

  start();

