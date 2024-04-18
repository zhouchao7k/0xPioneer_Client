import NotificationMgr from "../Basic/NotificationMgr";
import NFTPioneerConfig from "../Config/NFTPioneerConfig";
import NFTSkillConfig from "../Config/NFTSkillConfig";
import NFTSkillEffectConfig from "../Config/NFTSkillEffectConfig";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { GameExtraEffectType } from "../Const/ConstDefine";
import { NotificationName } from "../Const/Notification";
import { NFTPioneerModel } from "../Const/PioneerDevelopDefine";
import CommonTools from "../Tool/CommonTools";

export default class PioneerDevelopMgr {
    public initData() {
        this._initData();
    }

    public getAllNFTs(): NFTPioneerModel[] {
        return this._develpDatas;
    }
    public getNFTById(NFTId: string): NFTPioneerModel {
        return this._develpDatas.find((v) => v.uniqueId == NFTId);
    }
    public getNFTByWorkingBuildingId(buildingId: InnerBuildingType): NFTPioneerModel {
        return this._develpDatas.find((v) => v.workingBuildingId == buildingId);
    }
    public getNFTEffectById(NFTId: string, type:GameExtraEffectType): number {
        let effectNum: number = 0;
        const NFT = this.getNFTById(NFTId);
        if (NFT == undefined) {
            return effectNum;
        }
        for (const skill of NFT.skills) {
            const config = NFTSkillConfig.getById(skill.id);
            if (config == null) {
                continue;
            }
            for (const templeEffect of config.effect) {
                const effectConfig = NFTSkillEffectConfig.getById(templeEffect.toString());
                if (effectConfig == null) {
                    continue;
                }
                let effectType = effectConfig.type;
                if (effectType == GameExtraEffectType.VISION_RANGE) {
                    effectType = GameExtraEffectType.PIONEER_ONLY_VISION_RANGE;
                }
                if (effectType != type) {
                    continue;
                }
                effectNum += effectConfig.para[0];
            }
        }
        return effectNum;
    }
    //-------------------------------- data action
    public generateNewNFT(NFTId: string = null): NFTPioneerModel {
        let useId: string = NFTId;
        if (useId == null) {
            useId = NFTPioneerConfig.getRandomNFTId();
        }
        const model = new NFTPioneerModel();
        model.convertConfigToModel(new Date().getTime() + CommonTools.generateUUID(), NFTPioneerConfig.getById(useId));
        this._develpDatas.push(model);
        this._saveLocalData();

        return model;
    }

    public NFTLevelUp(NFTId: string, levelUpNum: number) {
        const model = this._develpDatas.find((v) => v.uniqueId == NFTId);
        if (model != undefined) {
            model.levelUp(levelUpNum);
            this._saveLocalData();
            NotificationMgr.triggerEvent(NotificationName.NFTDIDLEVELUP);
        }
    }
    public NFTRankUp(NFTId: string, rankUpNum: number) {
        const model = this._develpDatas.find((v) => v.uniqueId == NFTId);
        if (model != undefined) {
            model.rankUp(rankUpNum);
            this._saveLocalData();
            NotificationMgr.triggerEvent(NotificationName.NFTDIDRANKUP);
        }
    }
    public NFTForgetSkill(NFTId: string, skillIndex: number) {
        const model = this._develpDatas.find((v) => v.uniqueId == NFTId);
        if (model == undefined) {
            return;
        }
        model.forgetSkill(skillIndex);
        this._saveLocalData();
        NotificationMgr.triggerEvent(NotificationName.NFTDIDFORGETSKILL);
    }
    public NFTLearnSkill(NFTId: string, skillId: string) {
        const model = this._develpDatas.find((v) => v.uniqueId == NFTId);
        if (model == undefined) {
            return;
        }
        model.learnSkill(skillId);
        this._saveLocalData();
        NotificationMgr.triggerEvent(NotificationName.NFTDIDLEARNSKILL);
    }
    public NFTChangeWork(NFTId: string, workingBuildingId: InnerBuildingType) {
        const lastBuildingBindModel = this._develpDatas.find((v) => v.workingBuildingId == workingBuildingId);
        if (lastBuildingBindModel != undefined) {
            lastBuildingBindModel.changeWorkBuilding(null);
        }
        const model = this._develpDatas.find((v) => v.uniqueId == NFTId);
        if (model == undefined) {
            return;
        }
        model.changeWorkBuilding(workingBuildingId);
        this._saveLocalData();
        NotificationMgr.triggerEvent(NotificationName.NFTDIDCHANGEWORKBUILDING);
    }

    private _localStorageKey: string = "local_pioneer_develop";
    private _develpDatas: NFTPioneerModel[] = [];
    private _initData() {
        const localData = localStorage.getItem(this._localStorageKey);
        if (localData == null) {
        } else {
            this._develpDatas = [];
            const templeDatas = JSON.parse(localData);
            for (const temple of templeDatas) {
                const model = new NFTPioneerModel();
                model.convertLocalDataToModel(temple);
                this._develpDatas.push(model);
            }
        }
    }

    private _saveLocalData() {
        localStorage.setItem(this._localStorageKey, JSON.stringify(this._develpDatas));
    }

    //--------------------------------- notification
}
