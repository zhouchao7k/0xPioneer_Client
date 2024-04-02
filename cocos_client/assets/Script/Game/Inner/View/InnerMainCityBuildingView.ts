import { Label, Node, UITransform, _decorator, v3 } from "cc";
import { InnerBuildingView } from "./InnerBuildingView";
import { UIHUDController } from "../../../UI/UIHUDController";
import { ItemMgr, LanMgr, UIPanelMgr, UserInfoMgr } from "../../../Utils/Global";
import { UIName } from "../../../Const/ConstUIDefine";
import { InnerBuildingType, UserInnerBuildInfo } from "../../../Const/BuildingDefine";
import { BuildingUpgradeUI } from "../../../UI/Inner/BuildingUpgradeUI";
import InnerBuildingLvlUpConfig from "../../../Config/InnerBuildingLvlUpConfig";
import InnerBuildingConfig from "../../../Config/InnerBuildingConfig";
import NotificationMgr from "../../../Basic/NotificationMgr";
import { NotificationName } from "../../../Const/Notification";

const { ccclass, property } = _decorator;

@ccclass('InnerMainCityBuildingView')
export class InnerMainCityBuildingView extends InnerBuildingView {

    public async refreshUI(building: UserInnerBuildInfo) {
        await super.refreshUI(building);

        if (this._buildingSize != null) {
            this._buildingUpView.position = v3(0, this._buildingSize.height, 0);
        }
        let canBuild: boolean = false;
        UserInfoMgr.innerBuilds.forEach((value: UserInnerBuildInfo, key: InnerBuildingType) => {
            const innerConfig = InnerBuildingConfig.getByBuildingType(key);
            const levelConfig = InnerBuildingLvlUpConfig.getBuildingLevelData(value.buildLevel + 1, innerConfig.lvlup_cost);
            if (levelConfig != null) {
                let thisBuild: boolean = true;
                for (const cost of levelConfig) {
                    const type = cost[0].toString();
                    const num = cost[1];
                    if (ItemMgr.getOwnItemCount(type) < num) {
                        thisBuild = false;
                        break;
                    }
                }
                if (thisBuild) {
                    canBuild = true;
                }
            }
        });
        this._buildingUpView.active = canBuild;
    }


    private _buildingUpView: Node = null;
    protected innerBuildingLoad(): void {
        super.innerBuildingLoad();

        this._buildingUpView = this.node.getChildByName("ToBuildBuildingTip");
        this._buildingUpView.active = false;

        NotificationMgr.addListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.addListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.RESOURCE_GETTED, this._onResourceChanged, this);
        NotificationMgr.removeListener(NotificationName.RESOURCE_CONSUMED, this._onResourceChanged, this);
    }


    protected async innerBuildingTaped(): Promise<void> {
        super.innerBuildingTaped();

        if (this._building == null) {
            return;
        }
        if (this._building.upgradeTotalTime > 0) {
            UIHUDController.showCenterTip(LanMgr.getLanById("201003"));
            // UIHUDController.showCenterTip("The building is being upgraded, please wait.");
            return;
        }
        const view = UIPanelMgr.openPanel(UIName.BuildingUpgradeUI);
        if (view != null) {
            (await view).getComponent(BuildingUpgradeUI).refreshUI();
        }
    }

    //------------------------------- action

    //-------------------------------- notification
    private _onResourceChanged() {
        this.refreshUI(this._building);
    }
}