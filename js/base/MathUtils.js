import { PROP_SCHEMA, DragonScope } from './prop_schema.js';



//   // ==========================
//   // scaleFunc
//   // ==========================
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



export function createResolvedParams(dragon) {
  const resolved = {};

  let intervalId = null;
window.addEventListener('keydown', (e) => {
  if (intervalId || !['*', '/', '+', '-'].includes(e.key)){return;}
  const targetKey = e.key;
  intervalId = setInterval(() => {
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
          if (group === 'whole'){
              return DragonScope.master ? DragonScope.master[key] : 0;};
          let val = dragon[key];
          if (DragonScope.master) {
  if (key === 'scaleX') {
    val += DragonScope.master.wholeScaleAddX;
    val *= DragonScope.master.wholeScaleMulX;}
  if (key === 'scaleY') {
    val += DragonScope.master.wholeScaleAddY;
    val *= DragonScope.master.wholeScaleMulY;}}
  return val;},
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
