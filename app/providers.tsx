'use client';

import '@rainbow-me/rainbowkit/styles.css';
import React, { useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { robinhoodChain } from '@/lib/chain';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// With a WalletConnect project ID: full RainbowKit wallet list incl. mobile wallets via QR/deep link.
// Without one: browser-extension / in-app-browser wallets only.
const wagmiConfig = walletConnectProjectId
  ? getDefaultConfig({
      appName: 'Burrow',
      projectId: walletConnectProjectId,
      chains: [robinhoodChain],
      transports: { [robinhoodChain.id]: http() },
      ssr: true,
    })
  : createConfig({
      chains: [robinhoodChain],
      connectors: [injected()],
      transports: { [robinhoodChain.id]: http() },
      ssr: true,
    });

const burrowTheme = darkTheme({
  accentColor: '#fbbf24',
  accentColorForeground: '#000000',
  borderRadius: 'none',
  fontStack: 'system',
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={burrowTheme} modalSize="compact" initialChain={robinhoodChain}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
