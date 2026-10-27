import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Layout } from '../components/layout/Layout';
import { StatusBadge, PriorityBadge } from '../components/common/UIComponents';
import { WorkOrderModal } from '../components/work-orders/WorkOrderModal';
import { WorkOrderPrintModal } from '../components/work-orders/WorkOrderPrintModal';

export function WorkOrdersPage() {
  const { workOrders, updateWorkOrderStatus } = useAppData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOrder, setDetailModalOrder] = useState(null);
  const [printModalOrder, setPrintModalOrder] = useState(null);

  const statuses = ['Draft', 'Approved', 'In Progress', 'Completed', 'Cancelled'];

  const filteredOrders = workOrders.filter(wo => {
    const matchesSearch =
      wo.id.toLowerCase().includes(search.toLowerCase()) ||
      wo.machineId.toLowerCase().includes(search.toLowerCase()) ||
      wo.machineName.toLowerCase().includes(search.toLowerCase()) ||
      wo.technician.toLowerCase().includes(search.toLowerCase()) ||
      wo.suspectedIssue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || wo.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <Layout pageTitle="Work Order Logistics">
      <div className="space-y-4 font-mono">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202722] gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#E6ECE8] flex items-center gap-2">
              <span className="text-[#FF805F]">//</span> MAINTENANCE WORK ORDER LOGISTICS
            </h1>
            <p className="text-xs text-[#8B9890] mt-0.5">
              Draft, dispatch, execute, and sign off on predictive maintenance intervention tasks
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-[#FF805F] hover:bg-[#FF957A] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus size={14} /> Create Work Order
          </button>
        </div>

        {/* METRIC COUNTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {statuses.map(s => {
            const count = workOrders.filter(w => w.status === s).length;
            return (
              <div
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  statusFilter === s
                    ? 'bg-[#161D19] border-[#FF805F] text-[#E6ECE8]'
                    : 'bg-[#111613] border-[#232C26] text-[#8B9890] hover:border-[#333F36]'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider">{s}</div>
                <div className="text-xl font-bold mt-1 text-[#E6ECE8]">{count}</div>
              </div>
            );
          })}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#8B9890]" />
              <input
                type="text"
                placeholder="Search by WO#, machine, technician, defect..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161C18] border border-[#232C26] rounded pl-8 pr-3 py-1.5 text-[#E6ECE8] focus:border-[#FF805F] focus:outline-none placeholder:text-[#56635A]"
              />
            </div>
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#161C18] border border-[#232C26] rounded px-2.5 py-1.5 text-[#E6ECE8] focus:border-[#FF805F] focus:outline-none"
              >
                <option value="ALL">Status: All</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-[#161C18] border border-[#232C26] rounded px-2.5 py-1.5 text-[#E6ECE8] focus:border-[#FF805F] focus:outline-none"
              >
                <option value="ALL">Priority: All</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* WORK ORDERS TABLE */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#161D19] border-b border-[#202722] text-[#8B9890] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Target Equipment</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Suspected Anomaly</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-right">Update Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2520]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8B9890]">
                      No work orders matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(wo => (
                    <tr
                      key={wo.id}
                      onClick={() => setDetailModalOrder(wo)}
                      className="hover:bg-[#161D19] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-[#FF805F]">{wo.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#E6ECE8]">{wo.machineId}</div>
                        <div className="text-[11px] text-[#748279]">{wo.machineName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={wo.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="py-3 px-4 text-[#8B9890] max-w-[220px] truncate">
                        {wo.suspectedIssue}
                      </td>
                      <td className="py-3 px-4 text-[#8B9890]">{wo.technician}</td>
                      <td className="py-3 px-4 text-[#748279]">{wo.scheduledDate}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintModalOrder(wo)}
                            title="Print Work Order Slip"
                            className="p-1 rounded bg-[#161D19] hover:bg-[#202722] border border-[#232C26] text-[#8B9890] hover:text-[#FF805F] transition-colors"
                          >
                            <Printer size={13} />
                          </button>
                          <select
                            value={wo.status}
                            onChange={(e) => updateWorkOrderStatus(wo.id, e.target.value)}
                            className="bg-[#161C18] border border-[#232C26] rounded px-2 py-1 text-[11px] text-[#E6ECE8] focus:border-[#FF805F] focus:outline-none"
                          >
                            {statuses.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WORK ORDER DETAIL DIALOG */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-fadeIn">
          <div className="bg-[#111613] border border-[#232C26] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202722]">
              <div>
                <span className="text-xs text-[#FF805F] font-bold">{detailModalOrder.id}</span>
                <h3 className="text-sm font-bold text-[#E6ECE8]">{detailModalOrder.machineName}</h3>
              </div>
              <StatusBadge status={detailModalOrder.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#8B9890] text-[11px] block uppercase">Suspected Anomaly:</span>
                <p className="text-[#E6ECE8] bg-[#161D19] p-2.5 rounded border border-[#2B352E] mt-1">
                  {detailModalOrder.suspectedIssue}
                </p>
              </div>

              <div>
                <span className="text-[#8B9890] text-[11px] block uppercase">Suggested Action Procedures:</span>
                <p className="text-[#E6ECE8] bg-[#161D19] p-2.5 rounded border border-[#2B352E] mt-1">
                  {detailModalOrder.suggestedInspection}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Assigned Technician</span>
                  <span className="text-[#E6ECE8] font-semibold">{detailModalOrder.technician}</span>
                </div>
                <div className="p-2.5 rounded bg-[#161C18] border border-[#232C26]">
                  <span className="text-[#748279] text-[10px] block">Execution Date</span>
                  <span className="text-[#E6ECE8] font-semibold">{detailModalOrder.scheduledDate}</span>
                </div>
              </div>

              <div>
                <span className="text-[#8B9890] text-[11px] block uppercase">Log Notes:</span>
                <p className="text-[#8B9890] text-[11px] mt-1">
                  {detailModalOrder.resolutionNotes || 'No notes logged.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#202722]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigate(`/machines/${detailModalOrder.machineId}`);
                    setDetailModalOrder(null);
                  }}
                  className="text-xs text-[#FF805F] hover:underline"
                >
                  Telemetry Feed →
                </button>
                <button
                  onClick={() => {
                    setPrintModalOrder(detailModalOrder);
                    setDetailModalOrder(null);
                  }}
                  className="px-2.5 py-1 rounded bg-[#1C2520] hover:bg-[#26322B] text-xs text-[#38BDF8] flex items-center gap-1 border border-[#2B352E]"
                >
                  <Printer size={12} /> Print Ticket
                </button>
              </div>
              <button
                onClick={() => setDetailModalOrder(null)}
                className="px-3 py-1.5 rounded bg-[#161C18] hover:bg-[#202A23] border border-[#232C26] text-xs text-[#E6ECE8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <WorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <WorkOrderPrintModal
        order={printModalOrder}
        isOpen={Boolean(printModalOrder)}
        onClose={() => setPrintModalOrder(null)}
      />
    </Layout>
  );
}
