import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Vec3, Button, EventHandler, v2, Vec2, Prefab, Slider, instantiate, Layout } from 'cc';
import ViewController from '../BasicView/ViewController';
import { UIName } from '../Const/ConstUIDefine';
import UIPanelManger from '../Basic/UIPanelMgr';
import { PioneerDevelopMgr } from '../Utils/Global';
import { NFTPioneerModel } from '../Const/PioneerDevelopDefine';
import { NTFBackpackItem } from './View/NTFBackpackItem';
import { NFTInfoUI } from './NFTInfoUI';
const { ccclass, property } = _decorator;


@ccclass('NFTBackpackUI')
export class NFTBackpackUI extends ViewController {


    @property(Prefab)
    private backpackItemPrb: Prefab = null;

    private _selectSortMenuShow: boolean = false;
    private _NFTDatas: NFTPioneerModel[] = [];

    private _itemContent: Node = null;
    private _allItemViews: Node[] = null;
    private _sortMenu: Node = null;
    private _menuArrow: Node = null;

    protected viewDidLoad(): void {
        super.viewDidLoad();

        this._NFTDatas = PioneerDevelopMgr.getAllNFTs();

        this._sortMenu = this.node.getChildByPath("__ViewContent/SortMenu");
        this._sortMenu.active = false;

        this._menuArrow = this.node.getChildByPath("__ViewContent/Bg/SortView/Menu/Arrow");

        this._itemContent = this.node.getChildByPath("__ViewContent/Bg/ScrollView/View/Content");
    }

    protected viewDidStart(): void {
        super.viewDidStart();

        this._initBackpack();
        this._refreshBackpackUI();
    }

    protected viewDidDestroy(): void {
        super.viewDidDestroy();
    }

    protected viewPopAnimation(): boolean {
        return true;
    }
    protected contentView(): Node {
        return this.node.getChildByPath("__ViewContent");
    }

    private _initBackpack() {
        this._allItemViews = [];
        for (let i = 0; i < this._NFTDatas.length; i++) {
            let itemView = instantiate(this.backpackItemPrb);
            itemView.active = true;

            const button = itemView.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            button.zoomScale = 0.9;
            let evthandler = new EventHandler();
            evthandler._componentName = "NFTBackpackUI";
            evthandler.target = this.node;
            evthandler.handler = "onTapItem";
            button.clickEvents.push(evthandler);

            itemView.parent = this._itemContent;
            this._allItemViews.push(itemView);
        }
        this._itemContent.getComponent(Layout).updateLayout();
    }
    private async _refreshBackpackUI() {
        if (this._allItemViews == null) {
            return;
        }
        if (this._allItemViews.length == this._NFTDatas.length) {
            for (let i = 0; i < this._allItemViews.length; i++) {
                const itemView = this._allItemViews[i];
                itemView.getComponent(NTFBackpackItem).refreshUI(this._NFTDatas[i]);
                itemView.getComponent(Button).clickEvents[0].customEventData = i.toString();
            }
        }
    }

    private _refreshMenu() {
        this._sortMenu.active = this._selectSortMenuShow;
        this._menuArrow.angle = this._selectSortMenuShow ? 180 : 0;
        // this._sortMenu.getChildByPath("Content/Recently/ImgScreenSelect").active = this._currentArrangeType == ItemArrangeType.Recently;
        // this._sortMenu.getChildByPath("Content/Rarity/ImgScreenSelect").active = this._currentArrangeType == ItemArrangeType.Rarity;
        // this._sortMenu.getChildByPath("Content/Type/ImgScreenSelect").active = this._currentArrangeType == ItemArrangeType.Type;
    }
    //------------------------------------------------------------ action
    private async onTapClose() {
        await this.playExitAnimation();
        UIPanelManger.inst.popPanel();
    }
    private async onTapItem(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (index >= 0 && index < this._NFTDatas.length) {
            const view = await UIPanelManger.inst.pushPanel(UIName.NFTInfoUI);
            if (view.success) {
                view.node.getComponent(NFTInfoUI).showItem(index);
            }
        }
    }
    private onTapArrange() {

    }

    private onTapSortMenuAction() {
        this._selectSortMenuShow = !this._selectSortMenuShow;
        this._refreshMenu();
    }
    private onTapSelectSortCondition(event: Event, customEventData: string) {
        // if (customEventData == this._currentArrangeType) {
        //     return;
        // }
        // this._currentArrangeType = customEventData;
        // this._selectSortMenuShow = false;
        // this._refreshMenu();
    }
}