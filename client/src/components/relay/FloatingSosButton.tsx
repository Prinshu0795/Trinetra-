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
      <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end space-y-2">
        {peerActivity && (
          <div className="bg-[#141413] text-white text-[11px] font-mono px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2 border border-coral animate-bounce">
            <Radio className="w-3.5 h-3.5 text-coral animate-spin" />
            <span>TRINETRA Peer Relaying Nearby Packet</span>
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 bg-[#9E2A2B] hover:bg-[#852223] active:bg-[#6D1D1E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          title="Emergency SOS (Works Offline via Relay Mesh)"
        >
          <div className="relative">
            <AlertOctagon className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider pr-1">
            Emergency SOS
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">
            Mesh
          </span>
        </button>
      </div>

      <EmergencySosModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
