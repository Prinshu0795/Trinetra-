// client/src/pages/authority/IncidentTriagePage.tsx
import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Phone,
} from 'lucide-react';
import api from '../../lib/api';
import { IncidentReport, ReportStatus, SeverityLevel } from '../../types';
import { Badge } from '../../components/common/Badge';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';
import { Modal } from '../../components/common/Modal';
import { isSupabaseConfigured, supabase, supabaseGetIncidentReports } from '../../lib/supabase';

export const IncidentTriagePage: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [triageNotes, setTriageNotes] = useState('');
  const [triagePriority, setTriagePriority] = useState<SeverityLevel>('HIGH');
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports?status=${statusFilter}`);
      if (res.data?.success) {
        setReports(res.data.data);
        return;
      }
    } catch (err) {
      if (isSupabaseConfigured) {
        try {
          const supaReports = await supabaseGetIncidentReports();
          const filtered = statusFilter === 'ALL'
            ? supaReports
            : supaReports.filter((r: any) => r.status === statusFilter);
          setReports(filtered as any);
          return;
        } catch (supaErr) {
          console.error('Supabase fetch reports failed:', supaErr);
        }
      }
      console.error('Failed to load incident reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleTriageAction = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    try {
      setActionLoading(true);
      let updated: any = null;

      try {
        const res = await api.patch(`/reports/${selectedReport.id}/triage`, {
          status: newStatus,
          triagePriority,
          authorityNotes: triageNotes || undefined,
        });

        if (res.data?.success) {
          updated = res.data.data;
        }
      } catch (backendErr) {
        console.warn('Backend triage endpoint failed, attempting Supabase direct triage update:', backendErr);
      }

      if (!updated && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('incident_reports')
          .update({
            status: newStatus,
            triage_priority: triagePriority,
            authority_notes: triageNotes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedReport.id)
          .select()
          .single();

        if (!error && data) {
          updated = {
            ...selectedReport,
            status: newStatus,
            triagePriority,
            authorityNotes: triageNotes || undefined,
          };
        }
      }

      if (updated) {
        setReports((prev) =>
          prev.map((r) => (r.id === selectedReport.id ? updated : r))
        );
        setSelectedReport(updated);
      }
    } catch (err) {
      console.error('Failed to triage report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-canvas min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-3.5 sm:p-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-coral" />
              <h1 className="text-xl sm:text-2xl font-serif font-normal text-ink">Incident Report Triage Desk</h1>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Validate eyewitness submissions, inspect photographic proof, assign severity priority, and coordinate field responder dispatch.
            </p>
          </div>

          {/* Status Filter Tabs (Horizontally scrollable on mobile) */}
          <div className="flex overflow-x-auto no-scrollbar gap-1 text-xs font-semibold bg-canvas-subtle p-1 rounded-xl border border-hairline max-w-full">
            {['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'DISPATCHED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-white text-ink border border-hairline shadow-card font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Triage Layout: Report Table (Left) + Selected Report Inspector (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-hairline rounded-xl overflow-hidden shadow-card">
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Reports Queue ({reports.length} records)
              </span>
              <button
                onClick={fetchReports}
                className="text-xs text-coral hover:underline font-semibold"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-ink-muted">Loading incoming reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-ink-muted">
                <p className="font-semibold text-ink">No reports in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-hairline max-h-[650px] overflow-y-auto">
                {reports.map((rpt) => {
                  const isSelected = selectedReport?.id === rpt.id;
                  return (
                    <div
                      key={rpt.id}
                      onClick={() => {
                        setSelectedReport(rpt);
                        setTriageNotes(rpt.authorityNotes || '');
                        setTriagePriority(rpt.triagePriority || 'HIGH');
                      }}
                      className={`p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-coral-subtle/60 border-l-4 border-coral'
                          : 'hover:bg-canvas-subtle'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="text-xs font-mono font-bold text-coral">
                            {rpt.trackingCode}
                          </span>
                          <Badge status={rpt.status} />
                          {(rpt.title.includes('RELAY') || rpt.description.includes('RELAY')) && (
                            <span className="text-[10px] font-mono font-bold bg-[#FDF2F2] text-[#9E2A2B] border border-[#F5C2C2] px-1.5 py-0.5 rounded">
                              🚨 MESH RELAY (0% NET)
                            </span>
                          )}
                          <span className="text-[10px] text-ink-subtle font-mono">
                            {new Date(rpt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-ink leading-tight">{rpt.title}</h4>
                        <p className="text-xs text-ink-body line-clamp-1">{rpt.description}</p>
                        <p className="text-[11px] text-ink-muted flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-ink-subtle" />
                          {rpt.locationName}
                        </p>
                      </div>

                      {rpt.imageUrl && (
                        <img
                          src={rpt.imageUrl}
                          alt="Thumbnail"
                          className="w-14 h-14 object-cover rounded-md border border-hairline flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspector Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-hairline rounded-xl p-6 shadow-card space-y-5">
            {selectedReport ? (
              <>
                <div className="flex items-start justify-between gap-2 border-b border-hairline pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-coral">
                      {selectedReport.trackingCode}
                    </span>
                    <h3 className="text-base font-semibold text-ink mt-1 leading-snug">
                      {selectedReport.title}
                    </h3>
                  </div>
                  <Badge status={selectedReport.status} />
                </div>

                {/* Details */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-ink-subtle uppercase tracking-wider block text-[10px] font-semibold">
                      Eyewitness Description
                    </span>
                    <p className="text-ink-body mt-1 leading-relaxed bg-canvas p-3 rounded-lg border border-hairline">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="bg-canvas p-2.5 rounded-lg border border-hairline">
                      <span className="text-ink-subtle block text-[10px] font-sans">Location</span>
                      <span className="text-ink font-semibold">{selectedReport.locationName}</span>
                    </div>
                    <div className="bg-canvas p-2.5 rounded-lg border border-hairline">
                      <span className="text-ink-subtle block text-[10px] font-sans">GPS Coordinates</span>
                      <span className="text-ink">
                        {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {selectedReport.citizenName && (
                    <div className="flex items-center justify-between bg-canvas p-2.5 rounded-lg border border-hairline text-[11px]">
                      <span className="text-ink-muted">Reporter: {selectedReport.citizenName}</span>
                      {selectedReport.citizenPhone && (
                        <a
                          href={`tel:${selectedReport.citizenPhone}`}
                          className="text-coral hover:underline font-mono flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{selectedReport.citizenPhone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Photo Evidence Lightbox */}
                  {selectedReport.imageUrl && (
                    <div>
                      <span className="text-ink-subtle uppercase tracking-wider block text-[10px] font-semibold mb-1">
                        Photographic Proof
                      </span>
                      <img
                        src={selectedReport.imageUrl}
                        alt="Incident Proof"
                        onClick={() => setLightboxImage(selectedReport.imageUrl!)}
                        className="w-full h-44 object-cover rounded-lg border border-hairline cursor-pointer hover:opacity-95 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Triage Action Controls */}
                <div className="pt-4 border-t border-hairline space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Commander Triage Notes
                    </label>
                    <textarea
                      value={triageNotes}
                      onChange={(e) => setTriageNotes(e.target.value)}
                      placeholder="Add verification notes, traffic route diversion status, or responder orders..."
                      rows={2}
                      className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTriageAction('VERIFIED')}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-[#166534] hover:bg-[#15803D] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Incident</span>
                    </button>

                    <button
                      onClick={() => handleTriageAction('DISPATCHED')}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Responder</span>
                    </button>

                    <button
                      onClick={() => handleTriageAction('RESOLVED')}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold shadow-card transition"
                    >
                      Mark Resolved
                    </button>

                    <button
                      onClick={() => handleTriageAction('REJECTED')}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-[#FDF2F2] hover:bg-[#FBE8E8] text-[#9E2A2B] border border-[#F5C2C2] rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-card"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject / Duplicate</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-ink-muted space-y-2">
                <ClipboardList className="w-10 h-10 mx-auto text-ink-subtle" />
                <p className="text-sm font-semibold text-ink">Select an incident from the queue to triage</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <Modal isOpen={!!lightboxImage} onClose={() => setLightboxImage(null)} title="Photographic Evidence" maxWidth="2xl">
          <img src={lightboxImage} alt="Expanded evidence" className="w-full rounded-lg object-contain max-h-[75vh]" />
        </Modal>
      )}
    </div>
  );
};
