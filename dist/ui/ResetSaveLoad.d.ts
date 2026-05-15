export namespace ResetSaveLoad {
    function sync(id: any, dragon: any, toDragon?: boolean): void;
    function reset(id: any, dragon: any): void;
    function save(id: any, dragon: any, blobMaster: any, blobPart: any): Promise<void>;
    function applyData(data: any): Promise<void>;
    function load(id: any, dragon: any, data: any): void;
    function deleteDragon(id: any): void;
    function setupUI(): void;
}
//# sourceMappingURL=ResetSaveLoad.d.ts.map