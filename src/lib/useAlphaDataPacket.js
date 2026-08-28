import { useContext } from 'react';
import { AlphaDataPacketContext } from './alphaDataPacketStore.js';

export function useAlphaDataPacket() {
  return useContext(AlphaDataPacketContext);
}
