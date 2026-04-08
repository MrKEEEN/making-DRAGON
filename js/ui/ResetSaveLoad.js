import { PROP_SCHEMA, DragonScope, AllPropSchema_KEYS_excId, AllPropSchema_KEYS_except_id_followId_followIndex } from '../base/prop_schema.js';
import { MotionStrategy } from '../core/Strategies.js';
import { Dragon } from '../core/Dragon.js';
import { createInspectorGUI, buildDPS, rebuildDragonList } from './Inspector.js';
import { dragonManager } from '../core/DragonManager.js';

export { ResetSaveLoad };

const ResetSaveLoad = {
  sync(id, dragon, toDragon = true) {
      AllPropSchema_KEYS_excId.forEach((key) => {
        if (toDragon) {                          //reset,load処理
          dragon[key] = DragonScope.storage[id].saved[key];
        } else {                                 //save,init処理
          if (dragon[key] !== undefined) {
            DragonScope.storage[id].saved[key] = dragon[key];
          }}});},

reset(id, dragon){
let currentNumParts= false;
let currentImgIndex = false;
if (DragonScope.storage[id].current["numParts"]){
  currentNumParts = true;}
if (DragonScope.storage[id].current["_imgIndex"]){
  currentImgIndex = true;}
DragonScope.storage[id].current = {};
this.sync(dragon.id, dragon, true);
MotionStrategy();
if(currentNumParts && dragon.initParts){
  dragon.initParts();
  currentNumParts = false;}
if(currentImgIndex && dragon.resetParts){
  dragon.resetParts();
  currentImgIndex = false;}},

  async save(id, dragon, blobMaster, blobPart) {
  const d = DragonScope.selectedDragon;
    if (d.name === "Master") {
        if (!confirm(`want to download JSON Files, too?`)){
                DragonScope.dragons.forEach((dragon) => {
            //現時点情報セーブ・current空のみの処理
            this.sync(dragon.id, dragon, false);
            DragonScope.storage[dragon.id].current = {};});
            return;}
    const allData = {};
    const arrStrFollowId = [];
    await import('../../jszip.min.js');
    const JSZip = window.JSZip;
    //読み込み完了後にZIPインスタンスの作成
    const zip = new JSZip();
    DragonScope.dragons.forEach((dragon) => {
    //現時点情報セーブ・current空
      this.sync(dragon.id, dragon, false);
      DragonScope.storage[dragon.id].current = {};
    //Master処理↓
      allData[dragon.id] = DragonScope.storage[dragon.id].saved;
      //followIdのみ個別処理
      if(dragon.followId || dragon.followIndex){
        const valStrFollowId = (dragon.followId).name;
        arrStrFollowId.push({followId: valStrFollowId});}
    //Master選択時に、各パートも個別に保存
      if(dragon.name !== "Master"){
    ///Master以外は、followIdとfollowIndexプロパティを含めない(Master選択時の各パート処理)
    blobPart = new Blob([JSON.stringify(DragonScope.storage[dragon.id].saved, AllPropSchema_KEYS_except_id_followId_followIndex,2)], {type: 'application/json'});
    // 修正箇所：a.click()による個別保存を削除し、ZIPへ追加
    const fileNamePart = `dragon_${dragon.name}_${Date.now()}.json`;
    zip.file(fileNamePart, blobPart);}});

      //Master分のnullを先頭に追加
      arrStrFollowId.unshift({followId: null});
      //followIdのみ、オブジェクト情報から、名前情報のみに置き換え
    const flattedAllData = Object.entries(allData).flatMap(([key, value]) => value);
    flattedAllData.forEach((key, index) =>{key.followId = arrStrFollowId[index].followId;});
    //Master選択時は、followIdとfollowIndexプロパティも含める
    blobMaster = new Blob([JSON.stringify(flattedAllData, AllPropSchema_KEYS_excId, 2)],{type: 'application/json'});
    const ma = document.getElementById('master-save-link');
    ma.href = URL.createObjectURL(blobMaster);
    ma.download = `dragon_${dragon.name}_${Date.now()}.json`;
    ma.click();
    setTimeout(() => URL.revokeObjectURL(ma.href), 1000);

   // 修正箇所：Master保存後にZIPファイルを生成して保存
    zip.generateAsync({type: "blob"}).then((content) => {
      const da = document.getElementById('dragon-save-link');
      da.href = URL.createObjectURL(content);
      da.download = `parts_${Date.now()}.zip`;
      da.click();
     // メモリ解放
      setTimeout(() => URL.revokeObjectURL(da.href), 1000);});
   //改めて現時点の情報セーブ
        DragonScope.dragons.forEach((dragon) => {
        this.sync(dragon.id, dragon, false);});

    } else if (d.name !== "Master"){
    //現時点情報セーブ・current空
      this.sync(d.id, dragon, false);
      DragonScope.storage[d.id].current = {};
    if (!confirm(`want to download a JSON File, too?`)){return;}
    //Master以外は、followIdとfollowIndexプロパティを含めない（各パート処理）
    blobPart = new Blob([JSON.stringify(DragonScope.storage[id].saved, AllPropSchema_KEYS_except_id_followId_followIndex, 2)],{type: 'application/json'});
    const da = document.getElementById('dragon-save-link');
    da.href = URL.createObjectURL(blobPart);
    da.download = `dragon_${dragon.name}_${Date.now()}.json`;
    da.click();
    setTimeout(() => URL.revokeObjectURL(da.href), 1000);}},

    //初期起動時にも使用するため、load関数から独立して定義する。
    async applyData(data) {
      DragonScope.dragons.length = 0;
    //Master選択時のロード
        const nameMap = {};
        data.forEach((loadProp) => {
    // 追従先オブジェクトの解決
            const follower = loadProp.followId ? nameMap[loadProp.followId] : null;
            const loadSchema = {};
        Object.keys(PROP_SCHEMA).forEach(groupKey => {
      if (groupKey === "id"){return;}
      loadSchema[groupKey] = {};
      // カテゴリ内の各プロパティ（name, scaleX等）をループ
      Object.keys(PROP_SCHEMA[groupKey]).forEach(key => {
        let defIdx = PROP_SCHEMA[groupKey][key].length -1;
        if (loadProp.hasOwnProperty(key)) {
          loadSchema[groupKey][key] = loadProp[key];
        }else{loadSchema[groupKey][key] = PROP_SCHEMA[groupKey][key][defIdx];
        }});});
    // 文字列になっているfollowIdのみ解決済みのオブジェクト参照に差し替え
    loadSchema.meta.followId = follower;
    // インスタンス生成
    const newDragon = new Dragon(loadSchema);
    // 配列とマップへの登録
    DragonScope.dragons.push(newDragon);
    nameMap[newDragon.name] = newDragon;
    // DataStore同期
    const newId = newDragon.id;
    DragonScope.storage[newId] = { current: {}, saved: {} };
      AllPropSchema_KEYS_excId.forEach(key => {
        DragonScope.storage[newId].saved[key] = (key === "followId") ? follower : loadProp[key];}
      );});
  DragonScope.dragons.forEach(d => {
    if (d.imgIndex >= DragonScope.images.length) {
        d.imgIndex = DragonScope.images.length - 1;
        d.rebuild();}
        d.currentDragon = true;
    });
    DragonScope.selectedDragon = DragonScope.dragons[0];
    DragonScope.master = DragonScope.dragons.find(d => d.name === "Master");
    MotionStrategy();},


    load(id, dragon, data) {
    const d = DragonScope.selectedDragon;
    if(d.name === "Master"){
      this.applyData(data);
    } else if (d.name !== "Master"){
    let newName = data.name ? data.name : "";
    if (d && newName){
    let tentativeName = newName;
    let counter = 1;
    while(DragonScope.dragons.some(target => target !== d && target.name === newName)){
      newName = `${tentativeName}${counter}`;
      counter++;}
    const oldName = d.name;
      Object.keys(data).forEach((key) => {
        DragonScope.storage[id].saved[key] = data[key] ?? DragonScope.storage[id].current[key] ?? DragonScope.storage[id].saved[key];
        DragonScope.storage[id].current[key] = {};});
      this.sync(id, dragon, true);
      dragon.rebuild();
    DragonScope.dragons.forEach(dragon => {
    if (d && newName && d.name !== newName) {
    d.name = newName;
    DragonScope.storage[d.id].current["name"] = newName;
    if (dragon.followId && (dragon.followId.name === oldName || dragon.followId === oldName)) {
        dragon.followId = d;
        DragonScope.storage[dragon.id].current["followId"] = d;}}
      if ((dragon.followId === d || dragon.followId === newName) && dragon.followIndex >= d.numParts) {
      dragon.followIndex = d.numParts - 1;
    }});}
    if (d.imgIndex >= DragonScope.images.length) {
        d.imgIndex = DragonScope.images.length - 1;
        d.rebuild();}
      this.sync(dragon.id, dragon, false);}
MotionStrategy();},

deleteDragon(id) {
  if (DragonScope.selectedDragon === DragonScope.master){
      console.warn("Master can't be deleted.");
      return;}
  if (!confirm(`Delete ${DragonScope.selectedDragon.name}?`)){return;}
  DragonScope.dragons.forEach(dragon => {
    if (dragon.followId && (dragon.followId.name === DragonScope.selectedDragon.name || dragon.followId === DragonScope.selectedDragon)) {
        dragon.followId = DragonScope.master;
        DragonScope.storage[dragon.id].current["followId"] = DragonScope.master;
        dragon.followIndex = 0;
        this.sync(dragon.id, dragon, false);}});
  const index = DragonScope.dragons.findIndex(d => d.id === id);
    DragonScope.dragons.splice(index, 1);
    delete DragonScope.storage[id];
    DragonScope.selectedDragon = DragonScope.master;
    DragonScope.selectedDragon.rebuild();
    rebuildDragonList();
    dragonManager.buildAllDps();
    createInspectorGUI(DragonScope.individualCurrentIndex);},

//-----------------------
//setup -ボタンクリック-
//-----------------------
setupUI() {
  const resetBtn = document.getElementById("reset-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const delBtn = document.getElementById('del-btn');

  resetBtn.onclick = () => {
    const d = DragonScope.selectedDragon;
      if (d.name === "Master") {
      DragonScope.dragons.forEach((dragon) => {
      this.reset(dragon.id, dragon);});
      } else {
      this.reset(d.id, d);}
  d.rebuild();
  dragonManager.buildAllDps();
  createInspectorGUI(DragonScope.individualCurrentIndex);};

saveBtn.onclick = () => {
  const d = DragonScope.selectedDragon;
  this.save(d.id, d);};

  loadBtn.onclick = () => {
  const d = DragonScope.selectedDragon;
  const input = document.getElementById('json-loader');
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file){return;}
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        const isArray = Array.isArray(data);
        const hasNumParts = isArray ? (data[0] && data[0].hasOwnProperty("numParts")) : data.hasOwnProperty("numParts");
        if (!hasNumParts) {
          console.warn("Invalid data file");
          return;}
        if (d.name === "Master"){
        if (!isArray || data[0].name !== "Master") {
            console.warn("Master load failed: Selected file is not for Master.");
            return;}
          this.load(null, null, data);
        } else if (d.name !== "Master") {
        if (isArray || data.name === "Master"){
            console.warn("Part load failed: Selected file is for Master or invalid format.");
            return;}
        this.load(d.id, d, data);}
        rebuildDragonList();
        buildDPS();
        dragonManager.buildAllDps();
        createInspectorGUI(DragonScope.individualCurrentIndex);};
    reader.readAsText(file);
    input.value = "";};
    input.click();};

delBtn.onclick = () => {
const d = DragonScope.selectedDragon;
this. deleteDragon(d.id, d);};}};


