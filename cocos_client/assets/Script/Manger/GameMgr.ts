import { Vec2 } from "cc";
import NotificationMgr from "../Basic/NotificationMgr";
import InnerBuildingConfig from "../Config/InnerBuildingConfig";
import MapBuildingConfig from "../Config/MapBuildingConfig";
import { InnerBuildingType } from "../Const/BuildingDefine";
import { GAME_ENV_IS_DEBUG, GameExtraEffectType, MapMemberTargetType } from "../Const/ConstDefine";
import ItemData from "../Const/Item";
import { MapBuildingObject } from "../Const/MapBuilding";
import { NotificationName } from "../Const/Notification";
import { MapNpcPioneerData, MapNpcPioneerObject, MapPioneerObject, MapPlayerPioneerObject } from "../Const/PioneerDefine";
import { TaskCondition, TaskConditionType, TaskStepObject } from "../Const/TaskDefine";
import { DataMgr } from "../Data/DataMgr";
import CommonTools from "../Tool/CommonTools";
import GameMainHelper from "../Game/Helper/GameMainHelper";
import { RookieGuide } from "../UI/RookieGuide/RookieGuide";
import { RookieStep } from "../Const/RookieDefine";
import { ClvlMgr, LanMgr } from "../Utils/Global";
import { CLvlEffectType } from "../Const/Lvlup";
import ConfigConfig from "../Config/ConfigConfig";
import { BuyEnergyCoefficientParam, BuyEnergyLimitParam, BuyEnergyPriceParam, BuyEnergyThresParam, ConfigType } from "../Const/Config";
import ItemConfig from "../Config/ItemConfig";
import UIPanelManger, { UIPanelLayerType } from "../Basic/UIPanelMgr";
import { HUDName, UIName } from "../Const/ConstUIDefine";
import { AlterView } from "../UI/View/AlterView";
import { NetworkMgr } from "../Net/NetworkMgr";
import { UIHUDController } from "../UI/UIHUDController";

export default class GameMgr {
    public rookieTaskExplainIsShow: boolean = false;

    public enterGameSence: boolean = false;

    public async showBuyEnergyTip(pioneerId: string) {
        const pioneer = DataMgr.s.pioneer.getById(pioneerId) as MapPlayerPioneerObject;
        const nft = DataMgr.s.nftPioneer.getNFTById(pioneer?.NFTId);
        if (pioneer == undefined || nft == null) {
            return;
        }
        const buyLimit = (ConfigConfig.getConfig(ConfigType.BuyEnergyLimit) as BuyEnergyLimitParam).limit;
        const buyPrices = (ConfigConfig.getConfig(ConfigType.BuyEnergyPrice) as BuyEnergyPriceParam).prices;
        const buyThres = (ConfigConfig.getConfig(ConfigType.BuyEnergyThres) as BuyEnergyThresParam).thresholds;
        const buyCoefficient = (ConfigConfig.getConfig(ConfigType.BuyEnergyCoefficient) as BuyEnergyCoefficientParam).coefficient;

        if (GAME_ENV_IS_DEBUG) {
            if (buyThres >= buyPrices[0] / buyCoefficient) {
                NotificationMgr.triggerEvent(NotificationName.GAME_SHOW_RESOURCE_TYPE_TIP, "CHECK THE ENERGY CONFIG");
                return;
            }
        }

        const itemId: string = buyPrices[nft.rank - 1][0];
        const itemConfig = ItemConfig.getById(itemId);
        if (itemConfig == null) {
            return;
        }

        const price = buyPrices[nft.rank - 1][1] - Math.min(buyThres, pioneer.energy) * buyCoefficient;

        const result = await UIPanelManger.inst.pushPanel(HUDName.Alter, UIPanelLayerType.HUD);
        if (!result.success) {
            return;
        }
        result.node
            .getComponent(AlterView)
            .showTip(
                LanMgr.replaceLanById("1100201", [
                    LanMgr.getLanById(pioneer.name),
                    price,
                    LanMgr.getLanById(itemConfig.itemName),
                    pioneer.energyMax - pioneer.energy,
                    buyLimit - DataMgr.s.userInfo.data.buyEnergyLimitTimes,
                ]),
                () => {
                    if (DataMgr.s.userInfo.data.buyEnergyLimitTimes >= buyLimit) {
                        // buy limit
                        UIHUDController.showCenterTip(LanMgr.getLanById("1100202"));
                        return;
                    }

                    if (price > DataMgr.s.item.getObj_item_count(itemId)) {
                        // insufficient resource
                        UIHUDController.showCenterTip(LanMgr.replaceLanById("1100203", [LanMgr.getLanById(itemConfig.itemName)]));
                        return;
                    }

                    NetworkMgr.websocketMsg.player_psyc_to_energy({
                        pioneerId: pioneerId,
                        psycNum: price,
                    });
                }
            );
    }

    public getResourceBuildingRewardAndQuotaMax(building: MapBuildingObject): { reward: ItemData; quotaMax: number } {
        const config = MapBuildingConfig.getById(building.id);
        if (config == null) {
            return null;
        }
        const reward = new ItemData(config.resources[0], config.resources[1]);
        reward.count = Math.floor(reward.count * (1 + (building.level - 1) * 0.2));

        let quotaMax: number = config.quota;
        quotaMax = quotaMax + Math.floor(0.5 * (building.level - 1));

        return { reward: reward, quotaMax: quotaMax };
    }

    public taskTracking(currentStepTask: TaskStepObject) {
        if (DataMgr.s.userInfo.data.rookieStep == RookieStep.FINISH) {
            return;
        }
        if (currentStepTask == null) {
            return;
        }
        let condition: TaskCondition = null;
        if (currentStepTask.completeCon != null && currentStepTask.completeCon.conditions.length > 0) {
            condition = currentStepTask.completeCon.conditions[0];
        }
        if (condition == null) {
            return;
        }
        let currentMapPos: Vec2 = null;
        let interactBuildingId: string = null;
        let interactPioneerId: string = null;
        if (condition.type == TaskConditionType.Talk) {
            let targetPioneer: MapNpcPioneerObject = null;
            const allNpcs = DataMgr.s.pioneer.getAllNpcs();
            for (const npc of allNpcs) {
                if (npc.talkId == condition.talk.talkId) {
                    targetPioneer = npc;
                    break;
                }
            }
            if (targetPioneer != null) {
                interactPioneerId = targetPioneer.id;
                currentMapPos = targetPioneer.stayPos;
            }
        } else if (condition.type == TaskConditionType.Kill) {
            let targetPioneer: MapPioneerObject = null;
            if (condition.kill.enemyIds.length > 0) {
                targetPioneer = DataMgr.s.pioneer.getById(condition.kill.enemyIds[CommonTools.getRandomInt(0, condition.kill.enemyIds.length - 1)]);
            }
            if (targetPioneer != null) {
                interactPioneerId = targetPioneer.id;
                currentMapPos = targetPioneer.stayPos;
            }
        } else if (condition.type == TaskConditionType.interact && condition.interact.interactId != null) {
            if (condition.interact.target == MapMemberTargetType.pioneer) {
                const targetPioneer = DataMgr.s.pioneer.getById(condition.interact.interactId);
                if (targetPioneer != null) {
                    currentMapPos = targetPioneer.stayPos;
                    interactPioneerId = targetPioneer.id;
                }
            } else if (condition.interact.target == MapMemberTargetType.building) {
                const targetBuilding = DataMgr.s.mapBuilding.getBuildingById(condition.interact.interactId);
                if (targetBuilding != null) {
                    currentMapPos = targetBuilding.stayMapPositions[0];
                    interactBuildingId = targetBuilding.id;
                }
            }
        }
        if (currentMapPos != null) {
            if (!GameMainHelper.instance.isGameShowOuter) {
                GameMainHelper.instance.changeInnerAndOuterShow();
            }
            let triggerTask: boolean = false;
            const rookieStep = DataMgr.s.userInfo.data.rookieStep;
            if (rookieStep == RookieStep.TASK_SHOW_TAP_1 || rookieStep == RookieStep.TASK_SHOW_TAP_2 || rookieStep == RookieStep.TASK_SHOW_TAP_3) {
                triggerTask = true;
            }
            const worldPos = GameMainHelper.instance.tiledMapGetPosWorld(currentMapPos.x, currentMapPos.y);
            GameMainHelper.instance.changeGameCameraWorldPosition(worldPos, true, triggerTask);
            GameMainHelper.instance.showTrackingView(worldPos, {
                stepId: currentStepTask.id,
                interactBuildingId: interactBuildingId,
                interactPioneerId: interactPioneerId,
            });
        }
    }

    //--------------------------- effect
    public getEffectShowText(type: GameExtraEffectType, value: number): string {
        value = CommonTools.getOneDecimalNum(value);
        switch (type) {
            case GameExtraEffectType.BUILDING_LVUP_TIME:
                return "REDUCE BUILDING LVUP TIME:" + value;

            case GameExtraEffectType.BUILDING_LVLUP_RESOURCE:
                return "REDUCE BUILDING LVLUP RESOURCE:" + value;

            case GameExtraEffectType.MOVE_SPEED:
                return "ADD MOVE SPEED:" + value;

            case GameExtraEffectType.GATHER_TIME:
                return "REDUCE GATHER TIME:" + value;

            case GameExtraEffectType.ENERGY_GENERATE:
                return "ADD ENERGY GENERATE:" + value;

            case GameExtraEffectType.TROOP_GENERATE_TIME:
                return "REDUCE TROOP GENERATE TIME:" + value;

            case GameExtraEffectType.CITY_RADIAL_RANGE:
                return "ADD CITY RADIAL RANGE:" + value;

            case GameExtraEffectType.TREASURE_PROGRESS:
                return "ADD GET PROGRESS:" + value;

            case GameExtraEffectType.CITY_ONLY_VISION_RANGE:
                return "ADD CITY ONLY VISION RANGE:" + value;

            case GameExtraEffectType.PIONEER_ONLY_VISION_RANGE:
                return "ADD PIONEER ONLY VISION RANGE:" + value;

            case GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE:
                return "ADD CITY AND PIONEER VISION RANGE:" + value;

            default:
                return "";
        }
    }

    public getAfterEffectValueByBuilding(buildingType: InnerBuildingType, type: GameExtraEffectType, originalValue: number): number {
        let resultEffectValue: number = 0;
        const clevel: number = DataMgr.s.userInfo.data.level;
        resultEffectValue += DataMgr.s.artifact.getEffectValueByEffectType(type, clevel);
        if (type == GameExtraEffectType.BUILDING_LVUP_TIME) {
            const nft = DataMgr.s.nftPioneer.getNFTByWorkingBuildingId(buildingType);
            const buildingConfig = InnerBuildingConfig.getByBuildingType(buildingType);
            if (nft != undefined && buildingConfig.staff_effect != null) {
                for (const temple of buildingConfig.staff_effect) {
                    if (temple[0] == "lvlup_time" && temple[1] == 1) {
                        resultEffectValue -= nft.iq * temple[2][0];
                    }
                }
            }
        }
        return this._getEffectResultNum(type, originalValue, resultEffectValue);
    }

    public getAfterEffectValue(type: GameExtraEffectType, originalValue: number): number {
        const clevel: number = DataMgr.s.userInfo.data.level;

        let effectValue: number = 0;

        const artifactEffectValue: number = DataMgr.s.artifact.getEffectValueByEffectType(type, clevel);
        effectValue += artifactEffectValue;

        if (type == GameExtraEffectType.TROOP_GENERATE_TIME) {
            const cLvlEffectValue: number = ClvlMgr.getCurrentCLvlEffectByType(CLvlEffectType.TROOP_GENERATE_SPEED).value;
            effectValue += cLvlEffectValue;
        } else if (type == GameExtraEffectType.CITY_ONLY_VISION_RANGE || type == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE) {
            const cLvlEffectValue: number = ClvlMgr.getCurrentCLvlEffectByType(CLvlEffectType.CITY_AND_PIONEER_VISION_RANGE)?.value;
            effectValue += cLvlEffectValue === undefined ? 0 : cLvlEffectValue;
        }

        return this._getEffectResultNum(type, originalValue, effectValue);
    }

    public getAfterExtraEffectPropertyByPioneer(pioneerId: string, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(
            type,
            DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore)
        );

        // nft
        let nftChangeRate: number = 0;
        const pioneer = DataMgr.s.pioneer.getById(pioneerId) as MapPlayerPioneerObject;
        if (!!pioneer && pioneer.NFTId != null) {
            nftChangeRate = DataMgr.s.nftPioneer.getNFTEffectById(pioneer.NFTId, type);
        }

        return this._getEffectResultNum(type, originalValue, artifactChangeRate + nftChangeRate);
    }
    public getAfterExtraEffectPropertyByBuilding(buildingType: InnerBuildingType, type: GameExtraEffectType, originalValue: number): number {
        // artifact effect
        let artifactChangeRate: number = DataMgr.s.artifact.getObj_artifact_effectiveEffect(
            type,
            DataMgr.s.innerBuilding.getInnerBuildingLevel(InnerBuildingType.ArtifactStore)
        );

        let resultValue = this._getEffectResultNum(type, originalValue, artifactChangeRate);
        //nft
        if (type == GameExtraEffectType.BUILDING_LVUP_TIME) {
            const nft = DataMgr.s.nftPioneer.getNFTByWorkingBuildingId(buildingType);
            const buildingConfig = InnerBuildingConfig.getByBuildingType(buildingType);
            if (nft != undefined && buildingConfig.staff_effect != null) {
                let nftEffect = 0;
                for (const temple of buildingConfig.staff_effect) {
                    if (temple[0] == "lvlup_time" && temple[1] == DataMgr.s.innerBuilding.getInnerBuildingLevel(buildingType) + 1) {
                        nftEffect += temple[2][0];
                    }
                }
                resultValue = Math.floor(resultValue * (1 + nft.iq * nftEffect));
            }
        }
        resultValue = Math.max(1, resultValue);
        return resultValue;
    }

    private _getEffectResultNum(type: GameExtraEffectType, originalValue: number, effectNum: number): number {
        if (type == GameExtraEffectType.MOVE_SPEED || type == GameExtraEffectType.ENERGY_GENERATE || type == GameExtraEffectType.TREASURE_PROGRESS) {
            originalValue = Math.floor(originalValue * (1 + effectNum));
        } else if (
            type == GameExtraEffectType.BUILDING_LVUP_TIME ||
            type == GameExtraEffectType.BUILDING_LVLUP_RESOURCE ||
            type == GameExtraEffectType.GATHER_TIME ||
            type == GameExtraEffectType.TROOP_GENERATE_TIME
        ) {
            originalValue = Math.max(1, Math.floor(originalValue * (1 - effectNum)));
        } else if (
            type == GameExtraEffectType.PIONEER_ONLY_VISION_RANGE ||
            type == GameExtraEffectType.CITY_AND_PIONEER_VISION_RANGE ||
            type == GameExtraEffectType.CITY_ONLY_VISION_RANGE
        ) {
            originalValue = originalValue + effectNum;
        }
        return originalValue;
    }

    public constructor() {}
}
