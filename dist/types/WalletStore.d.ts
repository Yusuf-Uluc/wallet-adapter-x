import { MessageSignerWalletAdapterProps, SignerWalletAdapterProps, WalletAdapterProps, WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";
import { Atom, ReadableAtom } from "nanostores";
import { Wallet } from "./Wallet";
export interface WalletStore {
    wallets: Atom<Wallet[]>;
    autoConnect: Atom<boolean>;
    wallet: Atom<Wallet | null>;
    publicKey: Atom<PublicKey | null>;
    readyState: Atom<WalletReadyState>;
    ready: Atom<boolean>;
    connected: Atom<boolean>;
    connecting: Atom<boolean>;
    disconnecting: Atom<boolean>;
    select(walletName: WalletName): void;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction: WalletAdapterProps["sendTransaction"];
    signTransaction: ReadableAtom<SignerWalletAdapterProps["signTransaction"] | undefined>;
    signAllTransactions: ReadableAtom<SignerWalletAdapterProps["signAllTransactions"] | undefined>;
    signMessage: ReadableAtom<MessageSignerWalletAdapterProps["signMessage"] | undefined>;
}
