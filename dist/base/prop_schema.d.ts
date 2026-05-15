export namespace DragonScope {
    let master: null;
    let images: never[];
    let textures: never[];
    let dragons: never[];
    let dps: never[];
    let storage: {};
    let individualCurrentIndex: null;
}
export namespace PROP_SCHEMA {
    let id: null;
    namespace meta {
        let name: string[];
        let _imgIndex: (string | number)[];
        let followId: (string | null)[];
        let followIndex: (string | null)[];
    }
    namespace whole {
        let wholeScaleAddX: number[];
        let wholeScaleAddY: number[];
        let wholeScaleMulX: number[];
        let wholeScaleMulY: number[];
    }
    namespace basic {
        let scaleX: number[];
        let scaleY: number[];
        let spacing: number[];
        let speed: number[];
        let offsetX: number[];
        let offsetY: number[];
        let numParts: number[];
    }
    namespace scaleFunc {
        let flagScaleFunc: (string | number)[];
        let methodX: string[];
        let methodY: string[];
        let ampScaleX: number[];
        let ampScaleY: number[];
        let effectScaleX: number[];
        let effectScaleY: number[];
    }
    namespace breath {
        let flagBreath: (string | number)[];
        let breatheProfile: string[];
        let breatheAmpX: number[];
        let breatheAmpY: number[];
        let breatheSpeed: number[];
        let breatheSpread: number[];
        let breatheLag: number[];
    }
    namespace branch {
        let flagBranch: (string | number)[];
        let branchOffsetX: number[];
        let branchOffsetY: number[];
        let attachAngle: number[];
        let baseAngle: number[];
        let spread: number[];
        let waveAmp: number[];
        let waveSpeed: number[];
        let waveAngle: number[];
        let waveLag: number[];
        let sineSideAmp: number[];
        let sineSideSpeed: number[];
        let sineSideAngle: number[];
        let sineSideLag: number[];
        let flapAmp: number[];
        let flapSpeed: number[];
        let flapSpread: number[];
        let flapXOffset: number[];
        let flapYOffset: number[];
        let lengthAmp: number[];
        let lengthSpeed: number[];
        let lengthLag: number[];
        let mirrorOffset: number[];
    }
    namespace masterMove {
        let flagMasterMove: (string | number)[];
        let orbitAmpX: number[];
        let orbitAmpY: number[];
        let orbitSpeedX: number[];
        let orbitSpeedY: number[];
        let orbitPhase: number[];
        let orbitAsymX: number[];
        let orbitAsymY: number[];
        let swayAmp: number[];
        let swaySpeed: number[];
        let swayOffset: number[];
        let headBobAmpX: number[];
        let headBobAmpY: number[];
        let headBobSpeed: number[];
    }
}
export const AllPropSchema_KEYS_excId: string[];
export const AllPropSchema_KEYS_except_id_followId_followIndex: string[];
//# sourceMappingURL=prop_schema.d.ts.map