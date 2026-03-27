import { DragonScope } from './base/prop_schema.js';
import { Dragon } from './core/Dragon.js';
import { createInspectorGUI, paneSetupUI, buildDPS, rebuildDragonList, updateListHighlight } from './ui/Inspector.js';
import { ResetSaveLoad } from './ui/ResetSaveLoad.js';


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;}
window.addEventListener("resize", resizeCanvas);
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
  if (!isDraggingV){return;}
  // 右端からの距離を計算
  const newWidth = window.innerWidth - e.clientX;
  // 幅の制限（0〜500px）
  const finalWidth = Math.max(0, Math.min(500, newWidth));
  // controlsの幅を更新
  controls.style.width = finalWidth + "px";
  // リサイザー自体の位置も更新
  resizerV.style.right = finalWidth + "px";
  // 0pxなら完全に隠す
  if (finalWidth <= 0) {
    controls.style.display = "none";
  } else {
    controls.style.display = "flex";
  }

  // キャンバスのサイズを再計算（もし関数がある場合）
  if (typeof resizeCanvas === 'function') resizeCanvas();});


  // f,r,s,d キーで回転モード切替.　z keyで描写反転. m keyでmouse追従のon,off切替
let rotationMode = 0;
let drawMode = 0;
let mouseMode = 1;
window.addEventListener("keydown", e => {
const noticeMode = () => console.log("Rotation Mode:", rotationMode, "Draw Mode:", drawMode, "Mouse Mode:", mouseMode);
if (e.key === "f") {
    rotationMode = (rotationMode === 1) ? 0 : 1;
    noticeMode();}
if (e.key === "r") {
    rotationMode = (rotationMode === 2) ? 0 : 2;
    noticeMode();}
if (e.key === "s"){
    rotationMode = (rotationMode === 3) ? 0 : 3;
    noticeMode();}
if (e.key === "d"){
    rotationMode = (rotationMode === 4) ? 0 : 4;
    noticeMode();}
if (e.key === "z"){
    drawMode = (drawMode === 1) ? 0 : 1;
    noticeMode();}
if (e.key === "m") {
    mouseMode = (mouseMode === 1) ? 0 : 1;
    noticeMode();}
  });

  const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  canvas.addEventListener("mousemove", e => {
    if(!mouseMode){return;}
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

// ==============================
// 描画
// ==============================
function drawAll() {
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
    ctx.drawImage(img, -sX / 2, -sY / 2, sX, sY);
    ctx.restore();};
  if(drawMode === 0){
  for (let i = displayList.length - 1; i >= 0; i--) {
    modeDrawing(displayList[i]);}
  } else if (drawMode === 1){
    for (let i = 0; i < displayList.length-1; i++) {modeDrawing(displayList[i]);}}}


  //配列の途中から両端に向かって描画していく計算式（仮テスト用）
  // if(drawMode === 0){
  // for (let i = displayList.length - 1; i >= 0; i--) {
  //   modeDrawing(displayList[i]);}
  // } else if (drawMode === 1){
  //   for (let i = displayList.length-1 ; i >= 0 ; i--){
  //     const offset = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
  //     const index = Math.floor(displayList.length / 2) + offset;
  //     if (index >= 0 && index < displayList.length){
  //        modeDrawing(displayList[index]);}}}


// ==============================
// 初期化
// ==============================
export async function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
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

ResetSaveLoad.applyData(DragonScope.initialData);

canvas.addEventListener("dblclick", () => {
  if (DragonScope.master) {
    DragonScope.master.isBoosting = true;
  } else {
    console.warn("Master dragon not found.");}});

paneSetupUI();

if (DragonScope.dragons.length > 0) {
    DragonScope.selectedDragon = DragonScope.dragons[0];}


buildDPS();
rebuildDragonList();
updateListHighlight();
createInspectorGUI();
ResetSaveLoad.setupUI( {rebuildDragonList, buildDPS});


  loop(buildDPS, DragonScope.dragons);}

  function loop(buildDPS) {
  function frame() {
    requestAnimationFrame(frame);
    if (!DragonScope.dragons || !Array.isArray(DragonScope.dragons)) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of DragonScope.dragons) {
      if (d && typeof d.update === 'function') {
        d.update(mouse, rotationMode); }}
    if (DragonScope.needsRebuildDPS) {
      buildDPS();
      DragonScope.needsRebuildDPS = false;}
      drawAll();}
    frame(0);}

  start();