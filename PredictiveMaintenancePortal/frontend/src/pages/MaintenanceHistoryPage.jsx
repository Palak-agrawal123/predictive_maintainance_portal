import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, Filter, Wrench, CheckCircle2, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { StatusBadge } from '../components/common/UIComponents';
import { initialMaintenanceHistory } from '../data/maintenanceHistory';

export function MaintenanceHistoryPage() {
  const navigate = useNavigate();
  const [historyList] = useState(initialMaintenanceHistory);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const filtered = historyList.filter(item => {
    return (
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.machineId.toLowerCase().includes(search.toLowerCase()) ||
      item.machineName.toLowerCase().includes(search.toLowerCase()) ||
      item.activityType.toLowerCase().includes(search.toLowerCase()) ||
      item.technician.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Layout pageTitle="Maintenance Service Audit">
      <div className="space-y-4 font-mono">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202722] gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#E6ECE8] flex items-center gap-2">
              <span className="text-[#FF805F]">//</span> SERVICE AUDIT TRAIL & INTERVENTION LOGS
            </h1>
            <p className="text-xs text-[#8B9890] mt-0.5">
              Historical repair records, parts replacement tracking, downtime auditing, and post-maintenance verification
            </p>
          </div>
          <div className="text-xs text-[#748279]">
            Total Completed Audits: {historyList.length}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3 text-xs">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#8B9890]" />
            <input
              type="text"
              placeholder="Search historical records by Machine ID, Technician, Work Order #, or Consumable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161C18] border border-[#232C26] rounded pl-8 pr-3 py-1.5 text-[#E6ECE8] focus:border-[#FF805F] focus:outline-none placeholder:text-[#56635A]"
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#161D19] border-b border-[#202722] text-[#8B9890] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Origin WO</th>
                  <th className="py-3 px-4">Equipment Unit</th>
                  <th className="py-3 px-4">Intervention Executed</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Date Completed</th>
                  <th className="py-3 px-4 text-center">Downtime</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2520]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8B9890]">
                      No history available for the selected search query.
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-[#161D19] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-[#FF805F]">{item.id}</td>
                      <td className="py-3 px-4 text-[#8B9890]">{item.workOrderId}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#E6ECE8]">{item.machineId}</div>
                        <div className="text-[11px] text-[#748279]">{item.machineName}</div>
                      </td>
                      <td className="py-3 px-4 text-[#E6ECE8]">{item.activityType}</td>
                      <td className="py-3 px-4 text-[#8B9890]">{item.technician}</td>
                      <td className="py-3 px-4 text-[#748279]">{item.completedDate}</td>
                      <td className="py-3 px-4 text-center text-[#8B9890]">{item.downtimeHours} hrs</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="px-2 py-1 rounded bg-[#161C18] hover:bg-[#202A23] text-[#E6ECE8] text-[11px]"
                        >
                          View Audit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
          <div className="bg-[#111613] border border-[#232C26] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202722]">
              <div>
                <span className="text-xs text-[#FF805F] font-bold">{selectedItem.id}</span>
                <h3 className="text-sm font-bold text-[#E6ECE8]">{selectedItem.activityType}</h3>
              </div>
              <StatusBadge status={selectedItem.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Machine Asset</span>
                  <span className="text-[#E6ECE8] font-semibold">{selectedItem.machineId} - {selectedItem.machineName}</span>
                </div>
                <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Associated Work Order</span>
                  <span className="text-[#E6ECE8] font-semibold">{selectedItem.workOrderId}</span>
                </div>
              </div>

              <div>
                <span className="text-[#8B9890] text-[11px] block uppercase">Resolution & Sign-off Notes:</span>
                <p className="text-[#E6ECE8] bg-[#161D19] p-2.5 rounded border border-[#2B352E] mt-1 leading-relaxed">
                  {selectedItem.resolutionNotes}
                </p>
              </div>

              <div>
                <span className="text-[#8B9890] text-[11px] block uppercase">Parts Replaced:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedItem.partsReplaced?.map((part, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#161C18] border border-[#232C26] text-[#8B9890] text-[11px]">
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Technician</span>
                  <span className="text-[#E6ECE8] font-semibold">{selectedItem.technician.split(' ')[0]}</span>
                </div>
                <div className="p-2 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Downtime</span>
                  <span className="text-[#E6ECE8] font-semibold">{selectedItem.downtimeHours} hrs</span>
                </div>
                <div className="p-2 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Cost Est.</span>
                  <span className="text-[#43D17D] font-semibold">{selectedItem.costEstimate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#202722]">
              <button
                onClick={() => {
                  navigate(`/machines/${selectedItem.machineId}`);
                  setSelectedItem(null);
                }}
                className="text-xs text-[#FF805F] hover:underline flex items-center gap-1"
              >
                Inspect Equipment Feed <ArrowRight size={13} />
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded bg-[#161C18] hover:bg-[#202A23] border border-[#232C26] text-xs text-[#E6ECE8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
