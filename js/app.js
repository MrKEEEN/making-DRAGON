import { DragonScope } from './base/prop_schema.js';

// ==============================
// 1. サンプルファイルのパス定義
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
    const overlay = document.createElement('div');
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#111;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10000;color:white;font-family:sans-serif;";
    overlay.innerHTML = "<h2 style='margin-bottom:30px;'>Select Prototype</h2><div id='btn-container'></div>";
    document.body.appendChild(overlay);
    const container = overlay.querySelector('#btn-container');

    Object.keys(SAMPLES).forEach(name => {
        const appBtn = document.createElement('button');
        appBtn.innerText = name;
        appBtn.style = "margin:10px;padding:15px 40px;font-size:18px;cursor:pointer;background:#333;color:white;border:1px solid #555;border-radius:4px;";
        appBtn.onclick = async () => {
            // try {
                // ファイルをフェッチしてJSONとして解析
                // const response = await fetch(SAMPLES[name]);
                // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                // const data = await response.json();
                // データをセット
                // DragonScope.initialData = data;

                DragonScope.initialData = SAMPLES[name];



                overlay.remove();
                // main.js を実行
                await import('./main.js');
            // } catch (error) {
            //     console.error("Failed to load sample:", error);
            //     alert("ファイルの読み込みに失敗しました。パスを確認してください。");
            // }
        };
        container.appendChild(appBtn);

    const adjustZoom = () => {
    // ブラウザの標準倍率（100%）を1とした時の現在の比率
    const zoomRatio = 1 / window.devicePixelRatio;
    const statusInfo = document.getElementById('statusInfo');
    const controls = document.getElementById('controls');
    const resizer = document.getElementById('resizer_v');
    document.documentElement.style.setProperty('--zoom-ratio', window.devicePixelRatio);
    if (statusInfo) {
        statusInfo.style.transform = `scale(${zoomRatio})`;}
    if (controls) {
        controls.style.transform = `scale(${zoomRatio})`;}
    if (resizer) {
        resizer.style.transform = `scale(${zoomRatio})`;}
};
window.addEventListener('resize', adjustZoom);
window.addEventListener('DOMContentLoaded', () => {
    adjustZoom();});
});
}

showSelector();