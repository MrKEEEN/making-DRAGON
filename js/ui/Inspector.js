import Sortable from '../../lib/sortable.esm.js';
import { MotionStrategy } from '../core/Strategies.js';
import { Dragon } from '../core/Dragon.js';
import { PROP_SCHEMA, DragonScope } from '../base/prop_schema.js';
import { showToast } from '../base/MathUtils.js';

export { buildDPS, updateListHighlight, rebuildDragonList, paneSetupUI, createInspectorGUI };


let dragonListEl = null;

const buildDPS = () => {
  DragonScope.dps = [];
  for (const d of DragonScope.dragons) {
    if (!d.parts){continue;}
    if (d.imgIndex >= DragonScope.images.length) {
        d.imgIndex = DragonScope.images.length - 1;}
    //[0]のpartsは回転が独自で他partsと揃わないので描画しない
    for (const p of d.parts.slice(1)) {
      DragonScope.dps.push({ part:p, dragon:d, imgIndex:p.imgIndex,});}}};

const rebuildDragonList = () => {
  if(!dragonListEl){return;}
  dragonListEl.innerHTML = '';
  DragonScope.dragons.forEach((dragon, i) => {
    const dragonsLi = document.createElement('li');
    dragonsLi.className = "dragon-list-item";
    dragonsLi.textContent = `${i}: ${dragon.name ?? "Unnamed"} 【${dragon.numParts} parts】`;
    // 選択中の個体を目立たせる
    if (DragonScope.selectedDragon === dragon) {
      dragonsLi.style.borderColor = "#2a8";
      dragonsLi.style.background = "#242";}
    dragonListEl.appendChild(dragonsLi);});}


// 選択状態を視覚的に更新する補助関数
const updateListHighlight = () => {
    if (!dragonListEl){return;}
    Array.from(dragonListEl.children).forEach((listEl, i) => {
      const isSelected = (DragonScope.dragons[i] === DragonScope.selectedDragon);
      listEl.style.borderColor = isSelected ? "#2a8" : "#444";
      listEl.style.background = isSelected ? "#242" : "#222";});}


// ============================================================
//   ペイン初期セットアップ
// ============================================================
const paneSetupUI = () => {
const dragonInput = document.getElementById("dragonInput");
const updateAddBtn = document.getElementById("updateAddBtn");
const topContainer = document.getElementById('inspector-top-container');
// 1. Dragon List の追加
dragonListEl = document.createElement("ol");
dragonListEl.id = "DragonScope.dragons";
dragonListEl.style.cssText = "margin: 0; padding: 0; list-style: none;";
topContainer.prepend(dragonListEl);

// --- 操作方法テキスト入力 ---
fetch('manual.txt')
        .then(res => res.text())
        .then(text => {
            // 読み込み完了後にここが実行される（コンマ数秒後）
            document.getElementById('manual-display').innerText = text;
        });

// --- 上下リサイズ処理 ---
  const splitResizer = document.getElementById('splitResizer');
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
// --- sortable(ライブラリ)初期化 ---
new Sortable(dragonListEl, {
  animation: 150,
  onEnd: (evt) => {
    const movedItem = DragonScope.dragons.splice(evt.oldIndex, 1)[0];
    DragonScope.dragons.splice(evt.newIndex, 0, movedItem);
    rebuildDragonList();
    DragonScope.needsRebuildDPS = true;}});

  dragonListEl.addEventListener("click", e => {
    sortableFunc(e);});
  updateAddBtn.addEventListener("click", () => {
    updateAdd(dragonInput);});
  DragonScope.master = DragonScope.dragons.find(d => d.name === "Master");}

// ============================================================
//   sortable関数
// ============================================================
  function sortableFunc(e){
    const li = e.target.closest("li");
    if(!li){return;}
    const idx = Array.from(dragonListEl.children).indexOf(li);
    DragonScope.selectedDragon = DragonScope.dragons[idx];
    updateListHighlight();
    createInspectorGUI(DragonScope.individualCurrentIndex);}

// ============================================================
//   updateAdd関数
// ============================================================
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
  const idInput = inspector.querySelector('.inspector-follow-input[data-key="followId"]');
  const idxInput = inspector.querySelector('.inspector-follow-input[data-key="followIndex"]');
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
    showToast(`New dragon added: ${newDragon.name}`);}
//---update---
  d.parts.forEach(p => {
    p.vx = 0;
    p.vy = 0;
    p.oldX = p.x;
    p.oldY = p.y;});

  rebuildDragonList();
  buildDPS();
  DragonScope.needsRebuildDPS = true;
  updateListHighlight();
  createInspectorGUI(DragonScope.individualCurrentIndex);
  dragonInput.value = "";
}

//======================================================================================================
//=================================
//---コントロールペイン---
//=================================
// const createInspectorGUI = (uiContainer, individualDragon) => {
//   const topContainer = document.getElementById('inspector-top-container');
//   const contentArea = document.getElementById('inspector-content');
//   if (!topContainer || !contentArea){return;}


const createInspectorGUI = (containerIdIndex) => {
  const topContainer = document.getElementById('inspector-top-container');
  const contentAreaWrapper = document.getElementById('inspector-content');

  const contentArea = document.getElementById(`inspector-container-${containerIdIndex}`);
  if (!topContainer || !contentAreaWrapper || !contentArea){return;}

// --- 下部パラメータエリアのみをクリア ---
  contentArea.innerHTML = '';
  if (!DragonScope.selectedDragon){return;}
  // --- D. 「Editing: 名前」を上部エリアの末尾に追加（固定表示） ---
    const splitResizer = document.getElementById('splitResizer');
    splitResizer.innerText = `Editing: ${DragonScope.selectedDragon.name || "Unnamed"}`;
  // ------------------- groupKeyの処理 -------------------
    for (const groupKey in PROP_SCHEMA) {
    if(groupKey === 'id') {continue;};
    const groupWrapper = document.createElement('div');
    groupWrapper.className = "prop-group-wrapper";
    const groupTitle = document.createElement('div');
    groupTitle.className = "prop-group-title";
    groupTitle.innerText = groupKey.toUpperCase();
    groupWrapper.appendChild(groupTitle);
    const params = PROP_SCHEMA[groupKey];
    const contentWrapper = document.createElement('div');
    // タイトルクリックでcontentWrapperの表示切替_状態維持のためIDを付与（開閉状態の管理用）
    contentWrapper.id = `content-${groupKey}`;
    // 初期状態は一律で非表示、または現在のスタイルを維持
    contentWrapper.style.display = DragonScope.groupVisibility?.[groupKey] ?? 'none';
    groupTitle.onclick = () => {
      const isHidden = contentWrapper.style.display === 'none';
      const nextDisplay = isHidden ? 'block' : 'none';
      contentWrapper.style.display = nextDisplay;
    // グローバルスコープ等に状態を保存し、パート切り替え後も引き継ぐ
      if(!DragonScope.groupVisibility)
        {DragonScope.groupVisibility = {};}
      DragonScope.groupVisibility[groupKey] = nextDisplay;};
    // ------------------- groupKeyの下階層の各keyの処理 -------------------
    for (const key in params) {
      const config = params[key];
      const label = document.createElement('label');
      label.className = "inspector-label";
      const input = document.createElement('input');
      input.className = "inspector-input";
      const itemRow = document.createElement('div');
      itemRow.className = "inspector-item-row";
      itemRow.style = "margin: 0px 0; display: flex; flex-direction: column;";
    // ------------------- 編集不可のプロパティのグレーアウト処理 -------------------
      const isLockedGroup = (DragonScope.selectedDragon.name === "Master" && ['scaleFunc', 'breath', 'branch'].includes(groupKey)) ||
      (DragonScope.selectedDragon.name !== "Master" && ['whole', 'masterMove'].includes(groupKey));
      const isLockedKey = ((DragonScope.selectedDragon.name === "Master" &&
                            groupKey === 'basic' && ['scaleX', 'scaleY', 'offsetX', 'offsetY', 'numParts',].includes(key)) ||
                          (DragonScope.selectedDragon.name === "Master" && groupKey === 'meta' && ['name', 'followId', 'followIndex',].includes(key)));
      const isLocked = isLockedGroup || isLockedKey;
      function lockedProperty(isLocked){
        if (isLocked){itemRow.style.opacity="0.2"; itemRow.style.pointerEvents="none"; itemRow.style.filter="grayscale(100%)";
            input.disabled=true; input.style.cursor="not-allowed"; input.style.background="#111";input.style.color="#eee";}};
      // configが"flag"の場合はgroupWrapper（タイトル直下）に、それ以外はcontentWrapperに追加
      if (config[0] === "flag") {
        groupWrapper.appendChild(itemRow);
      } else {
        contentWrapper.appendChild(itemRow);}
      // --- 1. テキスト入力 (name等) ---
      if (config[0] === "text") {
        input.className = "inspector-name-input";
        input.id = `inspector-name-input-${DragonScope.individualCurrentIndex}`;
        label.innerText = "reName (Input Text)";
        input.type = "text";
        input.value = DragonScope.selectedDragon[key] ?? "";
        lockedProperty(isLocked);
        itemRow.appendChild(label);
        itemRow.appendChild(input);
        contentWrapper.appendChild(itemRow);}
      // --- 2. 画像・数値入力 (img等) ---
      else if (config[0] === "image") {
        input.className = "inspector-image-input";
        input.id = `inspector-image-input-${DragonScope.individualCurrentIndex}`;

        label.innerText = "replaceImage (Select number)";
        input.type = "number";
        input.value = DragonScope.selectedDragon[key] ?? 0;
        input.min = 0;
        input.max = DragonScope.images.length - 1;
        const controls = document.createElement("div");
        const countDisplay = document.createElement("span");
        countDisplay.className = "inspector-countDisplay";
        countDisplay.innerText = ` / 0 ~ ${DragonScope.images.length-1}`;
        // --- LIST/EDITボタン: ドラッグ、矢印、削除、アップロードをこのボタン内に集約 ---
        const listBtn = document.createElement("button");
        listBtn.className = "inspector-list-btn";
        listBtn.innerText = "LIST/EDIT";
        listBtn.onclick = () => {
          // モーダル外枠の作成
          const modal = document.createElement("div");
          modal.id = "image-list-modal";
          const content = document.createElement("div");
          content.id = "image-list-content";
          // ドラッグ中の要素インデックス保持用
          let draggedIdx = null;
          // リスト再描画用関数
          const renderList = () => {
            content.innerHTML = "";
            const header = document.createElement("div");
            header.id = "image-list-header";
            header.innerHTML = "<h3 style='color:#eee; margin:0;'>Image List / Edit (Drag or Arrows)</h3>";
            // モーダル内専用UPLOADボタン
            const innerUploadBtn = document.createElement("button");
            innerUploadBtn.id = "inner-upload-btn";
            innerUploadBtn.innerText = "UPLOAD";
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
                }};
              fileInput.click();};
            header.appendChild(innerUploadBtn);
            content.appendChild(header);
            const grid = document.createElement("div");
            grid.id = "image-list-grid";
            DragonScope.images.forEach((img, idx) => {
              const item = document.createElement("div");
              item.className = "image-list-item";
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
              const prevBtn = document.createElement("button");
              prevBtn.className = "move-img-btn";
              prevBtn.innerText = "←";
              prevBtn.onclick = (e) => {
                e.stopPropagation();
                if(idx > 0) {
                  [DragonScope.images[idx], DragonScope.images[idx-1]] = [DragonScope.images[idx-1], DragonScope.images[idx]];
                  renderList();}};
              const nextBtn = document.createElement("button");
              nextBtn.className = "move-img-btn";
              nextBtn.innerText = "→";
              nextBtn.onclick = (e) => {
                e.stopPropagation();
                if(idx < DragonScope.images.length - 1) {
                  [DragonScope.images[idx], DragonScope.images[idx+1]] = [DragonScope.images[idx+1], DragonScope.images[idx]];
                  renderList();}};
              // --- 削除ボタン制御（確認メッセージと範囲外インデックスの末尾吸着） ---
              const delBtn = document.createElement("button");
              delBtn.className = "delete-img-btn";
              delBtn.innerText = "DEL";
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
                    d.rebuild();}});
                updateUI();
                renderList();};
              item.appendChild(preview);
              const info = document.createElement("div");
              info.className = "image-index-info";
              info.innerText = `idx:${idx}`;
              item.appendChild(info);
              const moveContainer = document.createElement("div");
              moveContainer.className = "move-img-container";
              moveContainer.appendChild(prevBtn);
              moveContainer.appendChild(nextBtn);
              item.appendChild(moveContainer);
              item.appendChild(delBtn);
              grid.appendChild(item);});
            content.appendChild(grid);
            const closeBtn = document.createElement("button");
            closeBtn.id = "close-modal-btn";
            closeBtn.innerText = "CLOSE";
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
        controls.appendChild(listBtn);
        itemRow.appendChild(controls);
        contentWrapper.appendChild(itemRow);}
      // --- 3. followId入力 ---
    else if (config[0] === "referenceId" || config[0] === "referenceIndex"){
    const followLabel = document.createElement('div');
    followLabel.className = "inspector-follow-label";
    followLabel.id = `inspector-follow-label-${DragonScope.individualCurrentIndex}`;
    followLabel.innerText = key;
    itemRow.appendChild(followLabel);
    const followRow = document.createElement('div');
    followRow.className = "inspector-follow-row";
const followInput = document.createElement('input');
followInput.className = "inspector-follow-input";

followInput.type = (config[0] === "referenceId") ? "text" : "number";
followInput.id = `inspector-follow-input-${key}-${DragonScope.individualCurrentIndex}`
followInput.dataset.key = key;
const rawVal = DragonScope.selectedDragon[key];
const currentVal = (rawVal?.name ?? rawVal) ?? null;
followInput.value = currentVal;
followInput.min = 0;
const targetDragon = DragonScope.selectedDragon.followId;
  if (config[0] === "referenceIndex") {
    followInput.max = (targetDragon && targetDragon.numParts) ? targetDragon.numParts - 1 : null;}
    lockedProperty(isLocked);
    followRow.appendChild(followInput);
    itemRow.appendChild(followRow);
    contentWrapper.appendChild(itemRow);}
      // --- 4. フラグ項目 (ON/OFF) ---
      else if (config[0] === "flag"){
        label.innerText = key;
        itemRow.appendChild(label);
        const flagOnOffBtn = document.createElement('button');
        flagOnOffBtn.className = "inspector-flag-btn";
        const updateBtnSwitch = (val) => {
          flagOnOffBtn.innerText = val ? "ON" : "OFF";
          flagOnOffBtn.style = `background:${val ? '#2a8' : '#822'}`;
          let targetOpacity = val ? "1.0" : "0.2";
          let targetPointer = val ? "auto" : "none";
          let targetFilter = val ? "none" : "grayscale(100%)";
          if (isLocked) {
              flagOnOffBtn.style = `cursor:default; background:#322; opacity:0.1; opacity:0.4;`;
              flagOnOffBtn.style.pointerEvents = "none";
              targetOpacity = "1";
              targetPointer = "none";
              targetFilter = "grayscale(100%)";}
              contentWrapper.style.opacity = targetOpacity;
              contentWrapper.style.pointerEvents = targetPointer;
              contentWrapper.style.filter = targetFilter;};
        updateBtnSwitch(!!DragonScope.selectedDragon[key]);
        flagOnOffBtn.onclick = () => {
          const newVal = !DragonScope.selectedDragon[key];
          DragonScope.selectedDragon[key] = newVal ? 1 : 0;
          updateBtnSwitch(newVal);
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = newVal;
          if (["flagBranch"].includes(key)) {
            MotionStrategy();
            DragonScope.selectedDragon.rebuild();
          }};
        itemRow.appendChild(flagOnOffBtn);
        groupWrapper.insertBefore(itemRow, groupTitle.nextSibling);}
      // --- 5. セレクトボックス ---
      else if (config[0] === "select") {
        label.innerText = key;
        itemRow.appendChild(label);
        const select = document.createElement('select');
        select.className = "inspector-select";
        select.id = `inspector-select-${key}-${DragonScope.individualCurrentIndex}`
        const defIdx = config.length-1;
          for(let i =1; i <= defIdx; i++){
          const o = document.createElement('option');
          o.value = config[i];
          o.innerText = config[i];
          select.appendChild(o);};
        select.value = DragonScope.selectedDragon[key] ?? config[defIdx];
        select.onchange = (e) => {
          DragonScope.selectedDragon[key] = e.target.value;
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = e.target.value;};
        itemRow.appendChild(select);
        lockedProperty(isLocked);
        contentWrapper.appendChild(itemRow);}
      // --- 6. 数値スライダー ---
      else if (typeof config[0] === "number"){
        const defInd = config.length-1;
        label.innerText = key;
        itemRow.appendChild(label);
        lockedProperty(isLocked);
        const sliderRow = document.createElement('div');
        sliderRow.className = "inspector-slider-row";
        const slider = document.createElement('input');
        slider.className = "inspector-slider";
        slider.type = "range";
        slider.min = config[0];
        slider.max = config[1];
        const baseStep = config[2] ?? F_1;
        slider.step = baseStep;
        const valDisp = document.createElement('span');
        valDisp.className = "inspector-slider-value-disp";
        const currentVal = DragonScope.selectedDragon[key] ?? config[defInd];
        slider.value = currentVal;
        valDisp.innerText = currentVal;
      // -------------------キーボード操作ロジック--------------
        slider.addEventListener('keydown', e => {
          e.preventDefault();
          let v = parseFloat(slider.value);
          let changed = false;
          if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")){
              e.preventDefault();
              v += baseStep * (e.key === "ArrowUp" ? 100 : -100);
              changed = true;
            } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")){
              e.preventDefault();
              v += baseStep * (e.key === "ArrowRight" ? 1 : -1);
              changed = true;
            } else if (!e.shiftKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)){
              e.preventDefault();
              v += baseStep * (["ArrowUp", "ArrowRight"].includes(e.key) ? 10 : -10);
              changed = true;}
          if (changed) {
            v = Math.max(config[0], Math.min(config[1], v));
            const stepDec = baseStep.toString().includes('.') ? baseStep.toString().split('.')[1].length : 0;
            const finalV = parseFloat(v.toFixed(stepDec + 1));
            slider.value = finalV;
            valDisp.innerText = finalV;
            DragonScope.selectedDragon[key] = finalV;
            slider.dispatchEvent(new Event('input'));
            DragonScope.storage[DragonScope.selectedDragon.id].current[key] = finalV;}});
        slider.oninput = (e) => {
          const v = parseFloat(e.target.value);
          valDisp.innerText = v;
          DragonScope.selectedDragon[key] = v;
          DragonScope.storage[DragonScope.selectedDragon.id].current[key] = v;
          if (["numParts"].includes(key)) {
            DragonScope.selectedDragon.rebuild();
            rebuildDragonList();
          }};
        sliderRow.appendChild(slider);
        sliderRow.appendChild(valDisp);
        itemRow.appendChild(sliderRow);
        contentWrapper.appendChild(itemRow);}}
        groupWrapper.appendChild(contentWrapper);
        contentArea.appendChild(groupWrapper);
}};


