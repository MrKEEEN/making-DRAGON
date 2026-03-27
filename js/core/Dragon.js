import { PROP_SCHEMA, DragonScope } from '../base/prop_schema.js';
import { createResolvedParams } from '../base/MathUtils.js';
import { MotionStrategy } from './Strategies.js';


    // ============================
    // クラス Dragon
    // ============================
export class Dragon {
  static INTERNAL_DEFAULTS = {
    masterOffset: { x: 0, y: 0 },
    motionAmount: 0,
    stillness: 0,
    anglePreset: 0,
    angle: 0,
    isBoosting: false,};

constructor(options = {}){
    this.id = options.id ?? `dragon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.history = [];
    Object.assign(this, Dragon.INTERNAL_DEFAULTS);
    DragonScope.storage[this.id] = {current: {}, saved: {},};
    for (const groupKey in PROP_SCHEMA) {
      if(!groupKey){continue;}
      const optGroup = options[groupKey] ?? {};
      for (const key in PROP_SCHEMA[groupKey]) {
        const entry = PROP_SCHEMA[groupKey][key];
        const defIdx = entry.length-1;
        let val = optGroup[key];
        this[key] = val !== undefined ? val : Array.isArray(entry) ? entry[defIdx] : null;
    DragonScope.storage[this.id].saved[key] = this[key];
    }}

    this.resolvedParams = createResolvedParams(this);
    this.initParts();
    this.isBoosting = false;}

    get imgIndex(){return this._imgIndex;}
    set imgIndex(imgIndex) {
      if (imgIndex >= DragonScope.images.length) {
        this._imgIndex = DragonScope.images.length - 1;
    } else {
    this._imgIndex = imgIndex}}

  initParts() {
    this.parts = [];
    const baseWidth = typeof canvas !== 'undefined' ? canvas.width / 2 : 0;
    const baseHeight = typeof canvas !== 'undefined' ? canvas.height / 2 : 0;
    for (let i = 0; i < this.numParts; i++) {
      this.parts.push({
        x: baseWidth,
        y: baseHeight,
        angle: 0,
        activeAngle: 0,
        flapInfluence: 1,
        imgIndex: this._imgIndex,
      });}}

    resetParts() {
    for (let i = 0; i < this.numParts; i++) {
        this.parts[i].imgIndex= this.imgIndex;};}

    rebuild(rotationMode) {
      this.initParts();
      if (typeof window !== 'undefined'){
        DragonScope.needsRebuildDPS = true;}
      if (rotationMode === 3 || rotationMode === 4) this.initSnakeHistory();}

    get lastIndex() { return this.parts.length - 1; }



  initSnakeHistory() {
    this.history = [];
    if (!this.parts || this.parts.length === 0) return;
    const root = this.parts[0];
    const step = Math.max(1, Math.floor(this.spacing * 2.0));
    const totalNeeded = this.parts.length * step;
    for (let j = 0; j <= totalNeeded; j++) {
      this.history.push({ x: root.x, y: root.y, angle: root.angle });}}

  update(mouseTarget, rotationMode){
    const root = this.parts[0];
    const t = Date.now();
    // 1. 移動前の座標保持
    const oldX = root.x;
    const oldY = root.y;

    // 2. Strategy による座標・activeAngle の更新
    // 第一引数に自分自身(this)、第二引数に目標(mouse)を渡す
    MotionStrategy();
    this.strategy.update(this, mouseTarget, t);

    // 3. stillness (静止度) の計算
    const dx = root.x - oldX;
    const dy = root.y - oldY;
    this.motionAmount = Math.sqrt(dx * dx + dy * dy);
    const isStill = this.motionAmount < 0.05;
    this.stillness += ((isStill ? 1 : 0) - this.stillness) * 0.05;
    // 4. 角度計算と後続パーツの処理
    if (rotationMode === 3 || rotationMode === 4) {
      this.updateSnakeMotion(mouseTarget, rotationMode);
    } else {
      this.updateStandardMotion(isStill, rotationMode);}
    // 5. スケールの更新
    this.recalculateScales(t);}


  updateSnakeMotion(target, rotationMode){
    function normalizeAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));};
    const root = this.parts[0];
    const dx = target.x - root.x;
    const dy = target.y - root.y;
    // 頭部の向き
    if (Math.sqrt(dx * dx + dy * dy) > 0.05) {
      root.activeAngle = Math.atan2(dy, dx);}
    if (rotationMode === 4) {
      const convergenceFactor = Math.pow(this.stillness, 0.02);
      root.angle = normalizeAngle(root.activeAngle * (1 - convergenceFactor));
    } else {
      root.angle = root.activeAngle;}
    // 履歴更新と追従
    this.history.unshift({ x: root.x, y: root.y, angle: root.angle });
    const step = Math.max(1, Math.floor(this.spacing * 0.003));
    for (let i = 1; i < this.parts.length; i++) {
      const part = this.parts[i];
      const record = this.history[i * step] ?? this.history[this.history.length - 1];
      if (record) {
        part.x += (record.x - part.x) * 0.05;
        part.y += (record.y - part.y) * 0.05;
        part.angle = record.angle;}}
    if (this.history.length > this.parts.length * step + 10) this.history.pop();}

  updateStandardMotion(isStill, rotationMode) {
    function normalizeAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));};
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      let targetA = part.activeAngle;
      if (rotationMode === 1) targetA = 0;
      else if (rotationMode === 2) targetA = normalizeAngle(part.activeAngle * (1 - this.stillness));
      const curX = Math.cos(part.angle), curY = Math.sin(part.angle);
      const tarX = Math.cos(targetA), tarY = Math.sin(targetA);
      const lerp = isStill ? 0.05 : 0.15;
      part.angle = Math.atan2(curY + (tarY - curY) * lerp, curX + (tarX - curX) * lerp);}}

  recalculateScales(t) {
  const res = this.resolvedParams;
  const bSpeed = res.breatheSpeed;
  const bSpread = res.breatheSpread;
  const bLag = res.breatheLag;

  // 1. ループを一つに統合し、計算の連続性を確保
  for (let i = 0; i < this.parts.length; i++) {
    const part = this.parts[i];
    const ratio = this.parts.length > 1 ? i / (this.parts.length - 1) : 0;

    // --- 形状変形の計算 (Base Scale) ---
    let bx = res.scaleX;
    let by = res.scaleY;

    if (this.flagScaleFunc) {
      const ax = res.ampScaleX ?? 0;
      const ex = res.effectScaleX ?? 0;
      if (this.methodX === "add") bx += Math.sin(ratio * Math.PI * ex) * ax;
      else if (this.methodX === "mul") bx *= (1 + Math.sin(ratio * Math.PI * ex) * (ax / 100));
      else if (this.methodX === "simpAdd") bx += ratio * ax;
      else if (this.methodX === "simpMul") bx *= (1 + ratio * (ax / 100));

      const ay = res.ampScaleY ?? 0;
      const ey = res.effectScaleY ?? 0;
      if (this.methodY === "add") by += Math.sin(ratio * Math.PI * ey) * ay;
      else if (this.methodY === "mul") by *= (1 + Math.sin(ratio * Math.PI * ey) * (ay / 100));
      else if (this.methodY === "simpAdd") by += ratio * ay;
      else if (this.methodY === "simpMul") by *= (1 + ratio * (ay / 100));
    }

    // 基準値を保存（呼吸計算のベースとして使用）
    part.baseScaleX = bx;
    part.baseScaleY = by;

    // --- 呼吸の計算 (Final Scale) ---
    let bX = 0, bY = 0;

    // breatheProfile が "none" 以外かつフラグが有効な場合のみ計算を実行
    if (this.breatheProfile !== "none" && this.flagBreath){
      const weight = (this.breatheProfile === "center") ? Math.pow(Math.sin(ratio * Math.PI), bSpread) : 1;
      const phase = t * bSpeed - (this.breatheProfile === "frontWave" ? i * bLag : 0);
      const wave = Math.sin(phase);
      bX = wave * (res.breatheAmpX / 100) * weight;
      bY = wave * (res.breatheAmpY / 100) * weight;
    }

    // 最終的なスケールを一度だけ代入
    part.scaleX = part.baseScaleX * (1 + bX);
    part.scaleY = part.baseScaleY * (1 + bY);
  }}}




