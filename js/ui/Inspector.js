import Sortable from '../../lib/sortable.esm.js';
import { PROP_SCHEMA, DragonScope } from '../base/prop_schema.js';
import { MotionStrategy } from '../core/Strategies.js';
import { Dragon } from '../core/Dragon.js';

let dragonListEl = null;

export const buildDPS = () => {
  // DragonScope.dps が未定義の場合は初期化
  DragonScope.dps = [];
  for (const d of DragonScope.dragons) {
    if (!d.parts){continue;}
    if (d.imgIndex >= DragonScope.images.length) {
        d.imgIndex = DragonScope.images.length - 1;}
    //[0]のpartsは回転が独自で他partsと揃わないので描画しない
    for (const p of d.parts.slice(1)) {
      DragonScope.dps.push({
        part: p,
        dragon: d,
        imgIndex: p.imgIndex,
      });}}};

// 選択状態を視覚的に更新する補助関数
export function updateListHighlight() {
    if (!dragonListEl) return;
    Array.from(dragonListEl.children).forEach((li, i) => {
        const isSelected = (DragonScope.dragons[i] === DragonScope.selectedDragon);
        li.style.borderColor = isSelected ? "#2a8" : "#444";
        li.style.background = isSelected ? "#242" : "#222";});}

export function rebuildDragonList() {
  if(!dragonListEl) return;
  dragonListEl.innerHTML = '';
  DragonScope.dragons.forEach((dragon, index) => {
    const li = document.createElement('li');
    li.textContent = `${index}: ${dragon.name ?? "Unnamed"}  【${dragon.numParts} parts】`;
    li.style = "padding:4px; margin:2px; background:#222; cursor:grab; border:1px solid #444;";
    // 選択中の個体を目立たせる
    if (DragonScope.selectedDragon === dragon) {
      li.style.borderColor = "#2a8";
      li.style.background = "#242";}
    dragonListEl.appendChild(li);
  });}



 export function paneSetupUI() {
const dragonInputWrapper = document.createElement("div");
dragonInputWrapper.style.marginBottom = "3px";
const dragonInputLabel = document.createElement("div");
dragonInputLabel.textContent = "New Dragon Name";
dragonInputLabel.style.marginBottom = "0px";
const dragonInput = document.createElement("input");
dragonInput.type = "text";
dragonInput.style.width = "95%";
const dragonAddBtn = document.createElement("button");
dragonAddBtn.textContent = "Update / Add";
dragonAddBtn.style.width = "80%";
dragonAddBtn.style.marginTop = "3px";
dragonInputWrapper.appendChild(dragonInputLabel);
dragonInputWrapper.appendChild(dragonInput);
dragonInputWrapper.appendChild(dragonAddBtn);
  const controls = document.getElementById("controls");
  controls.innerHTML = ''; // 重複防止のためクリア
  // --- A. 上部コンテナ（リスト・入力・名前） ---
  const topContainer = document.createElement('div');
  topContainer.id = "inspector-top-container";
  topContainer.style.cssText = "flex: 0 0 250px; overflow-y:auto; display:flex; flex-direction:column; background:#111; min-height:0;";
  controls.appendChild(topContainer);
  // 1. Dragon List の追加
  dragonListEl = document.createElement('ol');
  dragonListEl.id = "DragonScope.dragons";
  dragonListEl.style.cssText = "margin: 0; padding: 0; list-style: none;";
  topContainer.appendChild(dragonListEl);
  // 2. New Dragon Input の追加
  topContainer.appendChild(dragonInputWrapper);
  // --- B. 上下リサイザー（横線） ---
  const splitResizer = document.createElement('div');
  splitResizer.style.cssText = "height:8px; cursor:ns-resize; background:#444; border-top:1px solid #555; border-bottom:1px solid #222; flex-shrink:0;";
  controls.appendChild(splitResizer);
  // --- C. 下部コンテナ（パラメータ） ---
  const contentArea = document.createElement('div');
  contentArea.id = 'inspector-content';
  contentArea.style.cssText = "flex: 1 1 auto; overflow-y:auto; padding:5px;";
  controls.appendChild(contentArea);
  // --- 上下リサイズ処理 ---
  splitResizer.onmousedown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = topContainer.offsetHeight;
    const onMouseMove = (e) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(0, startHeight + deltaY);
      topContainer.style.flex = `0 0 ${newHeight}px`;
      topContainer.style.display = newHeight === 0 ? 'none' : 'flex';};
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);};
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);};
  dragonListEl.addEventListener("click", e => {
    sortableFunc(e);});
  dragonAddBtn.addEventListener("click", () => {
    updateAdd(dragonInput);});
  DragonScope.master = DragonScope.dragons.find(d => d.name === "Master");}


function sortableFunc(e){
    const li = e.target.closest("li");
    if(!li){return;}
    const idx = Array.from(dragonListEl.children).indexOf(li);
    DragonScope.selectedDragon = DragonScope.dragons[idx];
    updateListHighlight();
    createInspectorGUI();
  new Sortable(dragonListEl, {
    animation: 150,
    onEnd: (evt) => {
      const movedItem = DragonScope.dragons.splice(evt.oldIndex, 1)[0];
      DragonScope.dragons.splice(evt.newIndex, 0, movedItem);
      rebuildDragonList();
      DragonScope.needsRebuildDPS = true;}});}


function updateAdd(dragonInput){
  let d = DragonScope.selectedDragon;
  //---replaceImage---
  const imgInput = document.querySelector('.inspector-image-input');
  const newImgIndex = imgInput ? parseInt(imgInput.value, 10) : 0;
  d.imgIndex = newImgIndex;
  if (d) {
  d.imgIndex = newImgIndex;
  d.parts.forEach(p => p.imgIndex = newImgIndex);
  DragonScope.storage[d.id].current["_imgIndex"] = newImgIndex;}
  // ---follow---
  const inspector = document.getElementById('controls');
  const idInput = inspector.querySelector('.inspector-input[data-key="followId"]');
  const idxInput = inspector.querySelector('.inspector-input[data-key="followIndex"]');
  const valId = idInput.value.trim();
  const valIdx = parseInt(idxInput.value, 10);
  const found = DragonScope.dragons.find(d => d.name === valId);
    if(found && !isNaN(valIdx)){
  d.followId = found ?? valId;
  d.followIndex = valIdx;
  DragonScope.storage[d.id].current["followId"] = found ?? valId;
  DragonScope.storage[d.id].current["followIndex"] = valIdx;}
//========================================================================================
  let tentativeName = null;
  let counter = 1;
    //---reName---
  const nameInput = document.querySelector('.inspector-name-input');
  let reName = nameInput ? nameInput.value.trim() : "";
  if (d && reName && d.name !== reName) {
    tentativeName = reName;
    while(DragonScope.dragons.some(target => target !== d && target.name === reName)){
      reName = `${tentativeName}${counter}`;
      counter++;}
  const oldName = d.name;
  d.name = reName;
    DragonScope.storage[d.id].current["name"] = reName;
  DragonScope.dragons.forEach(d => {
    if (d.followId && (d.followId.name === oldName || d.followId === oldName)) {
        d.followId = d;
        DragonScope.storage[d.id].current["followId"] = d;
      }});}
    //---new Dragon--
  let newDragonName = dragonInput.value.trim();
      if (newDragonName) {
        tentativeName = newDragonName;
    while(DragonScope.dragons.some(target => target.name === newDragonName)){
      newDragonName = `${tentativeName}${counter}`;
      counter++;}
        const lastDragon = DragonScope.dragons[DragonScope.dragons.length - 1];
        const lastIdx = lastDragon.parts.length - 1;
    const newDragon = new Dragon({
      meta:{
      name: newDragonName,
      _imgIndex: 0,
      followId: lastDragon,
      followIndex: lastIdx,
      }});
    DragonScope.dragons.push(newDragon);
    DragonScope.selectedDragon = newDragon;
    console.log("New dragon added:", newDragon.name);}
//---update---
  d.parts.forEach(p => {
    p.vx = 0;
    p.vy = 0;
    p.oldX = p.x;
    p.oldY = p.y;});

  rebuildDragonList();
  buildDPS();
  updateListHighlight();
  createInspectorGUI();
  dragonInput.value = "";
}



  //======================================================================================================

    //=================================
    //---コントロールペイン---
    //=================================
  export const createInspectorGUI = () => {
  const topContainer = document.getElementById('inspector-top-container');
  const contentArea = document.getElementById('inspector-content');
    if (!topContainer || !contentArea){return;}
  // --- 前回のタイトルのみを削除 ---
  const oldTitle = document.getElementById('inspector-current-title');
  if (oldTitle){oldTitle.remove();}
  // --- 下部パラメータエリアのみをクリア ---
  contentArea.innerHTML = '';
  if (!DragonScope.selectedDragon){return;}
  // --- D. 「Editing: 名前」を上部エリアの末尾に追加（固定表示） ---
  const title = document.createElement('div');
  title.id = 'inspector-current-title';
  title.innerText = `Editing: ${DragonScope.selectedDragon.name || "Unnamed"}`;
  title.style = "font-size:12px;  font-weight:bold ;color:#908; padding:0px; background:#990;\
                  margin-top:auto; position:sticky; bottom:0; z-index:10;";
  contentArea.appendChild(title);

  // --- パラメータ構築ループ ---
    for (const groupKey in PROP_SCHEMA) {
    if(groupKey === 'id') {continue;};
    const groupWrapper = document.createElement('div');
    groupWrapper.style = "margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.03);\
                          border-radius:3px; border:1px solid rgba(255,255,255,0.05);";
    const groupTitle = document.createElement('div');
    groupTitle.style = "font-weight:bold; margin-bottom:5px; border-bottom:1px solid #555; color:#ddd; font-size:10px;";
    groupTitle.innerText = groupKey.toUpperCase();
    groupWrapper.appendChild(groupTitle);
    const params = PROP_SCHEMA[groupKey];
    const contentWrapper = document.createElement('div');

    // // タイトルクリックでcontentWrapperの表示切替
    // 状態維持のためIDを付与（開閉状態の管理用）
    contentWrapper.id = `content-${groupKey}`;
    // 初期状態は一律で非表示、または現在のスタイルを維持
    contentWrapper.style.display = DragonScope.groupVisibility?.[groupKey] || 'block';
    groupTitle.onclick = () => {
      const isHidden = contentWrapper.style.display === 'none';
      const nextDisplay = isHidden ? 'block' : 'none';
      contentWrapper.style.display = nextDisplay;
      // グローバルスコープ等に状態を保存し、パート切り替え後も引き継ぐ
      if(!DragonScope.groupVisibility)
        {DragonScope.groupVisibility = {};}
      DragonScope.groupVisibility[groupKey] = nextDisplay;
    };

    for (const key in params) {
      const config = params[key];
      const label = document.createElement('label');
      const input = document.createElement('input');
      const itemRow = document.createElement('div');
      itemRow.style = "margin: 4px 0; display: flex; flex-direction: column;";

      const isLockedGroup = (DragonScope.selectedDragon.name === "Master" && ['scaleFunc', 'breath', 'branch'].includes(groupKey)) ||
      (DragonScope.selectedDragon.name !== "Master" && ['whole', 'masterMove'].includes(groupKey));
      const isLockedKey = ((DragonScope.selectedDragon.name === "Master" &&
groupKey === 'basic' && ['scaleX', 'scaleY', 'offsetX', 'offsetY', 'numParts',].includes(key)) ||
      (DragonScope.selectedDragon.name === "Master" && groupKey === 'meta' && ['name', 'followId', 'followIndex',].includes(key)));
      const isLocked = isLockedGroup || isLockedKey;
      function lockedProperty(isLocked){
                    if (isLocked) {
                    itemRow.style.opacity = "0.2";
                    itemRow.style.pointerEvents = "none";
                    itemRow.style.filter = "grayscale(100%)";
                    input.disabled = true;
                    input.style.cursor = "not-allowed";
                    input.style.background = "#111";
                    input.style.color = "#eee";
                  }};

      // configが"flag"の場合はgroupWrapper（タイトル直下）に、それ以外はcontentWrapperに追加
      if (config[0] === "flag") {
        groupWrapper.appendChild(itemRow);
      } else {
        contentWrapper.appendChild(itemRow);
      }

      // --- 1. テキスト入力 (name等) ---
      if (config[0] === "text") {
        label.innerText = "reName (Input Text)";
        label.style = "font-size: 10px; color: #666;";
        input.type = "text";
        input.value = DragonScope.selectedDragon[key] ?? "";
        input.style = "background:#111; color:#eee; border:1px solid #333; font-size:10px;";
        input.className = "inspector-name-input";
        lockedProperty(isLocked);
        itemRow.appendChild(label);
        itemRow.appendChild(input);
        contentWrapper.appendChild(itemRow);}

      // --- 2. 画像・数値入力 (img等) ---
      else if (config[0] === "image") {
        label.innerText = "replaceImage (Select number)";
        label.style = "font-size: 10px; color: #666;";
        input.type = "number";
        input.value = DragonScope.selectedDragon[key] ?? 0;
        input.min = 0;
        input.max = DragonScope.images.length - 1;
        input.style = "background:#111; color:#eee; border:1px solid #333; font-size:10px;";
        input.className = "inspector-image-input";
        const controls = document.createElement("div");
        controls.style = "display: flex; align-items: center; gap: 0px;";
        const countDisplay = document.createElement("span");
        countDisplay.innerText = ` / 0 ~ ${DragonScope.images.length-1}`;
        countDisplay.style = "font-size:10px; color:#666; margin-left:2px;";
        // --- LIST/EDITボタン: ドラッグ、矢印、削除、アップロードをこのボタン内に集約 ---
        const listBtn = document.createElement("button");
        listBtn.innerText = "LIST/EDIT";
        listBtn.style = "margin-left:4px; padding:0 4px; background:#444; color:#eee; border:none; cursor:pointer; font-size:10px;";
        listBtn.onclick = () => {
          // モーダル外枠の作成
          const modal = document.createElement("div");
          modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center;";
          const content = document.createElement("div");
          content.style = "background:#222; padding:20px; border-radius:8px; width:80%; max-height:80%; overflow-y:auto; border:1px solid #444;";
          let draggedIdx = null; // ドラッグ中の要素インデックス保持用
          // リスト再描画用関数
          const renderList = () => {
            content.innerHTML = "";
            const header = document.createElement("div");
            header.style = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;";
            header.innerHTML = "<h3 style='color:#eee; margin:0;'>Image List / Edit (Drag or Arrows)</h3>";
            // モーダル内専用UPLOADボタン
            const innerUploadBtn = document.createElement("button");
            innerUploadBtn.innerText = "UPLOAD";
            innerUploadBtn.style = "padding:4px 8px; background:#159; color:#fff; border:none; cursor:pointer; font-size:10px;";
            innerUploadBtn.onclick = () => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/*';
              fileInput.multiple = true;
              fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0){return;}
                let url;
                try {
                  const newImages = await Promise.all(files.map(async (file) => {
                    url = URL.createObjectURL(file);
                    const { loadImage } = await import('../main.js');
                    const img = await loadImage(url);
                    return img;
                  }));
                  DragonScope.images.push(...newImages);
                  updateUI();
                  renderList();
                } catch (err) {
                  console.error("Upload failed", err);
                }
                
                // finally {
                //   setTimeout(() => {
                //   URL.revokeObjectURL(url);    //TODO revokeを数秒後に修正する
                // }, 3000);}
            };
              fileInput.click();};
            header.appendChild(innerUploadBtn);
            content.appendChild(header);
            const grid = document.createElement("div");
            grid.style = "display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:10px;";
            DragonScope.images.forEach((img, idx) => {
              const item = document.createElement("div");
              item.style = "background:#333; padding:5px; text-align:center; border:1px solid #555; cursor:grab;";
              item.draggable = true;
              // --- ドラッグ＆ドロップ制御 ---
              item.ondragstart = () => { draggedIdx = idx; item.style.opacity = "0.5"; };
              item.ondragend = () => { item.style.opacity = "1"; };
              item.ondragover = (e) => e.preventDefault();
              item.ondrop = (e) => {
                e.preventDefault();
                if (draggedIdx === null || draggedIdx === idx){return;}
                const targetImg = DragonScope.images.splice(draggedIdx, 1)[0];
                DragonScope.images.splice(idx, 0, targetImg);
                renderList();};
              const preview = img.cloneNode();
              preview.style = "width:60px; height:60px; object-fit:contain; background:#000; pointer-events:none;";
              // --- 矢印ボタンによる並べ替え制御 ---
              const arrowStyle = "font-size:10px; cursor:pointer; background:#555; color:#fff; border:none; padding:2px 6px; margin:0 2px;";
              const prevBtn = document.createElement("button");
              prevBtn.innerText = "←";
              prevBtn.style = arrowStyle;
              prevBtn.onclick = (e) => {
                e.stopPropagation();
                if(idx > 0) {
                  [DragonScope.images[idx], DragonScope.images[idx-1]] = [DragonScope.images[idx-1], DragonScope.images[idx]];
                  renderList();}};
              const nextBtn = document.createElement("button");
              nextBtn.innerText = "→";
              nextBtn.style = arrowStyle;
              nextBtn.onclick = (e) => {
                e.stopPropagation();
                if(idx < DragonScope.images.length - 1) {
                  [DragonScope.images[idx], DragonScope.images[idx+1]] = [DragonScope.images[idx+1], DragonScope.images[idx]];
                  renderList();}};
              // --- 削除ボタン制御（確認メッセージと範囲外インデックスの末尾吸着） ---
              const delBtn = document.createElement("button");
              delBtn.innerText = "DEL";
              delBtn.style = "font-size:9px; margin-top:5px; cursor:pointer; background:#822; color:#fff; border:none; padding:2px 4px; width:100%;";
              delBtn.onclick = (e) => {
                e.stopPropagation();
                if(DragonScope.images.length <= 1){
                  return alert("Cannot delete last image.");}
                if (!confirm(`Delete image [index: ${idx}]?`)){return;}
                if (DragonScope.images[idx]?.src?.startsWith('blob:')) {
                  URL.revokeObjectURL(DragonScope.images[idx].src);}
                DragonScope.images.splice(idx, 1);
                // 参照範囲外になったパートのみ、配列の新しい末尾を適用
                DragonScope.dragons.forEach(d => {
                  if (d[key] >= DragonScope.images.length) {
                    d[key] = DragonScope.images.length - 1;
                    d.rebuild();
                    DragonScope.needsRebuildDPS = true;}});


                updateUI();
                renderList();};
              item.appendChild(preview);
              const info = document.createElement("div");
              info.innerText = `idx:${idx}`;
              info.style = "font-size:9px; color:#aaa; margin:2px 0;";
              item.appendChild(info);
              const moveContainer = document.createElement("div");
              moveContainer.style = "display:flex; justify-content:center; margin-bottom:2px;";
              moveContainer.appendChild(prevBtn);
              moveContainer.appendChild(nextBtn);
              item.appendChild(moveContainer);
              item.appendChild(delBtn);
              grid.appendChild(item);});
            content.appendChild(grid);
            const closeBtn = document.createElement("button");
            closeBtn.innerText = "CLOSE";
            closeBtn.style = "margin-top:20px; width:100%; padding:8px; background:#444; color:#fff; border:none; cursor:pointer;";
            closeBtn.onclick = () => document.body.removeChild(modal);
            content.appendChild(closeBtn);};
          // インスペクター上の数値を最新の状態に更新する関数
          const updateUI = () => {
            input.max = DragonScope.images.length - 1;
            input.value = DragonScope.selectedDragon[key] ?? 0;
            countDisplay.innerText = ` / 0 ~ ${DragonScope.images.length-1}`;};
          renderList();
          modal.appendChild(content);
          document.body.appendChild(modal);};
        lockedProperty(isLocked);
        itemRow.appendChild(label);
        controls.appendChild(input);
        controls.appendChild(countDisplay);
        // ペイン上の元のUPLOADは削除し、新設したLIST/EDITボタンのみを配置
        controls.appendChild(listBtn);
        itemRow.appendChild(controls);
        contentWrapper.appendChild(itemRow);}

      // --- 3. followId入力 ---
    else if (config[0] === "referenceId" || config[0] === "referenceIndex"){
    const groupLabel = document.createElement('div');
    groupLabel.innerText = key;
    groupLabel.style = "font-size: 9px; color: #444; width: 5px; flex-shrink: 10; min-width: 5px; display: inline-block;";
    itemRow.appendChild(groupLabel);
    const row = document.createElement('div');
    row.style = "display: flex; align-items: center; gap: 0px; margin-left: 50px; margin-bottom: 0px;";
const input = document.createElement('input');
input.type = (config[0] === "referenceId") ? "text" : "number";
input.dataset.key = key;
input.className = "inspector-input";
input.style = "background: #111; color: #eee; border: 1px solid #333; font-size: 10px;";
const rawVal = DragonScope.selectedDragon[key];
const currentVal = (rawVal?.name ?? rawVal) ?? null;
input.value = currentVal;
input.min = 0;
const targetDragon = DragonScope.selectedDragon.followId;
  if (config[0] === "referenceIndex") {
    input.max = (targetDragon && targetDragon.numParts) ? targetDragon.numParts - 1 : null;}
    lockedProperty(isLocked);
    row.appendChild(input);
    itemRow.appendChild(row);
    contentWrapper.appendChild(itemRow);}

      // --- 4. フラグ項目 (ON/OFF) ---
      else if (config[0] === "flag"){
        label.innerText = key;
        label.style = "font-size: 9px; color: #aaa; margin-bottom:2px;";
        itemRow.appendChild(label);
        const btn = document.createElement('button');
        const updateBtn = (val) => {
          btn.innerText = val ? "ON" : "OFF";
          btn.style = `padding:3px; font-size:10px; cursor:pointer; background:${val ? '#2a8' : '#822'};
                      color:#fff; border:none; border-radius:2px; font-weight:bold;`;
          let targetOpacity = val ? "1.0" : "0.2";
          let targetPointer = val ? "auto" : "none";
          let targetFilter = val ? "none" : "grayscale(100%)";
          if (isLocked) {
              btn.style = `padding:3px; font-size:10px; cursor:default; background:#322; opacity:0.1;
                          color:#fff; border:none; border-radius:2px; font-weight:bold;opacity:0.4;`;
              btn.style.pointerEvents = "none";
              targetOpacity = "1";
              targetPointer = "none";
              targetFilter = "grayscale(100%)";
            }
              contentWrapper.style.opacity = targetOpacity;
              contentWrapper.style.pointerEvents = targetPointer;
              contentWrapper.style.filter = targetFilter;
          };
        updateBtn(!!DragonScope.selectedDragon[key]);
        btn.onclick = () => {
          const newVal = !DragonScope.selectedDragon[key];
          DragonScope.selectedDragon[key] = newVal ? 1 : 0;
          updateBtn(newVal);
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = newVal;
          if (["flagBranch"].includes(key)) {
            MotionStrategy();
            DragonScope.selectedDragon.rebuild();
            DragonScope.needsRebuildDPS = true;
          }};
        itemRow.appendChild(btn);
        groupWrapper.insertBefore(itemRow, groupTitle.nextSibling);
      }
      // --- 5. セレクトボックス ---
      else if (config[0] === "select") {
        label.innerText = key;
        label.style = "font-size: 10px; color: #666;";
        itemRow.appendChild(label);
        const select = document.createElement('select');
        select.style = "background:#111; color:#eee; border:1px solid #333; font-size:10px; padding:2px;";
        const defIdx = config.length-1;
          for(let i =1; i <= defIdx; i++){
          const o = document.createElement('option');
          o.value = config[i];
          o.innerText = config[i];
          select.appendChild(o);};
        select.value = DragonScope.selectedDragon[key] ?? config[defIdx];
        select.onchange = (e) => {
          DragonScope.selectedDragon[key] = e.target.value;
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = e.target.value;
        };
        itemRow.appendChild(select);
        lockedProperty(isLocked);
        contentWrapper.appendChild(itemRow);
      }
      // --- 6. 数値スライダー ---
      else if (typeof config[0] === "number"){
        const defInd = config.length-1;
        label.innerText = key;
        label.style = "font-size: 10px; color: #666;";
        itemRow.appendChild(label);
        lockedProperty(isLocked);
        const row = document.createElement('div');
        row.style = "display:flex; align-items:center; gap:5px;";
        const slider = document.createElement('input');
        slider.type = "range";
        slider.min = config[0];
        slider.max = config[1];
        const baseStep = config[2] ?? F_1;
        slider.step = baseStep;
        slider.style = "flex:1; height:5px; margin-right: 0px;";
        const valDisp = document.createElement('span');
        valDisp.style = "font-size:10px; color:#fff; min-width:25px; text-align:right;";
        const currentVal = DragonScope.selectedDragon[key] ?? config[defInd];
        slider.value = currentVal;
        valDisp.innerText = currentVal;

        // キーボード操作ロジック
        slider.addEventListener('keydown', e => {
          let v = parseFloat(slider.value);
          let changed = false;
          if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")){
              e.preventDefault(); v += baseStep * (e.key === "ArrowUp" ? 100 : -100); changed = true;
            } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")){
              e.preventDefault(); v += baseStep * (e.key === "ArrowRight" ? 1 : -1); changed = true;
            } else if (!e.shiftKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)){
              e.preventDefault(); v += baseStep * (["ArrowUp", "ArrowRight"].includes(e.key) ? 10 : -10); changed = true; }
          if (changed) {
            v = Math.max(config[0], Math.min(config[1], v));
            const stepDec = baseStep.toString().includes('.') ? baseStep.toString().split('.')[1].length : 0;
            const finalV = parseFloat(v.toFixed(stepDec + 1));
            slider.value = finalV;
            valDisp.innerText = finalV;
            DragonScope.selectedDragon[key] = finalV;
            slider.dispatchEvent(new Event('input'));
            DragonScope.storage[DragonScope.selectedDragon.id].current[key] = finalV;
          }});

        slider.oninput = (e) => {
          const v = parseFloat(e.target.value);
          valDisp.innerText = v;
          DragonScope.selectedDragon[key] = v;
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = v;
          if (["numParts"].includes(key)) {
            DragonScope.selectedDragon.rebuild();
            rebuildDragonList();
            DragonScope.needsRebuildDPS = true;
          }};

        row.appendChild(slider);
        row.appendChild(valDisp);
        itemRow.appendChild(row);
        contentWrapper.appendChild(itemRow);
}}
        groupWrapper.appendChild(contentWrapper);
        contentArea.appendChild(groupWrapper);
}};


