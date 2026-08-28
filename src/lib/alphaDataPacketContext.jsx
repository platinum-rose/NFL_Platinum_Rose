import React, { useEffect, useMemo, useState } from 'react';
import { AlphaDataPacketContext, ALPHA_PACKET_URL } from './alphaDataPacketStore.js';

export function AlphaDataPacketProvider({ enabled, children }) {
  const [state, setState] = useState({
    packet: null,
    loading: Boolean(enabled),
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    fetch(ALPHA_PACKET_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Alpha packet returned ${response.status}`);
        return response.json();
      })
      .then((packet) => {
        if (!cancelled) setState({ packet, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ packet: null, loading: false, error: error.message || String(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const value = useMemo(() => {
    if (!enabled) {
      return { enabled: false, packet: null, loading: false, error: null };
    }
    return {
      enabled,
      packet: state.packet,
      loading: state.loading,
      error: state.error,
    };
  }, [enabled, state.error, state.loading, state.packet]);

  return (
    <AlphaDataPacketContext.Provider value={value}>
      {children}
    </AlphaDataPacketContext.Provider>
  );
}
