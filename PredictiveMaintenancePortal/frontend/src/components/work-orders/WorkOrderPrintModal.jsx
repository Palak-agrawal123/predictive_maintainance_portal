import React from 'react';
import { X, Printer, Wrench, Calendar, CheckSquare, ShieldAlert, User, Cpu } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/UIComponents';

export function WorkOrderPrintModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111613] border border-[#2B352E] rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl font-mono overflow-hidden">
        {/* HEADER BAR */}
        <div className="px-5 py-3.5 border-b border-[#202722] flex items-center justify-between bg-[#141B17]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#FF805F]/15 border border-[#FF805F]/40 text-[#FF805F]">
              <Printer size={15} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#E6ECE8]">
                Industrial Maintenance Work Order Slip
              </h2>
              <p className="text-[10px] text-[#8B9890]">
                Official physical dispatch ticket for maintenance technicians
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#FF805F] hover:bg-[#FF957A] text-black font-bold text-xs rounded flex items-center gap-1.5 transition-colors"
            >
              <Printer size={13} /> Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8B9890] hover:text-[#E6ECE8] hover:bg-[#1C2520] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINTABLE TICKET BODY */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs bg-[#0F1311]">
          {/* TICKET TOP BANNER */}
          <div className="border-2 border-dashed border-[#2B352E] rounded-lg p-4 bg-[#141B17] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202722] gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#748279]">PLANT MAINTENANCE DISPATCH SLIP</div>
                <div className="text-xl font-bold text-[#FF805F] tracking-tight">{order.id}</div>
                <div className="text-[10px] text-[#8B9890]">Generated via PredictX Industrial Engine</div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8B9890]">Priority:</span>
                  <PriorityBadge priority={order.priority} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8B9890]">Status:</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            </div>

            {/* BARCODE REPRESENTATION */}
            <div className="py-1 text-center font-mono tracking-[0.4em] text-[10px] text-[#56635A] select-none border-y border-[#202722]">
              ||| | ||||| || |||||| | ||||| ||| |||| | ||| ||||||| {order.id}
            </div>

            {/* ASSET SPECIFICATION */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
              <div className="p-2 rounded bg-[#161D19] border border-[#232C26]">
                <span className="text-[9px] text-[#748279] uppercase block">Asset ID</span>
                <span className="font-bold text-[#E6ECE8]">{order.machineId}</span>
              </div>
              <div className="p-2 rounded bg-[#161D19] border border-[#232C26]">
                <span className="text-[9px] text-[#748279] uppercase block">Asset Name</span>
                <span className="font-bold text-[#E6ECE8] truncate block">{order.machineName}</span>
              </div>
              <div className="p-2 rounded bg-[#161D19] border border-[#232C26]">
                <span className="text-[9px] text-[#748279] uppercase block">Assigned Tech</span>
                <span className="font-bold text-[#38BDF8] truncate block">{order.technician}</span>
              </div>
              <div className="p-2 rounded bg-[#161D19] border border-[#232C26]">
                <span className="text-[9px] text-[#748279] uppercase block">Target Due Date</span>
                <span className="font-bold text-[#FF805F]">{order.scheduledDate}</span>
              </div>
            </div>

            {/* ROOT DEFECT & EVIDENCE */}
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded bg-[#161D19] border border-[#2B352E] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#FF5B64] flex items-center gap-1.5">
                  <ShieldAlert size={13} /> Predicted Failure Mode & Suspected Issue:
                </span>
                <p className="text-[#E6ECE8] text-xs font-semibold leading-relaxed">
                  {order.suspectedIssue}
                </p>
                <div className="text-[10px] text-[#748279] pt-1">
                  Trigger Source: {order.source || "PredictX Prognostics Engine"}
                </div>
              </div>

              {/* RECOMMENDED INSPECTION PROCEDURES */}
              <div className="p-3 rounded bg-[#161D19] border border-[#2B352E] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#38BDF8] flex items-center gap-1.5">
                  <CheckSquare size={13} /> Required Physical Inspection Checklist:
                </span>
                <p className="text-[#C2CDC5] text-xs leading-relaxed">
                  {order.suggestedInspection}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#232C26] text-[10px] text-[#8B9890]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#FF805F]" />
                    <span>Lockout / Tagout (LOTO) verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#FF805F]" />
                    <span>Clearance measured with calibrated gauge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#FF805F]" />
                    <span>Telemetry transducer re-zeroed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#FF805F]" />
                    <span>Post-repair run test completed</span>
                  </label>
                </div>
              </div>

              {/* RESOLUTION & SIGN-OFF BLOCKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded bg-[#161D19] border border-[#232C26] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#748279]">Field Notes & Parts Used:</span>
                  <div className="text-[11px] text-[#8B9890] min-h-[40px]">
                    {order.resolutionNotes || "Awaiting technician site dispatch."}
                  </div>
                </div>

                <div className="p-3 rounded bg-[#161D19] border border-[#232C26] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#748279]">Technician Sign-Off:</span>
                  <div className="pt-4 border-b border-dashed border-[#56635A] text-right text-[10px] text-[#56635A]">
                    Signature & Date
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-[#202722] bg-[#141B17] flex items-center justify-between text-xs">
          <span className="text-[10px] text-[#748279]">DEV-P04 Draft Maintenance Work Order Standard</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#1C2520] hover:bg-[#26322B] text-[#E6ECE8] text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
