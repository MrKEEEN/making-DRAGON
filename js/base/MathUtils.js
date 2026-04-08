import { PROP_SCHEMA, DragonScope } from './prop_schema.js';

export { createResolvedParams, showToast };

// ==========================
//   showToast
// ==========================

const showToast = (text) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 5000);
};

// ==========================
//  scaleFunc
// ==========================
  (function() {
  (i, baseScaleX, baseScaleY, {methodX, methodY, ampScaleX, ampScaleY, effectScaleX, effectScaleY}) => {
      let scaleX = baseScaleX;
      const efScaX = effectScaleX+F_4;
      const efScaY = effectScaleY+F_4;
      if(methodX==="add"){
        scaleX += Math.sin((i/efScaX)*Math.PI)*ampScaleX;
      } else if(methodX==="mul"){
        scaleX *= 1 + Math.sin((i/efScaX)*Math.PI)*ampScaleX;
      } else if(methodX==="simpAdd"){
        scaleX += (i/efScaX)*ampScaleX;
      } else if(methodX==="simpMul"){
        scaleX *= 1 + (i/efScaX)*ampScaleX;};
      scaleX = Math.max(0.001, scaleX);

      let scaleY = baseScaleY;
      if(methodY==="add"){
        scaleY += Math.sin((i/efScaY)*Math.PI)*ampScaleY;
      } else if(methodY==="mul"){
        scaleY *= 1 + Math.sin((i/efScaY)*Math.PI)*ampScaleY;
      } else if(methodY==="simpAdd"){
        scaleY += (i/efScaY)*ampScaleY;
      } else if(methodY==="simpMul"){
        scaleY *= 1 + (i/efScaY)*ampScaleY;};
      scaleY = Math.max(0.001, scaleY);
      return {x:scaleX, y:scaleY};
      }
})();

const createResolvedParams = (dragon) => {
  const resolved = {};
  let intervalId = null;

  window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey){return;}
  if (intervalId || !['*', '/', '+', '-'].includes(e.key)){return;}
  const targetKey = e.key;
  intervalId = setInterval(() => {
    if(!dragon.currentDragon){return};
    if (targetKey === '*') {
      dragon.scaleX *= 1.002;
      dragon.scaleY *= 1.002;
    } else if (targetKey === '/') {
      dragon.scaleX /= 1.003;
      dragon.scaleY /= 1.003;
    } else if (targetKey === '+') {
      dragon.scaleX += 0.2;
      dragon.scaleY += 0.2;
    } else if (targetKey === '-') {
      dragon.scaleX -= 0.2;
      dragon.scaleY -= 0.2;
    }}, 16);});
window.addEventListener('keyup', () => {
  clearInterval(intervalId);
  intervalId = null;});

for (const group in PROP_SCHEMA) {
  for (const key in PROP_SCHEMA[group]) {
    Object.defineProperty(resolved, key, {
      get: () => {
        // 1. マスターからの影響を計算する
        if (group === 'whole') {
          if (dragon.currentDragon && DragonScope.master) {
            // 操作中の個体なら、Masterの値を自分のプロパティに注入して保持させる
            dragon[key] = DragonScope.master[key];}
          return dragon[key] ?? 0;}
        let val = dragon[key];
        if (dragon.currentDragon && DragonScope.master) {
          if (key === 'scaleX') {
            // マスターの補正値を計算し、即座に自身のプロパティに「焼き付け」て更新
            dragon.wholeScaleAddX = DragonScope.master.wholeScaleAddX;
            dragon.wholeScaleMulX = DragonScope.master.wholeScaleMulX;
            val += dragon.wholeScaleAddX;
            val *= dragon.wholeScaleMulX;}
          if (key === 'scaleY') {
            dragon.wholeScaleAddY = DragonScope.master.wholeScaleAddY;
            dragon.wholeScaleMulY = DragonScope.master.wholeScaleMulY;
            val += dragon.wholeScaleAddY;
            val *= dragon.wholeScaleMulY;}
        } else {
          // スイッチ後の個体（currentDragonがfalse）は、
          // 最後に注入（保存）されたプロパティ値を使用して計算を維持する
          if (key === 'scaleX') {
            val += (dragon.wholeScaleAddX ?? 0);
            val *= (dragon.wholeScaleMulX ?? 1);}
          if (key === 'scaleY') {
            val += (dragon.wholeScaleAddY ?? 0);
            val *= (dragon.wholeScaleMulY ?? 1);}}
        return val;
      },
      enumerable: true,
      configurable: true
    });}}

Object.defineProperty(resolved, 'currentScaleX', {
  get: () => {
    let val = resolved.scaleX;
    if (dragon.flagBreath) {
      val += Math.sin(Date.now() * resolved.breatheSpeed) * resolved.breatheAmpX * (1 + dragon.mirrorOffset);}
    return val;},
  enumerable: true,
  configurable: true});

Object.defineProperty(resolved, 'currentScaleY', {
  get: () => {
    let val = resolved.scaleY;
    if (dragon.flagBreath) {
      val += Math.sin(Date.now() * resolved.breatheSpeed) * resolved.breatheAmpY;}
    return val;},
  enumerable: true,
  configurable: true});
  return resolved;}
