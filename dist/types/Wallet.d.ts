import type { Adapter, WalletReadyState } from "@solana/wallet-adapter-base";
export declare type Wallet = {
    adapter: Adapter;
    readyState: WalletReadyState;
};
