import type { ComplexBranchMotionStrategy, ChainMotionStrategy } from "../core/Strategies.js";
import type { Dragon } from "../core/Dragon.js";


//=======================================================================
//DragonがもつpropSchemaプロパティの型定義（ネスト解消平坦化/グループkeyなし）
//=======================================================================
interface IDragonPropSchema {
    id: string;
    // meta
    name: string;
    _imgIndex: number;
    // 実行時に他のドラゴンのID（文字列）が代入されるため string との複合型
    followId: Dragon | null;
    // 実行時に追従対象のパーツインデックス（数値）が代入されるため number との複合型
    followIndex: number | null;
    // whole
    wholeScaleAddX: number;
    wholeScaleAddY: number;
    wholeScaleMulX: number;
    wholeScaleMulY: number;
    // basic
    scaleX: number;
    scaleY: number;
    spacing: number;
    speed: number;
    offsetX: number;
    offsetY: number;
    numParts: number;
    // scaleFunc
    flagScaleFunc: number;
    methodX: string;
    methodY: string;
    ampScaleX: number;
    ampScaleY: number;
    effectScaleX: number;
    effectScaleY: number;
    // breath
    flagBreath: number;
    breatheProfile: string;
    breatheAmpX: number;
    breatheAmpY: number;
    breatheSpeed: number;
    breatheSpread: number;
    breatheLag: number;
    // branch
    flagBranch: number;
    branchOffsetX: number;
    branchOffsetY: number;
    attachAngle: number;
    baseAngle: number;
    spread: number;
    waveAmp: number;
    waveSpeed: number;
    waveAngle: number;
    waveLag: number;
    sineSideAmp: number;
    sineSideSpeed: number;
    sineSideAngle: number;
    sineSideLag: number;
    flapAmp: number;
    flapSpeed: number;
    flapSpread: number;
    flapXOffset: number;
    flapYOffset: number;
    lengthAmp: number;
    lengthSpeed: number;
    lengthLag: number;
    mirrorOffset: number;
    // masterMove
    flagMasterMove: number;
    orbitAmpX: number;
    orbitAmpY: number;
    orbitSpeedX: number;
    orbitSpeedY: number;
    orbitPhase: number;
    orbitAsymX: number;
    orbitAsymY: number;
    swayAmp: number;
    swaySpeed: number;
    swayOffset: number;
    headBobAmpX: number;
    headBobAmpY: number;
    headBobSpeed: number;
}

//=============================================================
//IDragonPropSchemaのfollowIDを文字列にした型定義（json保存形式）
//=============================================================
type SaveDragonJson = Omit<IDragonPropSchema, "followId"> & {followId: string | null;};

//=============================================================
//class Dragon用/IDragonPropSchemaにgroupKeyの型も補記した型定義
//=============================================================
interface IDragonPropSchemaWithGroupKey  {
    id: string;
    meta:
    Partial<{
    name: string;
    _imgIndex: number;
    followId: Dragon | null;
    followIndex: number | null;}>;

    whole: Partial<{
    wholeScaleAddX: number;
    wholeScaleAddY: number;
    wholeScaleMulX: number;
    wholeScaleMulY: number;}>;

    basic: Partial<{
    scaleX: number;
    scaleY: number;
    spacing: number;
    speed: number;
    offsetX: number;
    offsetY: number;
    numParts: number;}>;

    scaleFunc: Partial<{
    flagScaleFunc: number;
    methodX: string;
    methodY: string;
    ampScaleX: number;
    ampScaleY: number;
    effectScaleX: number;
    effectScaleY: number;}>;

    breath: Partial<{
    flagBreath: number;
    breatheProfile: string;
    breatheAmpX: number;
    breatheAmpY: number;
    breatheSpeed: number;
    breatheSpread: number;
    breatheLag: number;}>;

    branch: Partial<{
    flagBranch: number;
    branchOffsetX: number;
    branchOffsetY: number;
    attachAngle: number;
    baseAngle: number;
    spread: number;
    waveAmp: number;
    waveSpeed: number;
    waveAngle: number;
    waveLag: number;
    sineSideAmp: number;
    sineSideSpeed: number;
    sineSideAngle: number;
    sineSideLag: number;
    flapAmp: number;
    flapSpeed: number;
    flapSpread: number;
    flapXOffset: number;
    flapYOffset: number;
    lengthAmp: number;
    lengthSpeed: number;
    lengthLag: number;
    mirrorOffset: number;}>;

    masterMove: Partial<{
    lagMasterMove: number;
    orbitAmpX: number;
    orbitAmpY: number;
    orbitSpeedX: number;
    orbitSpeedY: number;
    orbitPhase: number;
    orbitAsymX: number;
    orbitAsymY: number;
    swayAmp: number;
    swaySpeed: number;
    swayOffset: number;
    headBobAmpX: number;
    headBobAmpY: number;
    headBobSpeed: number;}>;
}


//================================================
//PROP_SCHEMAのgroupKeyの型定義
//================================================
type DragonGroupKey = keyof IDragonPropSchemaWithGroupKey;

//==============================================
//DragonとdragonPartsが持つ共通プロパティの型定義
//==============================================
interface IDragonCommonProps extends IDragonPropSchema {
    strategy: ComplexBranchMotionStrategy | ChainMotionStrategy;
    history: {x:number; y:number; angle:number}[];
    resolvedParams: Record<string, number>;
    isBoosting: boolean;
    masterOffsetX: number;
    masterOffsetY: number;
    motionAmount: number;
    stillness: number;
    anglePreset: number;
    currentDragon: boolean;
    _lastCurrentDragon?: boolean | undefined;
}

//=============================
//Dragonが持つプロパティの型定義
//=============================
interface IDragonInterface extends IDragonCommonProps {
    parts: DragonPart[];}

//==========================================================
//dragonParts(DragonをnumParts個に分割した最小Parts)の型定義
//==========================================================
interface DragonPart {
    dragon: Dragon;
    x: number;
    y: number;
    angle: number;
    activeAngle: number;
    flapInfluence: number;
    imgIndex: number;
    baseScaleX: number;
    baseScaleY: number;
    scaleX: number;
    scaleY: number;
}



export type { IDragonPropSchema, IDragonInterface, IDragonPropSchemaWithGroupKey, DragonGroupKey, DragonPart, SaveDragonJson };
