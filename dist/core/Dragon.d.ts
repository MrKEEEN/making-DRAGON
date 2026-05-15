export const Dragon: {
    new (options?: {}): {
        id: any;
        history: any[];
        resolvedParams: {
            readonly currentScaleX: any;
            readonly currentScaleY: any;
        };
        isBoosting: boolean;
        get imgIndex(): any;
        set imgIndex(imgIndex: any);
        _imgIndex: any;
        initParts(): void;
        parts: any[] | undefined;
        resetParts(): void;
        rebuild(rotationMode: any): void;
        get lastIndex(): number;
        initSnakeHistory(): void;
        update(mouseTarget: any, rotationMode: any): void;
        motionAmount: number | undefined;
        updateSnakeMotion(target: any, rotationMode: any): void;
        updateStandardMotion(isStill: any, rotationMode: any): void;
        recalculateScales(t: any): void;
    };
    INTERNAL_DEFAULTS: {
        masterOffsetX: number;
        masterOffsetY: number;
        motionAmount: number;
        stillness: number;
        anglePreset: number;
        angle: number;
        isBoosting: boolean;
        currentDragon: boolean;
    };
};
//# sourceMappingURL=Dragon.d.ts.map