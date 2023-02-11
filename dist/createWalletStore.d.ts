import { WalletStore, WalletStoreProps } from "./types";
export declare const createWalletStore: ({ wallets: initialAdapters, autoConnect: initialAutoConnect, onError, localStorageKey, }: WalletStoreProps) => WalletStore;
