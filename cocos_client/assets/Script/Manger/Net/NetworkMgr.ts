import { natrium_http } from "../../natrium/client/natrium_http";
import { natrium_ws } from "../../natrium/client/natrium_ws";

import { HttpMsg } from "./msg/HttpMsg";

import { Ethereum, WalletType } from "./ethers/Ethereum";

import CLog from "../../Utils/CLog";
import ChainConfig from "../../Config/ChainConfig";
import { WebsocketEvent, WebsocketMsg, c2s_user } from "./msg/WebsocketMsg";
import { EthereumMsg } from "./msg/EthereumMsg";

export class NetworkMgr {
    private static _httpmsg: HttpMsg;
    private static _websocketMsg: WebsocketMsg;
    private static _ethereumMsg: EthereumMsg;

    public static get websocketMsg(): WebsocketMsg {
        return this._websocketMsg;
    }
    public static get websocket(): natrium_ws {
        return this._websocketMsg.websocket;
    }

    public static get ethereumMsg(): EthereumMsg {
        return this._ethereumMsg;
    }
    public static get ethereum(): Ethereum {
        return this._ethereumMsg.ethereum;
    }

    public static get httpMsg(): HttpMsg {
        return this._httpmsg;
    }
    public static get http(): natrium_http {
        return this._httpmsg.http;
    }

    public static init(init_http: boolean = true, init_ws: boolean = true): boolean {
        const chainConfig = ChainConfig.getCurrentChainConfig();

        this._websocketMsg = new WebsocketMsg(chainConfig.api.ws_host);
        this._httpmsg = new HttpMsg(chainConfig.api.http_host);

        if (init_http && !this._httpmsg.init()) {
            return false;
        }
        if (init_ws && !this._websocketMsg.init()) {
            return false;
        }

        // listener
        this.websocket.on(WebsocketEvent.error, this._onerror);

        return true;
    }

    public static async websocketConnect(): Promise<boolean> {
        return await this.websocketMsg.websocketConnect();
    }

    public static async walletInit(walletType: WalletType = WalletType.ethereum): Promise<void> {
        await await this.ethereum.init(walletType);
    }

    public static async LoginServer(account: string, walletType: string): Promise<c2s_user.Ilogin | null> {
        const signMessage = "Ethereum Signed Message:\n    Welcome to Pickdol101\n    Login by address\n" + Math.floor(Date.now() / 1000);
        const signature = await this.ethereumMsg.signMessage(signMessage);

        CLog.info(`NetworkMgr, LoginServer, signature: ${signature}`);

        let r = await this.httpMsg.verify(account, signMessage, ChainConfig.getCurrentChainId(), signature, walletType);
        CLog.info("NetworkMgr, LoginServer, r: ", r);

        if (r.res == "OK") {
            let d: c2s_user.Ilogin = { name: "", uid: r.data.uid, token: r.data.token };
            this.websocketMsg.login(d);
            return d;
        }
        return null;
    }

    private static _onerror() {
        CLog.error("websocket error ...");
    }
}
