import { WalletStore, WalletStoreProps } from "./types";
export declare const walletStore: import("nanostores").MapStore<WalletStore>;
export declare const useWallet: () => WalletStore;
export declare const initWallet: (walletStoreProps: WalletStoreProps) => void;
