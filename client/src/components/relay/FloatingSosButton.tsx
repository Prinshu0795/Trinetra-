import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertOctagon, Radio } from 'lucide-react';
import { EmergencySosModal } from './EmergencySosModal';
import { relayMeshEngine } from '../../lib/relayMeshEngine';
import { RelayPacket } from '../../types';

export const FloatingSosButton: React.FC = () => {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [peerActivity, setPeerActivity] = useState(false);

  // Strictly render only on the Home page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => {
    if (!isHomePage) return;

    // Listen for P2P mesh packet relay events
    const unsubscribe = relayMeshEngine.subscribe((packet: RelayPacket, source) => {
      if (source === 'P2P_PEER') {
        setPeerActivity(true);
        setTimeout(() => setPeerActivity(false), 4000);
      }
    });

    return () => unsubscribe();
  }, [isHomePage]);

  if (!isHomePage) return null;

  return (
    <>
      {/* Mobile-only peer activity notification banner */}
      {peerActivity && (
        <div className="md:hidden fixed top-20 right-4 z-50 bg-[#141413] text-white text-[10px] font-mono px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2 border border-coral animate-bounce">
          <Radio className="w-3.5 h-3.5 text-coral animate-spin" />
          <span>TRINETRA Peer Relaying Nearby Packet</span>
        </div>
      )}

      {/* Desktop Floating SOS Button (Hidden on mobile where MobileBottomNav SOS is used) */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2.5">
        {peerActivity && (
          <div className="bg-[#141413]/90 backdrop-blur-sm text-white text-[11px] font-mono px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-coral/60 animate-bounce">
            <Radio className="w-3.5 h-3.5 text-coral animate-spin" />
            <span>Peer Relaying Nearby Packet</span>
          </div>
        )}

        {/* Outer glow ring */}
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30 scale-110" />
          <span className="absolute inset-0 rounded-full bg-red-700/20 scale-105" />
          <button
            onClick={() => setModalOpen(true)}
            className="relative group flex items-center gap-3 pl-4 pr-5 py-3.5 bg-gradient-to-br from-[#B83232] via-[#9E2A2B] to-[#7A1E1E] hover:from-[#C53535] hover:to-[#8A2222] active:scale-95 text-white rounded-full shadow-2xl hover:shadow-red-900/40 transition-all duration-200 font-sans border border-red-800/50"
            title="Emergency SOS (Works Offline via Relay Mesh)"
          >
            {/* Live dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>

            <AlertOctagon className="w-[18px] h-[18px] shrink-0" />

            <span className="text-[13px] font-bold tracking-wide">SOS</span>

            <span className="text-[10px] font-mono bg-white/15 border border-white/20 px-1.5 py-0.5 rounded-lg leading-none">
              MESH
            </span>
          </button>
        </div>
      </div>

      <EmergencySosModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
