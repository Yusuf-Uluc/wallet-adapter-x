import { map } from "nanostores";
import { WalletNotInitializedError } from "./errors";
import { WalletStore, WalletStoreProps } from "./types";
import { createWalletStore } from "./createWalletStore";

export const walletStore = map<WalletStore>();

export const useWallet = (): WalletStore => {
    if (walletStore) return walletStore.get();
    throw new WalletNotInitializedError(
        "Wallet not initialized. Please use the `initWallet` method to initialize the wallet."
    );
};

export const initWallet = (walletStoreProps: WalletStoreProps): void => {
    walletStore.set(createWalletStore(walletStoreProps));
};