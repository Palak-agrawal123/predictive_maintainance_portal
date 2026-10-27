import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Layers, Shield, ArrowRight, Wrench, Activity, ChevronRight } from 'lucide-react';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0C100E] text-[#E6ECE8] flex flex-col items-center justify-center p-4 font-mono select-none antialiased">
      {/* Centered Industrial Command Card */}
      <div className="w-full max-w-lg bg-[#111613] border border-[#232C26] rounded-xl p-6 sm:p-8 shadow-2xl relative">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#FF805F]/15 border border-[#FF805F]/40 flex items-center justify-center text-[#FF805F] mb-3 shadow-[0_0_20px_rgba(255,128,95,0.15)]">
            <Terminal size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-[#E6ECE8]">
            PREDICT<span className="text-[#FF805F]">X</span>
          </h1>
          <p className="text-xs text-[#8B9890] mt-1.5 max-w-sm leading-relaxed">
            AI-Driven Industrial Asset Prognostics & Impact-Aware Maintenance Portal
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-2.5 py-0.5 rounded bg-[#161D19] border border-[#2B352E] text-[10px] text-[#43D17D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#43D17D] animate-pulse" />
            NASA C-MAPSS FD001 Subsample Pipeline
          </div>
        </div>

        {/* Operational Entry Cards */}
        <div className="space-y-3">
          <div
            onClick={() => navigate('/dashboard')}
            className="group p-3.5 rounded-lg bg-[#161D19] border border-[#FF805F]/40 hover:border-[#FF805F] transition-all cursor-pointer flex items-center justify-between shadow-[0_0_20px_rgba(255,128,95,0.06)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#FF805F]/15 border border-[#FF805F]/30 flex items-center justify-center text-[#FF805F]">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#E6ECE8] group-hover:text-[#FF805F] transition-colors">
                  Plant Operations Overview
                </div>
                <div className="text-[11px] text-[#8B9890]">
                  Live fleet KPIs, risk distribution & workload trends
                </div>
              </div>
            </div>
            <ArrowRight size={15} className="text-[#FF805F] group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div
            onClick={() => navigate('/maintenance-priority')}
            className="group p-3.5 rounded-lg bg-[#161C18] border border-[#232C26] hover:border-[#38BDF8]/60 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#1C2520] border border-[#2B352E] flex items-center justify-center text-[#38BDF8] group-hover:bg-[#38BDF8]/10 transition-colors">
                <Activity size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#E6ECE8] group-hover:text-[#38BDF8] transition-colors">
                  Decision Priority Matrix
                </div>
                <div className="text-[11px] text-[#8B9890]">
                  Dynamic What-If sensitivity weights & action rankings
                </div>
              </div>
            </div>
            <ArrowRight size={15} className="text-[#8B9890] group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all" />
          </div>

          <div
            onClick={() => navigate('/machines')}
            className="group p-3.5 rounded-lg bg-[#161C18] border border-[#232C26] hover:border-[#43D17D]/60 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#1C2520] border border-[#2B352E] flex items-center justify-center text-[#43D17D] group-hover:bg-[#43D17D]/10 transition-colors">
                <Layers size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#E6ECE8] group-hover:text-[#43D17D] transition-colors">
                  Machine Fleet Registry
                </div>
                <div className="text-[11px] text-[#8B9890]">
                  Multi-channel sensor telemetry & diagnostics
                </div>
              </div>
            </div>
            <ArrowRight size={15} className="text-[#8B9890] group-hover:text-[#43D17D] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#202722] flex items-center justify-between text-[10px] text-[#748279]">
          <span>DEV-P04 Decision Support Layer</span>
          <span>BTech CSE Prototype Build</span>
        </div>
      </div>
    </div>
  );
}
