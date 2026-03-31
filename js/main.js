import { DragonScope } from './base/prop_schema.js';
import { createInspectorGUI, paneSetupUI, buildDPS, rebuildDragonList, updateListHighlight } from './ui/Inspector.js';
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
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;}
window.addEventListener("resize", () => {
  if(!clearMode){return;}
  resizeCanvas()});
resizeCanvas();


const resizerV = document.getElementById("resizer_v");
const controls = document.getElementById("controls");

let isDraggingV = false;
resizerV.addEventListener("mousedown", () => {
  isDraggingV = true;
  document.body.style.cursor = "ew-resize";
});

window.addEventListener("mouseup", () => {
  isDraggingV = false;
  document.body.style.cursor = "default";
});
window.addEventListener("mousemove", (e) => {
  if (!isDraggingV || !clearMode){return;}
  const newWidth = window.innerWidth - e.clientX;
  // 幅の制限（0〜500px）
  const finalWidth = Math.max(0, Math.min(500, newWidth));
  controls.style.width = finalWidth + "px";
  resizerV.style.right = finalWidth + "px";
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
  if (writeMode) isWriting = true;
});
window.addEventListener("mouseup", () => {
  isWriting = false;
});
window.addEventListener("mouseleave", () => {
  isWriting = false;
});

  const mouse = { x: canvas.width/2, y: canvas.height/2 };
  canvas.addEventListener("mousemove", e => {
    if(!mouseMode){return;}
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

// ==============================
// 描画
// ==============================
function drawAll() {
  if(writeMode && !isWriting){return;}
  const displayList = DragonScope.dps ?? [];
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

//Master用のjsonファイルの読み込み。load処理と同等のものを実装している。ファイルのパスはapp.js内のSAMPLESオブジェクトで定義されている。
ResetSaveLoad.applyData(DragonScope.initialData);
//ペインのセットアップ
paneSetupUI();
//描画用のパーツ配列作成
buildDPS();
//ペインのリスト作成
rebuildDragonList();
//リストの選択パートのハイライト
updateListHighlight();
//ペイン内のプロパティ類の編集エリア構築
createInspectorGUI();
//ペイン内のResetSaveLoad＋deleteのセット
ResetSaveLoad.setupUI();


  loop(buildDPS, DragonScope.dragons);}

  function loop(buildDPS) {
  function frame() {
    requestAnimationFrame(frame);
    if(clearMode){ ctx.clearRect(0, 0, canvas.width, canvas.height); }
    for (const d of DragonScope.dragons) {
        d.update(mouse, rotationMode);}
    if (DragonScope.needsRebuildDPS) {
      buildDPS();
      DragonScope.needsRebuildDPS = false;}
      drawAll();}
    frame(0);}

  start();