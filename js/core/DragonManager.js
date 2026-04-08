import { DragonScope } from '../base/prop_schema.js';
import { buildDPS, rebuildDragonList, updateListHighlight, createInspectorGUI } from '../ui/Inspector.js';
import { Individual } from './Individual.js';

export class  DragonManager {
    constructor() {
        // Individualインスタンスを格納する配列
        this.individuals = [];
        // 描画用の配列。最小単位のパーツが入る。（Dragonインスタンス[配列]をパーツ毎に分解したもの）
        this.allDps = [];
        this.currentIndex = 0;}

//個体追加
    add(dragons) {
        const index = this.individuals.length;
        const newIndividual = new Individual(dragons, index);
        this.individuals.push(newIndividual);}

//個体削除
    deleteCurrentIndividual(deletedIndex) {
        if (!confirm(`Delete This Whole Individual?`)){return;}
        const deletedIndividual = this.individuals[deletedIndex];
        deletedIndividual.individualDragon.forEach((dragons) => {
            delete DragonScope.storage[dragons.id];});
        this.individuals.splice(deletedIndex, 1);
        const contentArea = document.getElementById("inspector-content");
        contentArea.innerHTML = "";
        this.individuals.forEach((individual, newIndex) => {
            individual.uiContainer = document.createElement("div");
            individual.uiContainer.id = `inspector-container-${newIndex}`;
            individual.uiContainer.style.display = "none";
            contentArea.appendChild(individual.uiContainer);
            this.switch(newIndex);
        });}

        buildAllDps() {
        this.allDps = [];
        this.individuals.forEach((individual, idx) => {
            if (idx === this.currentIndex) {
                // 操作中の個体は、今まさに計算されている最新のdpsをそのまま使う
                individual.individualDps = [...DragonScope.dps];}
                // 操作中じゃない個体は、deactivate時に保存したdpsを使う
                this.allDps.push(...individual.individualDps);});}

    current() {
        return this.individuals[this.currentIndex];}

    switch(index) {
        if (index < 0 || index >= this.individuals.length) return;
        // 全個体の状態を一括更新
        this.individuals.forEach((individual, idx) => {
            if (idx === index) {
                individual.activate();
            } else {
                individual.deactivate();}});
        this.currentIndex = index;
        DragonScope.individualCurrentIndex = index;
        buildDPS();
        // 3. 全個体の dps（保存分 + 新しい current 分）を統合
        this.buildAllDps();
        rebuildDragonList();
        updateListHighlight();
        createInspectorGUI(index);}}

export const dragonManager = new DragonManager();








