import { WalletError } from "@solana/wallet-adapter-base";
export declare class WalletNotSelectedError extends WalletError {
    name: string;
}
export declare class WalletNotInitializedError extends WalletError {
    name: string;
}
