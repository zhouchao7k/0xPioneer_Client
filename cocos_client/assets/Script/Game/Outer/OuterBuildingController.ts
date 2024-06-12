import { _decorator, Component, instantiate, macro, Node, Prefab, UITransform, v3, Vec2, Vec3 } from "cc";
import { TileHexDirection, TilePos } from "../TiledMap/TileTool";
import { OuterBuildingView } from "./View/OuterBuildingView";
import GameMainHelper from "../Helper/GameMainHelper";
import { OuterTiledMapActionController } from "./OuterTiledMapActionController";
import NotificationMgr from "../../Basic/NotificationMgr";
import { NotificationName } from "../../Const/Notification";
import { DataMgr } from "../../Data/DataMgr";
import { BuildingStayPosType } from "../../Const/BuildingDefine";
import { OuterRebonView } from "./View/OuterRebonView";
import { RookieStep } from "../../Const/RookieDefine";
import UIPanelManger from "../../Basic/UIPanelMgr";
import { UIName } from "../../Const/ConstUIDefine";
import { RookieStepMaskUI } from "../../UI/RookieGuide/RookieStepMaskUI";

const { ccclass, property } = _decorator;

@ccclass("OuterBuildingController")
export class OuterBuildingController extends Component {
    public getBuildingView(buildingId: string): OuterBuildingView {
        if (this._buildingMap.has(buildingId)) {
            const view = this._buildingMap.get(buildingId).node.getComponent(OuterBuildingView);
            return view;
        }
        return null;
    }

    @property(Prefab)
    private buildingPrefab;

    @property(Prefab)
    private rebonPrefab;

    private _buildingMap: Map<string, { node: Node; stayPositons: Vec2[] }> = new Map();
    private _rebornMap: Map<string, Node> = new Map();

    protected onLoad() {
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_SHOW_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACK_COUNT_DONW_TIME_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE, this._refreshUI, this);
        NotificationMgr.addListener(NotificationName.MAP_BUILDING_REBON_CHANGE, this._refreshUI, this);

        NotificationMgr.addListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, this._onRookieTapBuilding, this);
    }

    start() {
        // buildingPos
        const allBuildings = DataMgr.s.mapBuilding.getObj_building();

        for (const building of allBuildings) {
            if (building.stayPosType == BuildingStayPosType.One) {
                // no action
            } else if (building.stayMapPositions.length == 1) {
                const newPos = [].concat(building.stayMapPositions);
                const originalPos = newPos[0];
                if (building.stayPosType == BuildingStayPosType.Three) {
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom));
                } else if (building.stayPosType == BuildingStayPosType.Seven) {
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftTop));
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightTop));
                    newPos.splice(0, 0, GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Left));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.Right));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.LeftBottom));
                    newPos.push(GameMainHelper.instance.tiledMapGetAroundByDirection(originalPos, TileHexDirection.RightBottom));
                }
                DataMgr.s.mapBuilding.fillBuildingStayPos(building.id, newPos);
            }
        }

        this._refreshUI();

        // // decorations
        // const decorates = BuildingMgr.getAllDecorate();
        // for (const decorate of decorates) {
        //     if (decorate.posMode == MapDecoratePosMode.World) {
        //         const tiledPositions: Vec2[] = [];
        //         for (const worldPos of decorate.stayMapPositions) {
        //             let tempwp = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(
        //                 worldPos.x,
        //                 worldPos.y,
        //                 0
        //             ));
        //             ;
        //             const tilePos = GameMainHelper.instance.tiledMapGetTiledPosByWorldPos(tempwp);
        //             tiledPositions.push(v2(
        //                 tilePos.x,
        //                 tilePos.y
        //             ));
        //         }
        //         BuildingMgr.changeDecorateWorldPosToTiledPos(decorate.id, tiledPositions);
        //     }
        // }

        // this._refreshDecorationUI();
    }

    update(deltaTime: number) {}

    protected onDestroy(): void {
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_SHOW_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACKER_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_WORMHOLE_ATTACK_COUNT_DONW_TIME_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_ACTION_PIONEER_CHANGE, this._refreshUI, this);
        NotificationMgr.removeListener(NotificationName.MAP_BUILDING_REBON_CHANGE, this._refreshUI, this);

        NotificationMgr.removeListener(NotificationName.ROOKIE_GUIDE_TAP_MAP_BUILDING, this._onRookieTapBuilding, this);
    }

    private _refreshUI() {
        const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();
        if (decorationView == null) {
            return;
        }
        let changed: boolean = false;
        const allBuildings = DataMgr.s.mapBuilding.getObj_building();
        for (const building of allBuildings) {
            if (building.show) {
                let temple = null;
                if (this._buildingMap.has(building.id)) {
                    temple = this._buildingMap.get(building.id).node;
                } else {
                    // new
                    temple = instantiate(this.buildingPrefab);
                    temple.name = "MAP_" + building.id;
                    temple.setParent(decorationView);
                    this._buildingMap.set(building.id, { node: temple, stayPositons: building.stayMapPositions });

                    changed = true;
                }
                if (temple != null) {
                    temple.getComponent(OuterBuildingView).refreshUI(building);
                    if (building.stayMapPositions.length > 0) {
                        let worldPos = null;
                        if (building.stayMapPositions.length == 7) {
                            worldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[3].x, building.stayMapPositions[3].y);
                        } else if (building.stayMapPositions.length == 3) {
                            const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                            const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[1].x, building.stayMapPositions[1].y);
                            worldPos = v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0);
                        } else {
                            worldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                        }
                        temple.setWorldPosition(worldPos);

                        for (const pos of building.stayMapPositions) {
                            GameMainHelper.instance.tiledMapAddDynamicBlock(pos, true);
                        }
                    }
                }
                if (this._rebornMap.has(building.id)) {
                    this._rebornMap.get(building.id).destroy();
                    this._rebornMap.delete(building.id);
                }
            } else {
                if (this._buildingMap.has(building.id)) {
                    const data = this._buildingMap.get(building.id);
                    data.node.destroy();
                    for (const pos of data.stayPositons) {
                        GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos);
                    }
                    this._buildingMap.delete(building.id);
                }
                const currentTimestamp = new Date().getTime();
                if (building.rebornTime > currentTimestamp) {
                    if (!this._rebornMap.has(building.id)) {
                        if (building.stayMapPositions.length > 0) {
                            let worldPos = null;
                            if (building.stayMapPositions.length == 7) {
                                worldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[3].x, building.stayMapPositions[3].y);
                            } else if (building.stayMapPositions.length == 3) {
                                const beginWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(
                                    building.stayMapPositions[0].x,
                                    building.stayMapPositions[0].y
                                );
                                const endWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[1].x, building.stayMapPositions[1].y);
                                worldPos = v3(beginWorldPos.x, endWorldPos.y + (beginWorldPos.y - endWorldPos.y) / 2, 0);
                            } else {
                                worldPos = GameMainHelper.instance.tiledMapGetPosWorld(building.stayMapPositions[0].x, building.stayMapPositions[0].y);
                            }
                            const rebornView: Node = instantiate(this.rebonPrefab);
                            rebornView.setParent(decorationView);
                            rebornView.setWorldPosition(worldPos);
                            rebornView.getComponent(OuterRebonView).refreshUI(true, building.rebornTime);
                            this._rebornMap.set(building.id, rebornView);
                        }
                    }
                }
            }
        }
        // destroy
        this._buildingMap.forEach((value: { node: Node; stayPositons: Vec2[] }, key: string) => {
            let isExsit: boolean = false;
            for (const building of allBuildings) {
                if (building.id == key) {
                    isExsit = true;
                    break;
                }
            }
            if (!isExsit) {
                value.node.destroy();
                for (const pos of value.stayPositons) {
                    GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos);
                }
                this._buildingMap.delete(key);
            }
        });

        if (changed) {
            this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
        }
    }

    //------------------------------------------------- notification
    private _onRookieTapBuilding(data: { buildingId: string }) {
        const struct = this._buildingMap.get(data.buildingId);
        if (struct == null) {
            return;
        }
        this.getComponent(OuterTiledMapActionController)._clickOnMap(struct.node.worldPosition);
    }
    // private async _onRookieStepChange() {
    //     const rookieStep: RookieStep = DataMgr.s.userInfo.data.rookieStep;
    //     if (rookieStep == RookieStep.MAP_CHANGE_EXPLAIN) {
    //         const mainCityId: string = "building_1";
    //         const mainCity = DataMgr.s.mapBuilding.getBuildingById(mainCityId);
    //         if (mainCity == undefined) {
    //             return;
    //         }
    //         if (!this._buildingMap.has(mainCityId)) {
    //             return;
    //         }
    //         const mainCityView = this._buildingMap.get(mainCityId).node;
    //         GameMainHelper.instance.changeGameCameraWorldPosition(mainCityView.worldPosition);
    //         GameMainHelper.instance.tiledMapShadowErase(mainCity.stayMapPositions[3]);

    //         const result = await UIPanelManger.inst.pushPanel(UIName.RookieStepMaskUI);
    //         if (!result.success) {
    //             return;
    //         }
    //         result.node
    //             .getComponent(RookieStepMaskUI)
    //             .configuration(true, mainCityView.worldPosition, mainCityView.getComponent(UITransform).contentSize, () => {
    //                 GameMainHelper.instance.changeInnerAndOuterShow();
    //                 // DataMgr.s.userInfo.finishRookieStep();
    //             });
    //     }
    // }
    // private async _refreshDecorationUI() {
    //     const decorationView = this.node.getComponent(OuterTiledMapActionController).mapDecorationView();
    //     if (decorationView == null) {
    //         return;
    //     }
    //     let changed: boolean = false;
    //     const allDecorates = BuildingMgr.getAllDecorate();
    //     for (const decorate of allDecorates) {
    //         if (decorate.show) {
    //             let temple: Node = null;
    //             if (this._decorateMap.has(decorate.id)) {
    //                 temple = this._decorateMap.get(decorate.id).node;

    //             } else {
    //                 // new
    //                 const prefab = await new Promise<Prefab>((resolve, reject) => {
    //                     resources.load("decoration/" + decorate.name, Prefab, (err: Error, data: Prefab) => {
    //                         if (err) {
    //                             resolve(null);
    //                         } else {
    //                             resolve(data);
    //                         }
    //                     });
    //                 });
    //                 if (prefab != null) {
    //                     temple = instantiate(prefab);
    //                     temple.setParent(decorationView);
    //                     // ?? why change layer is not effect
    //                     // temple.layer = decorationView.layer;
    //                     this._decorateMap.set(decorate.id, { node: temple, model: decorate });
    //                     changed = true;
    //                 }
    //             }
    //             if (temple != null) {
    //                 if (decorate.stayMapPositions.length > 0) {
    //                     let xMaxTilePos = decorate.stayMapPositions[0];
    //                     let xMinTilePos = decorate.stayMapPositions[0];
    //                     let yMaxTilePos = decorate.stayMapPositions[0];
    //                     let yMinTilePos = decorate.stayMapPositions[0];
    //                     for (const mapPos of decorate.stayMapPositions) {
    //                         const wp = GameMainHelper.instance.tiledMapGetPosWorld(mapPos.x, mapPos.y);
    //                         const xmaxwp = GameMainHelper.instance.tiledMapGetPosWorld(xMaxTilePos.x, xMaxTilePos.y);
    //                         const xminwp = GameMainHelper.instance.tiledMapGetPosWorld(xMinTilePos.x, xMinTilePos.y);
    //                         const ymaxwp = GameMainHelper.instance.tiledMapGetPosWorld(yMaxTilePos.x, yMaxTilePos.y);
    //                         const yminwp = GameMainHelper.instance.tiledMapGetPosWorld(yMinTilePos.x, yMinTilePos.y);

    //                         if (wp.x > xmaxwp.x) {
    //                             xMaxTilePos = mapPos;
    //                         }
    //                         if (wp.x < xminwp.x) {
    //                             xMinTilePos = mapPos;
    //                         }
    //                         if (wp.y > ymaxwp.y) {
    //                             yMaxTilePos = mapPos;
    //                         }
    //                         if (wp.y < yminwp.y) {
    //                             yMinTilePos = mapPos;
    //                         }
    //                         if (decorate.block) {
    //                             GameMainHelper.instance.tiledMapAddDynamicBlock(mapPos);
    //                         }
    //                     }
    //                     // get Accurate worldPos
    //                     const xMaxAccurateWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(xMaxTilePos.x, xMaxTilePos.y).x;
    //                     const xMinAccurateWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(xMinTilePos.x, xMinTilePos.y).x;
    //                     const yMaxAccurateWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(yMaxTilePos.x, yMaxTilePos.y).y;
    //                     const yMinAccurateWorldPos = GameMainHelper.instance.tiledMapGetPosWorld(yMinTilePos.x, yMinTilePos.y).y;

    //                     const setWorldPos = v3(
    //                         xMinAccurateWorldPos + (xMaxAccurateWorldPos - xMinAccurateWorldPos) / 2,
    //                         yMinAccurateWorldPos + (yMaxAccurateWorldPos - yMinAccurateWorldPos) / 2,
    //                         0
    //                     );
    //                     temple.setWorldPosition(setWorldPos);
    //                 }
    //             }

    //         } else {
    //             if (this._decorateMap.has(decorate.id)) {
    //                 const data = this._decorateMap.get(decorate.id);
    //                 data.node.destroy();
    //                 for (const pos of data.model.stayMapPositions) {
    //                     GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos);
    //                 }
    //                 this._decorateMap.delete(decorate.id);
    //             }
    //         }
    //     }
    //     // destroy
    //     this._decorateMap.forEach((value: { node: Node, model: MapDecorateModel }, key: string) => {
    //         let isExsit: boolean = false;
    //         for (const decorate of allDecorates) {
    //             if (decorate.id == key) {
    //                 isExsit = true;
    //                 break;
    //             }
    //         }
    //         if (!isExsit) {
    //             value.node.destroy();
    //             for (const pos of value.model.stayMapPositions) {
    //                 GameMainHelper.instance.tiledMapRemoveDynamicBlock(pos);
    //             }
    //             this._decorateMap.delete(key);
    //         }
    //     });

    //     if (changed) {
    //         this.node.getComponent(OuterTiledMapActionController).sortMapItemSiblingIndex();
    //     }
    // }
}
