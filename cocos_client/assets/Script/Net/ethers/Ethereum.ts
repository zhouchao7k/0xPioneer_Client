import { EventEmitter } from "../../natrium/util/event_emmiter";
import { chain_util } from "./chain_util";

import CLog from "../../Utils/CLog";
import ChainConfig from "../../Config/ChainConfig";
import AbiConfig from "../../Config/AbiConfig";

export const tokenNameETH: string = "eth";
export const ZeroAddress: string = "0x0000000000000000000000000000000000000000";

export const enum WalletType {
    bitkeep = "bitkeep",
    ethereum = "ethereum",
    okx = "okx",
    metamask = "metamask",
    bitizen = "bitizen",
    tokenpocket = "tokenpocket",
}

export const enum EthereumEventType {
    chainChanged = "chainChanged",
    accountChanged = "accountChanged",
    init = "init",
}
export type EthereumEventData = EthereumEventData_chainChanged | EthereumEventData_accountChanged | EthereumEventData_init;
export interface EthereumEventData_chainChanged {
    changedChainId: string;
}
export interface EthereumEventData_accountChanged {
    changedAccount: string;
}
export interface EthereumEventData_init {
    res: number;
    walletType: WalletType;
    account: string;
}

export type contractNames = string;
export namespace ethers {
    export interface Contract {}
}

export class Ethereum extends EventEmitter {
    public static instance: Ethereum;

    private _initCallback = false;

    protected _provider: any;
    protected _signer: any;
    protected _walletType: WalletType | null = null;

    private _decimals: { [key: string]: bigint } = {};
    private _contracts: { [key: string]: ethers.Contract } = {};

    constructor() {
        super();
        Ethereum.instance = this;
    }

    public get walletAddress() {
        return this._signer.address;
    }
    public get walletType() {
        return this._walletType;
    }
    private _walletTypeDetected(): WalletType {
        let win: any = window;
        if (win.ethereum) {
            if (win.ethereum.isTokenPocket) return WalletType.tokenpocket;
            if (win.ethereum.isBitizen) return WalletType.bitizen;
            if (win.ethereum.isMetaMask) return WalletType.metamask;
        } else if (typeof win.okxwallet !== "undefined") {
            return WalletType.okx;
        }

        return WalletType.ethereum;
    }
    private _chainChanged(chainId: string) {
        CLog.info(`Ethereum, _chainChanged, chainId: ${chainId}`);

        const curChainId = ChainConfig.getCurrentChainId();
        if (Number(chainId) != Number(curChainId)) {
            CLog.info(`Ethereum, _chainChanged, chainId not match: config:${curChainId} current:${chainId}`);
            let d: EthereumEventData_chainChanged = {
                changedChainId: chainId.toString(),
            };
            Ethereum.instance.emit(EthereumEventType.chainChanged, d);
            return;
        }
    }
    private _accountChanged(account: any) {
        CLog.info("Ethereum, _accountChanged, account: ", account);

        let acc = account;
        if (Array.isArray(account) && account[0] != undefined && (window as any).ethers.isAddress(account[0])) {
            acc = account[0];
        }
        let d: EthereumEventData_accountChanged = {
            changedAccount: acc,
        };
        Ethereum.instance.emit(EthereumEventType.accountChanged, d);
    }

    // *** login
    // res => 0:init success, 1:not installed, 2:walletType err, 3:chainId err
    public async init(walletType: WalletType = WalletType.ethereum): Promise<void> {
        // CLog.info("Ethereum, Init, starting ...");
        let win: any = window;
        let walletTypeDetected = this._walletTypeDetected();
        if (walletTypeDetected != walletType && walletTypeDetected != WalletType.ethereum) walletType = walletTypeDetected;
        this._walletType = walletType;

        switch (walletType) {
            case WalletType.bitkeep:
                {
                    if (!("bitkeep" in win)) {
                        // no bitkeep wallet
                        let d: EthereumEventData_init = {
                            res: 1,
                            walletType: walletType,
                            account: "",
                        };
                        this.emit(EthereumEventType.init, d);
                        return;
                    }

                    // init callback
                    if (!this._initCallback) {
                        this._initCallback = true;
                        win.bitkeep.on("chainChanged", this._chainChanged);
                        win.bitkeep.on("accountsChanged", this._accountChanged);
                    }
                    this._provider = new win.ethers.BrowserProvider(win.bitkeep && win.bitkeep.ethereum);
                }
                break;
            case WalletType.ethereum:
            case WalletType.metamask:
            case WalletType.okx:
            case WalletType.tokenpocket:
            case WalletType.bitizen:
                {
                    if (!("ethereum" in win)) {
                        // no ethereum wallet
                        let d: EthereumEventData_init = {
                            res: 1,
                            walletType: walletType,
                            account: "",
                        };
                        this.emit(EthereumEventType.init, d);
                        return;
                    }

                    // init callback
                    if (!this._initCallback) {
                        this._initCallback = true;
                        win.ethereum.on("chainChanged", this._chainChanged);
                        win.ethereum.on("accountsChanged", this._accountChanged);
                    }
                    this._provider = new win.ethers.BrowserProvider(win.ethereum);
                }
                break;
            default:
                {
                    let d: EthereumEventData_init = {
                        res: 2,
                        walletType: walletType,
                        account: "",
                    };
                    this.emit(EthereumEventType.init, d);
                }
                return;
        }

        await this._provider.send("eth_requestAccounts", []);
        this._signer = await this._provider.getSigner();

        const network = await this._provider.getNetwork();

        const curChainConf = ChainConfig.getCurrentChainConfig();

        if (Number(network.chainId) != Number(curChainConf.chainId)) {
            CLog.info(`Ethereum, Init, chainId err, config:${curChainConf.chainId}, curr:${network.chainId}`);
            const chainHex = "0x" + Number(curChainConf.chainId).toString(16);
            try {
                await this._provider.send("wallet_switchEthereumChain", [{ chainId: chainHex }]);

                CLog.info("Ethereum, switch Init, wallet:" + this._signer.address);

                let d: EthereumEventData_init = {
                    res: 0,
                    walletType: walletType,
                    account: this._signer.address,
                };
                this.emit(EthereumEventType.init, d);
                return;
            } catch (err: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (err.error && (err.error.code === 4902 || err.error.code === -32603)) {
                    // Do something
                    try {
                        await this._provider.send("wallet_addEthereumChain", [
                            {
                                chainId: chainHex,
                                rpcUrls: curChainConf.rpcUrls,
                                chainName: curChainConf.chainName,
                                blockExplorerUrls: curChainConf.blockExplorerUrls,
                                nativeCurrency: curChainConf.nativeCurrency,
                            },
                        ]);
                        CLog.info("Ethereum, add switch Init, wallet:" + this._signer.address);

                        let d: EthereumEventData_init = {
                            res: 0,
                            walletType: walletType,
                            account: this._signer.address,
                        };
                        this.emit(EthereumEventType.init, d);
                        return;
                    } catch (err: any) {}
                }
            }
            let d: EthereumEventData_init = {
                res: 3,
                walletType: walletType,
                account: this._signer.address,
            };
            this.emit(EthereumEventType.init, d);
            return;
        }

        CLog.info("Ethereum, Init, wallet:" + this._signer.address + ", chainId: " + network.chainId);

        let d: EthereumEventData_init = {
            res: 0,
            walletType: walletType,
            account: this._signer.address,
        };
        this.emit(EthereumEventType.init, d);
    }
    public async SignMessage(msg: string): Promise<string> {
        return await this._signer.signMessage(msg);
    }

    // === common
    public getContract(name: contractNames, addr: string = ""): ethers.Contract {
        const key = `${name}_${addr}`;
        if (!this._contracts[key]) {
            const win = window as any;
            const abi = AbiConfig.getAbiByContract(name);
            this._contracts[key] = new win.ethers.Contract(addr ? addr : abi.addr, abi.abi, this._signer);
        }
        return this._contracts[key];
    }
    public async getDecimalsETH(): Promise<bigint> {
        return BigInt(18);
    }
    public async getDecimalsErc20ByName(name: contractNames): Promise<bigint> {
        // decimals() view returns (uint8)
        let contract: any = this.getContract(name);
        if (this._decimals[name] == undefined) {
            this._decimals[name] = await contract.decimals();
        }
        return this._decimals[name];
    }
    public async getDecimalsErc20ByAddr(contract_addr: string): Promise<number> {
        const win = window as any;
        let abi = ["function decimals() view returns (uint8)"];
        let contract = new win.ethers.Contract(contract_addr, abi);
        let provider: any = contract.connect(this._provider);
        let decimals = Number((await provider["decimals"]()).toString());
        return decimals;
    }
    public async getBalanceETH(): Promise<bigint> {
        return await this._provider.getBalance(this._signer.address);
    }
    public async getBalanceErc20ByName(name: contractNames): Promise<bigint> {
        // balanceOf(address) view returns (uint256)
        let contract: any = this.getContract(name);
        return await contract.balanceOf(this._signer.address);
    }
    public async getBalanceErc20ByAddr(contract_addr: string): Promise<bigint> {
        const win = window as any;
        let abi = ["function balanceOf(address account) view returns (uint256)"];
        let contract = new win.ethers.Contract(contract_addr, abi);
        let provider: any = contract.connect(this._provider);
        let balance = await provider["balanceOf"](this._signer.address);
        return balance;
    }
    public async getBalance1155ByName(name: contractNames, id: string): Promise<bigint> {
        let contract: any = this.getContract(name);
        return await contract.balanceOf(this._signer.address, id);
    }
    public async getBalance1155ByAddr(contract_addr: string, id: string): Promise<bigint> {
        const win = window as any;
        let abi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];
        let contract = new win.ethers.Contract(contract_addr, abi);
        let provider: any = contract.connect(this._provider);
        let balance = await provider["balanceOf"](this._signer.address, id);
        return balance;
    }
    // approve 1155
    public async setApprovalForAllErc1155(erc1155_name: contractNames, operator_name: contractNames): Promise<boolean> {
        // setApprovalForAll(address operator, bool approved)
        try {
            let contract: any = this.getContract(erc1155_name);
            let operator_addr = AbiConfig.getAbiByContract(operator_name).addr;
            const res = await contract.setApprovalForAll(operator_addr, true);
            CLog.info("Ethereum, setApprovalForAllErc1155, res: ", res);
            return true;
        } catch (err) {
            CLog.error("Ethereum, setApprovalForAllErc1155, exception: ", err);
            return false;
        }
    }
    public async isApprovedForAllErc1155(
        erc1155_name: contractNames,
        operator_name: contractNames,
        erc1155_addr = "",
        operator_addr = ""
    ): Promise<boolean> {
        // isApprovedForAll(address owner, address operator) view returns (bool)
        try {
            let contract: any = this.getContract(erc1155_name, erc1155_addr);
            if (operator_addr == "") operator_addr = AbiConfig.getAbiByContract(operator_name).addr;

            const res = await contract.isApprovedForAll(this._signer.address, operator_addr);
            CLog.info("Ethereum, isApprovedForAllErc1155, res: ", res);
            return res;
        } catch (err) {
            CLog.info("Ethereum, isApprovedForAllErc1155, exception: ", err);
            return false;
        }
    }
    // approve 721
    public async setApprovalForAllErc721(erc721_name: contractNames, operator_name: contractNames): Promise<boolean> {
        // setApprovalForAll(address operator, bool approved)
        try {
            let contract: any = this.getContract(erc721_name);
            let operator_addr = AbiConfig.getAbiByContract(operator_name).addr;

            const res = await contract.setApprovalForAll(operator_addr, true);
            CLog.info("Ethereum, setApprovalForAllErc721, res: ", res);
            return true;
        } catch (err) {
            CLog.info("Ethereum, setApprovalForAllErc721, exception: ", err);
            return false;
        }
    }
    public async isApprovedForAllErc721(
        erc721_name: contractNames,
        operator_name: contractNames,
        erc721_addr = "",
        operator_addr = ""
    ): Promise<boolean> {
        // isApprovedForAll(address owner, address operator) view returns (bool)
        try {
            let contract: any = this.getContract(erc721_name, erc721_addr);
            if (operator_addr == "") operator_addr = AbiConfig.getAbiByContract(operator_name).addr;

            const res = await contract.isApprovedForAll(this._signer.address, operator_addr);
            CLog.info("Ethereum, isApprovedForAllErc721, res: ", res);
            return res;
        } catch (err) {
            CLog.info("Ethereum, isApprovedForAllErc721, exception: ", err);
            return false;
        }
    }
    // approve erc20
    public async setApproveErc20(erc20_name: contractNames, operator_name: contractNames, operator_addr = ""): Promise<boolean> {
        try {
            const win = window as any;
            let contract: any = this.getContract(erc20_name);
            let approveNum = win.ethers.MaxUint256.toString();

            if (operator_addr == "") operator_addr = AbiConfig.getAbiByContract(operator_name).addr;

            const res = await contract.approve(operator_addr, approveNum);
            CLog.info("Ethereum, setApproveErc20, res: ", res);
            return true;
        } catch (err) {
            CLog.info("Ethereum, setApproveErc20, exception: ", err);
            return false;
        }
    }
    public async isApprovedErc20(
        erc20_name: contractNames,
        operator_name: contractNames,
        operator_addr = "",
        valueNoDecimals: string
    ): Promise<boolean> {
        // allowance(address owner, address spender) view returns (uint256)

        try {
            let contract: any = this.getContract(erc20_name);
            if (operator_addr == "") operator_addr = AbiConfig.getAbiByContract(operator_name).addr;

            let res = await contract.allowance(this._signer.address, operator_addr);
            CLog.info("Ethereum, isApprovedErc20, res: ", res);

            let decimals = await this.getDecimalsErc20ByName(erc20_name);
            let valbn = chain_util.getDecimalsBigInt(valueNoDecimals, decimals);

            if (res > valbn) {
                return true;
            }
            return false;
        } catch (err) {
            CLog.info("Ethereum, isApprovedErc20, exception: ", err);
            return false;
        }
    }
}
