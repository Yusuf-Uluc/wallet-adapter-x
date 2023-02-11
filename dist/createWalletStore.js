import { WalletNotConnectedError, WalletNotReadyError, WalletReadyState } from "@solana/wallet-adapter-base";
import { atom, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { WalletNotSelectedError } from "./errors";
export const createWalletStore = ({ wallets: initialAdapters = [], autoConnect: initialAutoConnect = false, onError = (error) => console.error(error), localStorageKey = "walletName", }) => {
    // Mutable values.
    const adapters = atom(initialAdapters);
    const autoConnect = atom(initialAutoConnect);
    const name = persistentAtom(localStorageKey, undefined);
    const wallet = atom(null);
    const publicKey = atom(null);
    const readyState = atom(WalletReadyState.Unsupported);
    const connected = atom(false);
    const connecting = atom(false);
    const disconnecting = atom(false);
    const unloadingWindow = atom(false);
    const ready = computed(readyState, readyStateValue => {
        return (readyStateValue === WalletReadyState.Installed ||
            readyStateValue === WalletReadyState.Loadable);
    });
    // Map adapters to wallets.
    const wallets = atom([]);
    adapters.subscribe((adaptersValue) => {
        wallets.set(adaptersValue.map((newAdapter) => ({
            adapter: newAdapter,
            readyState: newAdapter.readyState,
        })));
    });
    // Helper methods to set and reset the main state variables.
    const setWallet = (newWallet) => {
        wallet.set(newWallet);
        readyState.set(newWallet?.readyState ?? WalletReadyState.NotDetected);
        publicKey.set(newWallet?.adapter.publicKey ?? null);
        connected.set(newWallet?.adapter.connected ?? false);
    };
    // Set the active wallet if the name changes.
    name.subscribe(newName => {
        const foundWallet = newName && wallets.get().find(({ adapter }) => adapter.name === newName);
        setWallet(foundWallet ?? null);
    });
    // Set the active wallet if different wallets are provided.
    wallets.subscribe(newWallets => {
        const foundWallet = name.get() &&
            newWallets.find(({ adapter }) => adapter.name === name.get());
        setWallet(foundWallet ?? null);
    });
    // Listen for `readyState` changes in all provided adapters.
    wallets.subscribe(newWallets => {
        function handleReadyStateChange(readyState) {
            const prevWallets = wallets.get();
            const index = prevWallets.findIndex(({ adapter }) => adapter === this);
            if (index === -1)
                return;
            wallets.set([
                ...prevWallets.slice(0, index),
                { adapter: this, readyState },
                ...prevWallets.slice(index + 1),
            ]);
        }
        wallets.get().forEach(({ adapter }) => adapter.on("readyStateChange", handleReadyStateChange, adapter));
    });
    // Select a wallet adapter by name.
    const select = async (walletName) => {
        if (name.get() === walletName)
            return;
        name.set(walletName);
    };
    // Handle the wallet adapter events.
    const handleConnect = () => setWallet(wallet.get());
    const handleDisconnect = () => {
        if (unloadingWindow.get())
            return;
        name.set(undefined);
    };
    const handleError = (error) => {
        if (!unloadingWindow.get())
            onError(error);
        return error;
    };
    // Listen for wallet adapter events.
    wallet.subscribe((newWallet) => {
        const adapter = newWallet?.adapter;
        if (!adapter)
            return;
        adapter.on("connect", handleConnect);
        adapter.on("disconnect", handleDisconnect);
        adapter.on("error", handleError);
    });
    // Connect the wallet.
    const connect = async () => {
        if (connected.get() || connecting.get() || disconnecting.get())
            return;
        if (!wallet.get())
            throw handleError(new WalletNotSelectedError());
        const adapter = wallet.get().adapter; // We know it's not null because of the check above.
        if (!ready.get()) {
            name.set(undefined);
            if (typeof window !== "undefined") {
                window.open(adapter.url, "_blank");
            }
            throw handleError(new WalletNotReadyError());
        }
        try {
            connecting.set(true);
            await adapter.connect();
        }
        catch (error) {
            name.set(undefined);
            // handleError will also be called.
            throw error;
        }
        finally {
            connecting.set(false);
        }
    };
    // Disconnect the wallet adapter.
    const disconnect = async () => {
        if (disconnecting.get())
            return;
        if (!wallet.get()) {
            name.set(undefined);
            return;
        }
        try {
            disconnecting.set(true);
            await wallet.get().adapter.disconnect(); // We know it's not null because of the check above.
        }
        catch (error) {
            name.set(undefined);
            // handleError will also be called.
            throw error;
        }
        finally {
            disconnecting.set(false);
        }
    };
    // Send a transaction using the provided connection.
    const sendTransaction = async (transaction, connection, options) => {
        const adapter = wallet.get()?.adapter;
        if (!adapter)
            throw handleError(new WalletNotSelectedError());
        if (!connected.get())
            throw handleError(new WalletNotConnectedError());
        return await adapter.sendTransaction(transaction, connection, options);
    };
    // Sign a transaction if the wallet supports it.
    const signTransaction = computed([wallet, connected], (walletValue, connectedValue) => {
        const adapter = walletValue?.adapter;
        if (!(adapter && "signTransaction" in adapter))
            return;
        return async (transaction) => {
            if (!connectedValue)
                throw handleError(new WalletNotConnectedError());
            return await adapter.signTransaction(transaction);
        };
    });
    // Sign multiple transactions if the wallet adapter supports it
    const signAllTransactions = computed([wallet, connected], (walletValue, connectedValue) => {
        const adapter = walletValue?.adapter;
        if (!(adapter && "signAllTransactions" in adapter))
            return;
        return async (transactions) => {
            if (!connectedValue)
                throw handleError(new WalletNotConnectedError());
            return await adapter.signAllTransactions(transactions);
        };
    });
    // Sign an arbitrary message if the wallet adapter supports it.
    const signMessage = computed([wallet, connected], (walletValue, connectedValue) => {
        const adapter = walletValue?.adapter;
        if (!(adapter && "signMessage" in adapter))
            return;
        return async (message) => {
            if (!connectedValue)
                throw handleError(new WalletNotConnectedError());
            return await adapter.signMessage(message);
        };
    });
    // If autoConnect is enabled, try to connect when the wallet adapter changes and is ready.
    wallet.subscribe(async (walletValue) => {
        if (!autoConnect.get() ||
            !walletValue ||
            !ready.get() ||
            connected.get() ||
            connecting.get()) {
            return;
        }
        try {
            connecting.set(true);
            await walletValue.adapter.connect();
        }
        catch (error) {
            name.set(undefined);
            // Don't throw error, but handleError will still be called.
        }
        finally {
            connecting.set(false);
        }
    });
    // Return the created store.
    return {
        // Props.
        wallets,
        autoConnect,
        // Data.
        wallet,
        publicKey,
        readyState,
        ready,
        connected,
        connecting,
        disconnecting,
        // Methods.
        select,
        connect,
        disconnect,
        sendTransaction,
        signTransaction,
        signAllTransactions,
        signMessage,
    };
};
//# sourceMappingURL=createWalletStore.js.map