import type { Adapter, WalletError } from "@solana/wallet-adapter-base";

export type WalletStoreProps = {
    wallets?: Adapter[] | Adapter[];
    autoConnect?: boolean | boolean;
    onError?: (error: WalletError) => void;
    localStorageKey?: string;
};