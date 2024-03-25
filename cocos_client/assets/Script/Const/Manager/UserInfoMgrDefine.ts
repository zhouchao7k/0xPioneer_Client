export interface UserInnerBuildInfo {
    buildID: InnerBuildingType,
    buildLevel: number,
    buildUpTime: number,
    buildName: string,
}

export enum InnerBuildingType {
    MainCity = "0",
    Barrack = "3",
    House = "4",
    EnergyStation = "5"
}

export interface ResourceModel {
    id: string;
    num: number
}

export interface GenerateTroopInfo {
    countTime: number;
    troopNum: number;
}

export interface GenerateEnergyInfo {
    countTime: number,
    totalEnergyNum: number
}

export enum FinishedEvent {
    NoCondition = "",
    FirstTalkToProphetess = "FirstTalkToProphetess",
    KillDoomsDayGangTeam = "KillDoomsDayGangTeam",
    KillProphetess = "KillProphetess",
    BecomeCityMaster = "BecomeCityMaster",
}

export enum UserInfoNotification {
    generateEnergyTimeCountChanged = "generateEnergyTimeCountChanged",
    generateEnergyNumChanged = "generateEnergyNumChanged",
}

export interface UserInfoEvent {
    playerNameChanged?(value: string): void;
    playerExpChanged?(value: number): void;
    playerLvlupChanged?(value: number): void;

    playerExplorationValueChanged?(value: number): void;

    getNewTask?(taskId: string): void;
    triggerTaskStepAction?(action: string, delayTime: number): void;
    finishEvent?(event: FinishedEvent): void;
    taskProgressChanged?(taskId: string): void;
    taskFailed?(taskId: string): void;

    gameTaskOver?(): void;

    generateTroopTimeCountChanged?(leftTime: number): void;
}