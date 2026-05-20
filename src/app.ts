import { DragonScope } from './base/prop_schema.js';

declare global {
    interface Window {
        APP_MODE: 'MOBILE_MODE' | 'PC_MODE';
    }}

// ==============================
// 1. デバイス環境の判定（最優先で実行）
// ==============================
function getUserEnvironment() {
    const ua = navigator.userAgent;
    // iPhoneまたはAndroidかつMobileが含まれる場合のみを「スマホモード」とする
    const isStrictMobile = /iPhone|Android.*Mobile/i.test(ua);
    return isStrictMobile ? "MOBILE_MODE" : "PC_MODE";};

// グローバル変数に格納して main.js 等から参照可能にする
const currentEnv = getUserEnvironment();
Object.defineProperty(window, 'APP_MODE', {
    value: currentEnv,
    writable: false,
    enumerable: true,
    configurable: false});

// ==============================
// 2. ズーム最適化ロジック (PC用)
// ==============================
const adjustZoom = () => {
    DragonScope.mobileRatio ||= window.devicePixelRatio;
    const zoomRatio = 1 / window.devicePixelRatio;
    const statusInfo = document.getElementById('statusInfo');
    const controls = document.getElementById('controls');
    const resizer = document.getElementById('resizer_v');
    document.documentElement.style.setProperty('--zoom-ratio', String(window.devicePixelRatio));
    if (statusInfo) {statusInfo.style.transform = `scale(${zoomRatio})`;}
    if (controls) {controls.style.transform = `scale(${zoomRatio})`;}
    if (resizer) {resizer.style.transform = `scale(${zoomRatio})`;}};

// ==============================
// 3. サンプル定義とセレクター
// ==============================
const SAMPLES = {
    //配列最後は初期背景色のrgb値
    "one point":    [["./samples/dragon_Master_onepoint.json"], [0, 0, 0]],
    "First Dragon": [["./samples/dragon_Master_firstDRAGON.json"], [0, 0, 0]],
    "Snake":        [["./samples/dragon_Master_snake.json"], [0, 100, 0]],
    "Spider":       [["./samples/dragon_Master_spider.json"], [0, 0, 0]],
    "Mr. Sherman":  [["./samples/dragon_Master_mr-sherman.json"], [0, 0, 0]],
    "fantasy DRAGONS" : [["./samples/dragon_Master_fantasyDRAGONs_1.json", "./samples/dragon_Master_fantasyDRAGONs_2.json", "./samples/dragon_Master_fantasyDRAGONs_3.json"], [255, 0, 0]],
} as const;


function showSelector() {
    // 既に body にクラスを付与しておく
    document.body.classList.add(window.APP_MODE === "MOBILE_MODE" ? 'mode-mobile' : 'mode-pc');

    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#111;display:flex;flex-direction:column;\
                    justify-content:center;align-items:center;z-index:10000;color:white;font-family:sans-serif;";
    overlay.innerHTML = "<h2 style='margin-bottom:30px;'>Select Prototype Sample</h2><div id='btn-container'></div>";
    document.body.appendChild(overlay);
    const container = overlay.querySelector<HTMLDivElement>('#btn-container');
    if (container) {
        container.style.cssText = "display:flex;flex-direction:column;align-items:center;width:100%;max-height:70vh;overflow-y:auto;background: #25caca59";
    }

// ボタン生成の共通処理
        const addSelectButton = (name: string, data: readonly[readonly string[], readonly[number, number, number]], isUserSave = false) => {
        const appBtn = document.createElement('button');
        appBtn.innerText = isUserSave ? `Save: ${name}` : name;
        // ユーザーデータは青、プリセットは緑
        const bgColor = isUserSave ? "#148" : "#691";
        const borderColor = isUserSave ? "#38f" : "#d9e12f";
        appBtn.style.cssText = `margin:5px; padding:5px 40px; font-size:18px; cursor:pointer; background:${bgColor}; color:white;\
                        border:5px solid ${borderColor}; border-radius:4px; width:280px;`;
        appBtn.onclick = async () => {
            DragonScope.initialData = data;
            overlay.remove();
            await import('./main.js');
        };
        if (container) {container.appendChild(appBtn);}
    };

    Object.entries(SAMPLES).forEach(([name, value]) => {
    addSelectButton(name, value);
});

    // ユーザーセーブデータの表示
        for (let i = 1; i <= 10; i++) {
        const rawData = localStorage.getItem(`userSAVE_${i}`);
    // データが存在しない（空）場合はスキップ
        if (!rawData) continue;
        try {
            const data: readonly[readonly string[], readonly[number, number, number]] = JSON.parse(rawData);
        // データが存在していれば無条件でボタンを追加
            addSelectButton(`Slot ${i}`, data, true);
        } catch (e) {
            console.error(`invalid Slot ${i}`);
    }}}



// ==============================
// 4. 初期化
// ==============================
window.addEventListener('resize', adjustZoom);
window.addEventListener('DOMContentLoaded', () => {
    showSelector();
    adjustZoom();
});