import { map } from "nanostores";
import { WalletNotInitializedError } from "./errors";
import { createWalletStore } from "./createWalletStore";
export const walletStore = map();
export const useWallet = () => {
    if (walletStore)
        return walletStore.get();
    throw new WalletNotInitializedError("Wallet not initialized. Please use the `initWallet` method to initialize the wallet.");
};
export const initWallet = (walletStoreProps) => {
    walletStore.set(createWalletStore(walletStoreProps));
};
//# sourceMappingURL=useWallet.js.map