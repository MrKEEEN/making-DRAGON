import { DragonScope } from './base/prop_schema.js';

// ==============================
// 1. デバイス環境の判定（最優先で実行）
// ==============================
function getUserEnvironment() {
    const ua = navigator.userAgent;
    // iPhoneまたはAndroidかつMobileが含まれる場合のみを「スマホモード」とする
    const isStrictMobile = /iPhone|Android.*Mobile/i.test(ua);
    return isStrictMobile ? "MOBILE_MODE" : "PC_MODE";
}

// グローバル変数に格納して main.js 等から参照可能にする
const currentEnv = getUserEnvironment();
Object.defineProperty(window, 'APP_MODE', {
    value: currentEnv,
    writable: false,
    enumerable: true,
    configurable: false
});


// ==============================
// 2. ズーム最適化ロジック (PC用)
// ==============================
const adjustZoom = () => {
    DragonScope.mobileRatio ||= window.devicePixelRatio;
    const zoomRatio = 1 / window.devicePixelRatio;
    const statusInfo = document.getElementById('statusInfo');
    const controls = document.getElementById('controls');
    const resizer = document.getElementById('resizer_v');
    document.documentElement.style.setProperty('--zoom-ratio', window.devicePixelRatio);
    if (statusInfo) {statusInfo.style.transform = `scale(${zoomRatio})`;}
    if (controls) {controls.style.transform = `scale(${zoomRatio})`;}
    if (resizer) {resizer.style.transform = `scale(${zoomRatio})`;}};

// ==============================
// 3. サンプル定義とセレクター
// ==============================
const SAMPLES = {
    "one point":    ["./samples/dragon_Master_onepoint.json"],
    "First Dragon": ["./samples/dragon_Master_firstDRAGON.json"],
    "Snake":        ["./samples/dragon_Master_snake.json"],
    "Spider":       ["./samples/dragon_Master_spider.json"],
    "Mr. Sherman":  ["./samples/dragon_Master_mr-sherman.json"],
    "fantasy DRAGONS" : ["./samples/dragon_Master_fantasyDRAGONs_1.json", "./samples/dragon_Master_fantasyDRAGONs_2.json", "./samples/dragon_Master_fantasyDRAGONs_3.json"],
};

function showSelector() {
    // 既に body にクラスを付与しておく
    document.body.classList.add(window.APP_MODE === "MOBILE_MODE" ? 'mode-mobile' : 'mode-pc');

    const overlay = document.createElement('div');
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#111;display:flex;flex-direction:column;\
                    justify-content:center;align-items:center;z-index:10000;color:white;font-family:sans-serif;";
    overlay.innerHTML = "<h2 style='margin-bottom:30px;'>Select Prototype</h2><div id='btn-container'></div>";
    document.body.appendChild(overlay);
    const container = overlay.querySelector('#btn-container');
    container.style = "display:flex;flex-direction:column;align-items:center;width:100%;";

    Object.keys(SAMPLES).forEach(name => {
        const appBtn = document.createElement('button');
        appBtn.innerText = name;
        appBtn.style = "margin:5px; padding:5px 40px; font-size:18px; cursor:pointer; background:#691; color:white;\
                        border:1px solid #555; border-radius:4px; width:250px;";
        appBtn.onclick = async () => {
            DragonScope.initialData = SAMPLES[name];
            overlay.remove();
            await import('./main.js');
        };
        container.appendChild(appBtn);
    });}

// ==============================
// 4. 初期化
// ==============================
window.addEventListener('resize', adjustZoom);
window.addEventListener('DOMContentLoaded', () => {
    showSelector();
    adjustZoom();
});