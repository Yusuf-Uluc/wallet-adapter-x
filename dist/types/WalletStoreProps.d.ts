import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
export declare type WalletStoreProps = {
    wallets?: Adapter[] | Adapter[];
    autoConnect?: boolean | boolean;
    onError?: (error: WalletError) => void;
    localStorageKey?: string;
};
