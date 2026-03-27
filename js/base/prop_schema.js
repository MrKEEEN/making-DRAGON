
export const DragonScope = {master: null, images: [], dragons: [], dps: [], storage: {},};

const F_1 = Number(0.1.toFixed(1));
const F_2 = Number(0.01.toFixed(2));
const F_3 = Number(0.001.toFixed(3));
const F_4 = Number(0.0001.toFixed(4));

//=======================
//---PROP_SCHEMA---
//number配列[min, max, step, default]
//string配列[type, options, ., ., ., default]
//=======================
export const PROP_SCHEMA = {
// --- 1. メタデータ（数値以外） ---
id: null,
meta: {
name: ["text", "New Dragon"],
_imgIndex: ["image", 0],
followId: ["referenceId", null],
followIndex: ["referenceIndex", null],
},
// --- 2. 全体作用（Masterのみ） ---
whole: {
wholeScaleAddX: [-999, 999, F_2, 0],
wholeScaleAddY: [-999, 999, F_2, 0],
wholeScaleMulX: [-99, 99, F_3, 1],
wholeScaleMulY: [-99, 99, F_3, 1],
},
// --- 3. 基本設定 ---
basic: {
scaleX: [-1000, 1000, F_1, 30],
scaleY: [-1000, 1000, F_1, 30],
spacing: [-0.1, 50, F_3, 5],
speed: [-F_3, 1, F_4, 0.5],
offsetX: [-99, 99, F_1, 0],
offsetY: [-99, 99, F_1, 0],
numParts: [1, 99, 1, 10],
},
// --- 4. サイズ関数（選択肢を含む） ---
scaleFunc: {
flagScaleFunc: ["flag", 1, 0, 0],
methodX: ["select", "add", "mul", "simpAdd", "simpMul", "none"],
methodY: ["select", "add", "mul", "simpAdd", "simpMul", "none"],
ampScaleX: [-9999, 9999, F_1, 1],
ampScaleY: [-9999, 9999, F_1, 1],
effectScaleX: [-10, 10, F_3, 1],
effectScaleY: [-10, 10, F_3, 1],
},
breath: {
flagBreath: ["flag", 1, 0, 0],
breatheProfile: ["select", "center", "frontWave", "none"],
breatheAmpX: [-100, 100, F_2, 0],
breatheAmpY: [-100, 100, F_2, 0],
breatheSpeed: [-0.04, 0.04, F_4, 0],
breatheSpread: [-4, 4, F_2, 1],
breatheLag: [-10, 10, F_3, 0.1],
},
// --- 6. Branch（分岐・羽） ---
branch: {
flagBranch: ["flag", 1, 0, 0],
branchOffsetX: [-99, 99, F_3, 0],
branchOffsetY: [-99, 99, F_3, 0],
attachAngle: [-360, 360, F_1, 0],
baseAngle: [-999, 999, 1, 0],
spread: [-1, 1, F_4, 0],
waveAmp: [-10, 10, F_1, 0],
waveSpeed: [-0.1, 0.1, F_4, 0],
waveAngle: [-1, 1, F_2, 0],
waveLag: [-1, 1, F_4, 0],
sineSideAmp: [-30, 30, F_2, 3],
sineSideSpeed: [-0.1, 0.1, F_4, 0],
sineSideAngle: [-1, 1, F_2, 0.1],
sineSideLag: [-1, 1, F_2, 0.1],
flapAmp: [-99, 99, F_2, 1],
flapSpeed: [-0.05, 0.05, F_4, 0],
flapSpread: [-1, 1, F_4, 0],
flapXOffset: [-200, 200, F_2, 0],
flapYOffset: [-200, 200, F_2, 0],
lengthAmp: [-5, 5, F_4, 0.1],
lengthSpeed: [-0.02, 0.02, F_4, 0],
lengthLag: [-1, 1, F_4, 0.01],
mirrorOffset: [-10, 10, F_2, 1],
},
masterMove:{
flagMasterMove: ["flag", 1, 0, 0],
orbitAmpX: [-100, 100, F_1, 0],
orbitAmpY: [-100, 100, F_1, 0],
orbitSpeedX: [-0.04, 0.04, F_4, 0],
orbitSpeedY: [-0.04, 0.04, F_4, 0],
orbitPhase: [-10, 10, F_4, 0],
orbitAsymX: [-10, 10, F_2, 0],
orbitAsymY: [-10, 10, F_2, 0],
swayAmp: [-5, 5, F_4, F_3],
swaySpeed: [-0.5, 0.5, F_4, F_3],
swayOffset: [-1, 1, F_4, F_3],
headBobAmpX: [-5, 5, F_1, 0],
headBobAmpY: [-5, 5, F_1, 0],
headBobSpeed: [-0.5, 0.5, F_4, 0],
},};



//idプロパティだけ除外したkey配列
export const AllPropSchema_KEYS_excId = Object.values(PROP_SCHEMA).flatMap(group => Object.keys(group ?? {}));
//id,followId,followIndexを除外したkey配列
export const AllPropSchema_KEYS_except_id_followId_followIndex = AllPropSchema_KEYS_excId.filter(key => key !== 'followId' && key !== 'followIndex');