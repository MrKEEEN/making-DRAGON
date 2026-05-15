export class DragonManager {
    individuals: any[];
    allDps: any[];
    currentIndex: number;
    spritePool: any[];
    container: PIXI.Container;
    app: any;
    add(dragons: any): void;
    deleteCurrentIndividual(deletedIndex: any): void;
    buildAllDps(): void;
    initApp(app: any): void;
    syncWebGPUSprites(reverseMode: any): void;
    current(): any;
    switch(index: any): void;
}
export const dragonManager: DragonManager;
import * as PIXI from '../../lib/pixi.mjs';
//# sourceMappingURL=DragonManager.d.ts.map