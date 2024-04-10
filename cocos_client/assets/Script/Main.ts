import { _decorator, Asset, AssetManager, Component, Node } from "cc";
import ViewController from "./BasicView/ViewController";
import { AudioMgr, LocalDataLoader, ResourcesMgr } from "./Utils/Global";
import ConfigMgr from "./Manger/ConfigMgr";
import NotificationMgr from "./Basic/NotificationMgr";
import { NotificationName } from "./Const/Notification";
import { GameName, HUDName, UIName } from "./Const/ConstUIDefine";
import { LoadingUI } from "./UI/Loading/LoadingUI";
import { GAME_ENV_IS_DEBUG, PioneerGameTest } from "./Const/ConstDefine";
import UIPanelManger, { UIPanelLayerType } from "./Basic/UIPanelMgr";
import { UIMainRootController } from "./UI/UIMainRootController";
import { DataMgr } from "./Data/DataMgr";
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends ViewController {
    //--------------------------------------- lifeCyc
    protected async viewDidLoad(): Promise<void> {
        super.viewDidLoad();

        NotificationMgr.addListener(NotificationName.GAME_INITED, this._onGameInited, this);
        NotificationMgr.addListener(NotificationName.USER_LOGIN_SUCCEED, this._onUserLoginSucceed, this);

        // audio prepare
        AudioMgr.prepareAudioSource();

        // config init
        if (!(await ConfigMgr.init())) return;
        NotificationMgr.triggerEvent(NotificationName.CONFIG_LOADED);

        // debug mode
        if (GAME_ENV_IS_DEBUG) {
            await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.HUD);
            NotificationMgr.triggerEvent(NotificationName.GAME_INITED);
        } else {
            await UIPanelManger.inst.pushPanel(UIName.LoginUI);
            if (!(await DataMgr.init())) return;
        }
    }

    protected async viewDidStart(): Promise<void> {
        super.viewDidStart();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();

        NotificationMgr.removeListener(NotificationName.GAME_INITED, this._onGameInited, this);
        NotificationMgr.removeListener(NotificationName.USER_LOGIN_SUCCEED, this._onUserLoginSucceed, this);
    }

    //--------------------------------------- notification

    private async _onGameInited() {
        (window as any).hideLoading();

        if (GAME_ENV_IS_DEBUG) {
            NotificationMgr.triggerEvent(NotificationName.USER_LOGIN_SUCCEED);
        }
    }

    private async _onUserLoginSucceed() {
        if (GAME_ENV_IS_DEBUG) {
            await this._showGameMain();
            UIPanelManger.inst.popPanel(null, UIPanelLayerType.HUD);
            return;
        }

        // need show loading
        let loadRate: number = 0;
        const preloadRate: number = 0.4;
        ResourcesMgr.Init(async (err: Error, bundle: AssetManager.Bundle) => {
            if (err != null) {
                return;
            }
            // show loading
            UIPanelManger.inst.popPanel();
            let loadingView: LoadingUI = null;
            const result = await UIPanelManger.inst.pushPanel(HUDName.Loading, UIPanelLayerType.HUD);
            if (result.success) {
                loadingView = result.node.getComponent(LoadingUI);
            }
            bundle.preloadDir(
                "",
                (finished: number, total: number, item: AssetManager.RequestItem) => {
                    const currentRate = finished / total;
                    if (currentRate > loadRate) {
                        loadRate = currentRate;
                        loadingView?.showLoadingProgress(loadRate);
                    }
                },
                (err: Error, data: AssetManager.RequestItem[]) => {
                    if (err != null) {
                        return;
                    }
                    bundle.loadDir(
                        "",
                        (finished: number, total: number, item: AssetManager.RequestItem) => {
                            const currentRate = preloadRate + (finished / total) * (1 - preloadRate);
                            if (currentRate > loadRate) {
                                loadRate = currentRate;
                                loadingView?.showLoadingProgress(loadRate);
                            }
                        },
                        async (err: Error, data: Asset[]) => {
                            if (err != null) {
                                return;
                            }
                            // load
                            await this._showGameMain();
                            UIPanelManger.inst.popPanel(loadingView.node, UIPanelLayerType.HUD);
                        }
                    );
                }
            );
        });
    }

    private async _showGameMain() {
        await LocalDataLoader.loadLocalDatas();
        await UIPanelManger.inst.pushPanel(UIName.MainUI);
        await this.node.getChildByPath("UI_Canvas/UI_ROOT").getComponent(UIMainRootController).checkShowRookieGuide();
        await UIPanelManger.inst.pushPanel(GameName.GameMain, UIPanelLayerType.Game);
    }
}
