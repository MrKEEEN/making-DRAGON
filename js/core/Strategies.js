import { DragonScope } from '../base/prop_schema.js';


//==================
//flagBranch判定関数
//==================
export function MotionStrategy(){
  DragonScope.dragons.forEach(dragon => {
    dragon.strategy = dragon.flagBranch ? new ComplexBranchMotionStrategy() : new ChainMotionStrategy();
  });}

//=========================================
//ComplexBranchMotionStrategy
//=========================================
class ComplexBranchMotionStrategy  {
  update(target, mouse, t) {
    // 必須データの存在確認
    if (!target.followId){return;}

    const parentDragon = target.followId;
    const parentPart = parentDragon.parts[target.followIndex ?? (target.followId).numParts.length-1];
    if(!parentPart){return;}
    // 親の角度と基本情報
    const a = parentPart.angle;
    const m = target.mirrorOffset ?? 1;
    // 座標変換用の計算（target直下のプロパティを参照）
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const rotPrePoX = target.offsetX * cosA * m - target.offsetY * sinA;
    const rotPrePoY = target.offsetX * sinA * m + target.offsetY * cosA;
    const rotOffsetX = (target.branchOffsetX * cosA * m - target.branchOffsetY * sinA) ?? 0;
    const rotOffsetY = (target.branchOffsetX * sinA * m + target.branchOffsetY * cosA) ?? 0;
    // 親パーツのサイズに基づいたアタッチ位置
    const rx = parentPart.scaleX / 2;
    const ry = parentPart.scaleY / 2;
    const attach = (Math.PI * (1 - m) / 2) + m * (target.attachAngle * (Math.PI / 180));
    const lx = Math.cos(attach) * rx;
    const ly = Math.sin(attach) * ry;
    const rootX = parentPart.x + rotPrePoX + (lx * cosA - ly * sinA);
    const rootY = parentPart.y + rotPrePoY + (lx * sinA + ly * cosA);
    // 分岐の基本角度と広がり
    const centerAngle = a + (Math.PI * (1 - m) / 2) + m * (target.baseAngle * (Math.PI / 180));
    const spread = (target.spread ?? 0) * m;
    for (let i = 0; i < target.numParts; i++) {
      const curr = target.parts[i];
      if (!curr){continue;}
      let currentSpacing = target.spacing;
      let angle = centerAngle + (i - (target.numParts - 1) / 2) * spread;
      // 波（揺れ）の計算
      if (target.waveAmp) {
        const phase = (target.waveLag ?? 0) * i;
        angle += Math.sin(t * target.waveSpeed - phase) * target.waveAmp * m;}
      // 蛇行運動（左右）の計算
      if (target.sineSideAmp) {
        angle += (Math.PI * (1 - m) / 2) +
          m * (Math.sin(t * target.sineSideSpeed - i * (target.sineSideLag ?? 0)) * target.sineSideAngle);}
      // 伸縮の計算
      let lengthFactor = 1.0;
      if (target.lengthAmp) {
        lengthFactor += Math.sin(t * target.lengthSpeed - i * (target.lengthLag || 0)) * target.lengthAmp;}
      const effectiveSpacing = currentSpacing * lengthFactor;
      const baseAngle = angle;

      if (i === 0) {
        curr.x = rootX;
        curr.y = rootY;
        curr.activeAngle = baseAngle;
      } else if (i !== 0) {
        const prev = target.parts[i - 1];
        let dx = prev.x - curr.x;
        let dy = prev.y - curr.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > effectiveSpacing) {
          let moveX = dx - dx * effectiveSpacing / dist;
          let moveY = dy - dy * effectiveSpacing / dist;
          const moveAmount = Math.sqrt(moveX * moveX + moveY * moveY);
          const motionFactor = Math.max(0, 1 - moveAmount * 0.05);
          curr.flapInfluence += (motionFactor - curr.flapInfluence) * 0.1;
          let flapY = 0;
          let flapAngle = 0;
          if (target.flapAmp) {
            const ratio = i / (target.numParts - 1);
            const amp = target.flapAmp * Math.pow(ratio, target.flapSpread || 1);
            const wave = Math.sin(t * target.flapSpeed - ratio * 0.5);
            flapY = wave * amp * curr.flapInfluence;
            flapAngle = wave * amp * 0.05 * curr.flapInfluence;}
          curr.x += moveX * target.speed + rotOffsetX;
          curr.y += moveY * target.speed + rotOffsetY + flapY;
          const followAngle = Math.atan2(dy, dx);
          curr.activeAngle = baseAngle + (followAngle - baseAngle) * 0.5 + flapAngle;
        }}}}}

//=========================================================================================


// ------------------------------
// Chain（頭・首など通常チェーン）統合版
// ------------------------------
class ChainMotionStrategy  {

  update(target, mouse, t) {
if (!target.followId) {
    //master動き
    this._updateMaster(target, mouse, t);
} else {
    //各parts[0]動き
    this._updateSubRoot(target);}

    //[1]番目以降動き
    this._updateFollowers(target);}

  //-----------------------------------------------
  //master_update
_updateMaster(target, mouse, t){
    const resolved = target.resolvedParams;
    const root = target.parts[0];
    let targetX = mouse.x + target.masterOffset.x;
    let targetY = mouse.y + target.masterOffset.y;
    let subIsBoosting=false;
    let offX = 0;
    let offY = 0;


    if (target.flagMasterMove){
      // Orbit (旋回運動)
      if (resolved.orbitAmpX || resolved.orbitAmpY) {
        const xWave = Math.sin(t * resolved.orbitSpeedX) +
                      Math.sin(t * resolved.orbitSpeedX * 0.5) * (resolved.orbitAsymX ?? 0);
        const yWave = Math.sin(t * resolved.orbitSpeedY + (resolved.orbitPhase * Math.PI)) +
                      Math.cos(t * resolved.orbitSpeedY * 0.3) * (resolved.orbitAsymY ?? 0);
        const factor = 0.3 + (target.stillness ?? 0) * 0.7;
        offX += xWave * (resolved.orbitAmpX ?? 0) * factor;
        offY += yWave * (resolved.orbitAmpY ?? 0) * factor;}
      // HeadBob (首振り・上下動)
      if (resolved.headBobAmpX || resolved.headBobAmpY) {
        const speed = resolved.headBobSpeed ?? 0.005;
        const wave = Math.sin(t * speed);
        const stillFactor = 1 + (target.stillness ?? 0) * 0.7;
        offX += wave * (resolved.headBobAmpX ?? 0) * stillFactor;
        offY += Math.cos(t * speed) * (resolved.headBobAmpY ?? 0) * stillFactor;}}

        //ダブルクリックでマウスに引き寄せる
        if(target.isBoosting){
      target.masterOffset.x = 0;
      target.masterOffset.y = 0;
      target.offsetX = 0;
      target.offsetY = 0;
      subIsBoosting=true;};
    if (!subIsBoosting){
      targetX += offX;
      targetY += offY;}

      const dx = targetX - root.x;
      const dy = targetY - root.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

       root.activeAngle = Math.atan2(dy, dx);
      if (subIsBoosting && dist < 5) {
        target.masterOffset.x = -offX;
        target.masterOffset.y = -offY;
        target.isBoosting = false;}

      root.x += dx * target.speed;
      root.y += dy * target.speed;}


    //-----------------------------------------------
    //各parts[0]_update
    _updateSubRoot(target){
      const root = target.parts[0];
      const parentDragon = target.followId;
      const p =parentDragon.parts[target.followIndex];
      if (p) {
        const a = p.angle;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        // 親の角度に合わせたオフセット回転
        const rotX = target.offsetX * cosA - target.offsetY * sinA;
        const rotY = target.offsetX * sinA + target.offsetY * cosA;
        let dx = p.x - root.x;
        let dy = p.y - root.y;
        root.x = p.x + rotX;
        root.y = p.y + rotY;
        root.activeAngle = Math.atan2(dy, dx);
      }}

    //-----------------------------------------------
    //各[1]以降_update
    _updateFollowers(target){
    for (let i = 1; i < target.numParts; i++) {
      const prev = target.parts[i - 1];
      const curr = target.parts[i];

      let dx = prev.x - curr.x;
      let dy = prev.y - curr.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // 角度の更新
      curr.activeAngle = Math.atan2(dy, dx);

      // spacing（間隔）を維持する移動
      const minSpacing = target.spacing ?? 5;
      if (dist > minSpacing) {
        let moveX = dx - (dx * minSpacing) / dist;
        let moveY = dy - (dy * minSpacing) / dist;
        curr.x += moveX * target.speed;
        curr.y += moveY * target.speed;
      }}}}

