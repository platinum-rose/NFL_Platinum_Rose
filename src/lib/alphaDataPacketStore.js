import { createContext } from 'react';

export const AlphaDataPacketContext = createContext({
  enabled: false,
  packet: null,
  loading: false,
  error: null,
});

export const ALPHA_PACKET_URL = `${import.meta.env.BASE_URL || '/'}alpha/alpha-packet-2026.json`;
