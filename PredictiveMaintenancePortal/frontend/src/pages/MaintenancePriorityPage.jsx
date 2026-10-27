import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, Info, Wrench, ShieldAlert, Sparkles, RotateCcw, Flame } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Layout } from '../components/layout/Layout';
import { PriorityBadge, StatusBadge } from '../components/common/UIComponents';
import { WorkOrderModal } from '../components/work-orders/WorkOrderModal';
import { calculatePriorityScore } from '../services/api';

export function MaintenancePriorityPage() {
  const { machines, priorityWeights, setPriorityWeights } = useAppData();
  const navigate = useNavigate();

  const [weights, setWeights] = useState(priorityWeights);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Re-calculate list when weights or machines change
  const scoredMachines = machines.map(m => {
    const calc = calculatePriorityScore(m, weights);
    return {
      ...m,
      calc
    };
  }).sort((a, b) => b.calc.score - a.calc.score);

  const filtered = scoredMachines.filter(m => {
    if (tierFilter === 'ALL') return true;
    return m.calc.band.toLowerCase() === tierFilter.toLowerCase();
  });

  const handleWeightChange = (key, val) => {
    const newWeights = { ...weights, [key]: parseFloat(val) };
    setWeights(newWeights);
    setPriorityWeights(newWeights);
  };

  const resetWeights = () => {
    const defaultWeights = { risk: 0.50, criticality: 0.25, impact: 0.15, urgency: 0.10 };
    setWeights(defaultWeights);
    setPriorityWeights(defaultWeights);
  };

  return (
    <Layout pageTitle="Maintenance Decision Priority">
      <div className="space-y-4 font-mono">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202722] gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#E6ECE8] flex items-center gap-2">
              <span className="text-[#FF805F]">//</span> IMPACT-AWARE MAINTENANCE PRIORITY MATRIX
            </h1>
            <p className="text-xs text-[#8B9890] mt-0.5">
              DEV-P04 Decision Layer: Operational ranking factoring Failure Risk, Machine Criticality, Production Loss and Schedule Urgency
            </p>
          </div>
          <button
            onClick={resetWeights}
            className="px-3 py-1.5 rounded bg-[#161C18] hover:bg-[#202A23] border border-[#232C26] text-[#8B9890] hover:text-[#E6ECE8] text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw size={13} /> Reset Baseline Weights
          </button>
        </div>

        {/* WHAT-IF WEIGHT CONTROL PANEL */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#202722]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[#FF805F]" />
              <span className="text-xs font-bold text-[#E6ECE8] uppercase tracking-wider">
                Dynamic Decision Weight Simulation
              </span>
            </div>
            <span className="text-[10px] text-[#56635A]">What-If Sensitivity Modeling</span>
          </div>

          <div className="text-[11px] text-[#8B9890] bg-[#161D19] p-2.5 rounded border border-[#2B352E] mb-3">
            <code>Priority Score = ({weights.risk.toFixed(2)} × Risk) + ({weights.criticality.toFixed(2)} × Criticality) + ({weights.impact.toFixed(2)} × Impact) + ({weights.urgency.toFixed(2)} × Urgency)</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8B9890]">ML Risk Weight:</span>
                <span className="font-bold text-[#FF805F]">{(weights.risk * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.risk}
                onChange={(e) => handleWeightChange('risk', e.target.value)}
                className="w-full accent-[#FF805F]"
              />
            </div>

            <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8B9890]">Asset Criticality:</span>
                <span className="font-bold text-[#38BDF8]">{(weights.criticality * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.criticality}
                onChange={(e) => handleWeightChange('criticality', e.target.value)}
                className="w-full accent-[#38BDF8]"
              />
            </div>

            <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8B9890]">Production Impact:</span>
                <span className="font-bold text-[#F5B942]">{(weights.impact * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.impact}
                onChange={(e) => handleWeightChange('impact', e.target.value)}
                className="w-full accent-[#F5B942]"
              />
            </div>

            <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8B9890]">Maintenance Urgency:</span>
                <span className="font-bold text-[#43D17D]">{(weights.urgency * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={weights.urgency}
                onChange={(e) => handleWeightChange('urgency', e.target.value)}
                className="w-full accent-[#43D17D]"
              />
            </div>
          </div>
        </div>

        {/* TIER TABS */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded border transition-colors ${
                tierFilter === t
                  ? 'bg-[#FF805F]/15 border-[#FF805F] text-[#FF805F] font-semibold'
                  : 'bg-[#111613] border-[#232C26] text-[#8B9890] hover:text-[#E6ECE8]'
              }`}
            >
              {t === 'ALL' ? 'All Priority Tiers' : `${t} Tier`}
            </button>
          ))}
        </div>

        {/* RANKED LIST TABLE */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#161D19] border-b border-[#202722] text-[#8B9890] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Machine ID & Name</th>
                  <th className="py-3 px-4 text-center">Failure Risk</th>
                  <th className="py-3 px-4 text-center">Criticality</th>
                  <th className="py-3 px-4 text-center">Impact</th>
                  <th className="py-3 px-4 text-center">Combined Priority</th>
                  <th className="py-3 px-4">Priority Tier</th>
                  <th className="py-3 px-4">Recommended Next Action</th>
                  <th className="py-3 px-4 text-right">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2520]">
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/machines/${item.id}`)}
                    className="hover:bg-[#161D19] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-[#FF805F]">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#E6ECE8]">{item.id}</div>
                      <div className="text-[11px] text-[#748279]">{item.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={item.riskScore >= 65 ? 'text-[#FF5B64]' : item.riskScore >= 35 ? 'text-[#F5B942]' : 'text-[#43D17D]'}>
                        {item.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#8B9890]">{item.criticalityScore}</td>
                    <td className="py-3 px-4 text-center text-[#8B9890]">{item.productionImpact}</td>
                    <td className="py-3 px-4 text-center font-bold text-sm text-[#E6ECE8]">
                      {item.calc.score}
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={item.calc.band} />
                    </td>
                    <td className="py-3 px-4 text-[#8B9890] max-w-[200px] truncate">
                      {item.calc.action}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMachine(item);
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-[#161C18] hover:bg-[#FF805F] hover:text-black border border-[#232C26] text-[#E6ECE8] transition-colors text-[11px]"
                      >
                        Create Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DECISION JUSTIFICATION NOTICE */}
        <div className="p-3 bg-[#111613] border border-[#232C26] rounded-lg text-xs text-[#8B9890] flex items-start gap-2.5">
          <Info size={16} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#E6ECE8]">Decision Support Principle: </strong>
            Priority ranking blends algorithmic risk with practical plant constraints. An auxiliary equipment unit with severe degradation may yield lower overall downtime impact than a moderately degraded core line bottleneck.
          </div>
        </div>
      </div>

      <WorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedMachine={selectedMachine}
      />
    </Layout>
  );
}
