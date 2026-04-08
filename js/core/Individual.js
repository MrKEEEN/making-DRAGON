import { DragonScope } from '../base/prop_schema.js';
import { createInspectorGUI } from '../ui/Inspector.js';

export class Individual {
    constructor(dragons, index) {
        this.individualDragon = dragons; // Dragonインスタンスの配列
        this.index = index;
        this.individualDps = []; // 個体ごとのDPSを格納する配列
    // 1. 専用UIコンテナの生成
        this.uiContainer = document.createElement("div");
        this.uiContainer.id = `inspector-container-${index}`;
        this.uiContainer.style.display = "none";
        const contentArea = document.getElementById("inspector-content");
        if (contentArea) {contentArea.appendChild(this.uiContainer);}
    // 2. UIの構築
        createInspectorGUI(this.index);}

    // 操作対象として有効化
    activate() {
        this.uiContainer.style.display = "block";
        this.individualDragon.forEach(p => {
            p.currentDragon = true});
        DragonScope.dragons = this.individualDragon;
        DragonScope.selectedDragon = this.individualDragon[0];
        DragonScope.master = this.individualDragon[0];
    }

    // 非表示・非操作化
    deactivate() {
        if (!this.individualDragon[0].currentDragon){return;}
        // 操作終了時の最新dpsを自分専用にコピーして保持
        this.individualDps = [...DragonScope.dps];
        this.uiContainer.style.display = "none";
        this.individualDragon.forEach(p => {
            p.currentDragon = false;
            p.isBoosting = false;});}}

