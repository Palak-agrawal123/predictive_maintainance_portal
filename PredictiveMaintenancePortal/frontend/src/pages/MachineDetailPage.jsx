import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Activity,
  Wrench,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Layout } from '../components/layout/Layout';
import { StatusBadge, PriorityBadge } from '../components/common/UIComponents';
import { SensorTrendChart } from '../components/charts/ChartComponents';
import { WorkOrderModal } from '../components/work-orders/WorkOrderModal';
import { api } from '../services/api';

export function MachineDetailPage() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const { machines, workOrders, addToast } = useAppData();

  const [machine, setMachine] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('s2_t24');
  const [selectedRange, setSelectedRange] = useState(35);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isInferring, setIsInferring] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const found = machines.find(m => m.id === machineId);
      if (found) {
        setMachine(found);
        const history = await api.getSensorHistory(found.id, selectedRange);
        setSensorData(history);
      }
      setLoading(false);
    }
    loadData();
  }, [machineId, machines, selectedRange]);

  const handleSimulateInference = async () => {
    setIsInferring(true);
    addToast('Executing inference against C-MAPSS model artifact...', 'info');
    await api.triggerPrediction(machineId);
    setIsInferring(false);
    addToast(`Prediction updated: Machine ${machineId} RUL verified at ${machine?.predictedRul} cycles.`, 'success');
  };

  if (loading) {
    return (
      <Layout pageTitle="Machine Diagnostic Deep Dive">
        <div className="py-24 text-center font-mono text-xs text-[#8B9890]">
          Loading machine telemetry stream & sensor history...
        </div>
      </Layout>
    );
  }

  if (!machine) {
    return (
      <Layout pageTitle="Asset Not Found">
        <div className="bg-[#111613] border border-[#232C26] rounded-lg p-8 text-center max-w-lg mx-auto font-mono">
          <AlertTriangle size={32} className="text-[#FF5B64] mx-auto mb-3" />
          <h2 className="text-sm font-bold text-[#E6ECE8] uppercase mb-1">Asset Not Found</h2>
          <p className="text-xs text-[#8B9890] mb-4">
            Machine ID <span className="text-[#FF805F]">{machineId}</span> does not exist in the registered telemetry pool.
          </p>
          <button
            onClick={() => navigate('/machines')}
            className="px-3 py-1.5 rounded bg-[#1C2520] hover:bg-[#26322B] border border-[#2B352E] text-[#E6ECE8] text-xs"
          >
            Return to Fleet Inventory
          </button>
        </div>
      </Layout>
    );
  }

  const relatedWorkOrders = workOrders.filter(w => w.machineId === machine.id);

  const sensorConfigs = {
    s2_t24: { label: 's2: T24 LPC Outlet Temp (°C)', color: '#FF805F' },
    s4_t50: { label: 's4: T50 LPT Outlet Temp (°C)', color: '#FF5B64' },
    s7_p30: { label: 's7: P30 HPC Outlet Pressure (kPa)', color: '#38BDF8' },
    s8_nf: { label: 's8: Nf Physical Fan Speed (RPM)', color: '#F5B942' },
    s9_nc: { label: 's9: Nc Physical Core Speed (RPM)', color: '#A78BFA' },
    s11_ps30: { label: 's11: Ps30 HPC Static Pressure (psia)', color: '#43D17D' },
    vibration: { label: 'Vibration Amplitude (mm/s)', color: '#E879F9' },
  };

  return (
    <Layout pageTitle={`Diagnostic: ${machine.id}`}>
      <div className="space-y-4 font-mono">
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202722] gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/machines')}
              className="p-1.5 rounded bg-[#141B16] hover:bg-[#1C2520] border border-[#232C26] text-[#8B9890] hover:text-[#E6ECE8] transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-[#E6ECE8]">{machine.name}</h1>
                <StatusBadge status={machine.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8B9890] mt-0.5">
                <span>{machine.id}</span>
                <span>•</span>
                <span>{machine.line}</span>
                <span>•</span>
                <span>{machine.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateInference}
              disabled={isInferring}
              className="px-3 py-1.5 rounded bg-[#141B16] hover:bg-[#1C2520] border border-[#232C26] text-xs text-[#E6ECE8] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles size={13} className="text-[#FF805F]" />
              <span>{isInferring ? 'Recomputing...' : 'Run Prediction API'}</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 rounded bg-[#FF805F] hover:bg-[#FF957A] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Wrench size={14} /> Create Work Order
            </button>
          </div>
        </div>

        {/* 5-BOX OPERATIONAL SPECIFICATION MATRIX */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3">
            <span className="text-[10px] text-[#8B9890] uppercase tracking-wider block">Health Index</span>
            <div className="text-2xl font-bold mt-1 text-[#E6ECE8]">{machine.healthScore}%</div>
            <span className="text-[10px] text-[#56635A]">Operating performance</span>
          </div>

          <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3">
            <span className="text-[10px] text-[#8B9890] uppercase tracking-wider block">Degradation Risk</span>
            <div className={`text-2xl font-bold mt-1 ${machine.riskScore >= 65 ? 'text-[#FF5B64]' : machine.riskScore >= 35 ? 'text-[#F5B942]' : 'text-[#43D17D]'}`}>
              {machine.riskScore} <span className="text-xs text-[#56635A]">/ 100</span>
            </div>
            <span className="text-[10px] text-[#56635A]">{machine.riskLevel} classification</span>
          </div>

          <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3">
            <span className="text-[10px] text-[#8B9890] uppercase tracking-wider block">Predicted RUL</span>
            <div className="text-2xl font-bold mt-1 text-[#FF805F]">{machine.predictedRul}</div>
            <span className="text-[10px] text-[#56635A]">{machine.rulUnit} to service limit</span>
          </div>

          <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3">
            <span className="text-[10px] text-[#8B9890] uppercase tracking-wider block">Asset Criticality</span>
            <div className="text-sm font-bold mt-2">
              <PriorityBadge priority={machine.criticality} />
            </div>
            <span className="text-[10px] text-[#56635A] mt-1 block">Production Impact: {machine.productionImpact}%</span>
          </div>

          <div className="bg-[#111613] border border-[#232C26] rounded-lg p-3">
            <span className="text-[10px] text-[#8B9890] uppercase tracking-wider block">Service Cycle</span>
            <div className="text-lg font-bold mt-1 text-[#E6ECE8]">Cycle #{machine.currentCycle}</div>
            <span className="text-[10px] text-[#56635A]">{machine.operatingHours} cumulative hrs</span>
          </div>
        </div>

        {/* TIME-SERIES SENSOR DEGRADATION VISUALIZATION */}
        <div className="bg-[#111613] border border-[#232C26] rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#202722] gap-2">
            <div>
              <span className="text-xs font-bold text-[#E6ECE8] uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-[#FF805F]" /> Sensor Telemetry Historical Trajectory
              </span>
              <p className="text-[11px] text-[#8B9890]">
                Observed multi-channel sensor dynamics over consecutive run-to-failure cycles
              </p>
            </div>

            {/* Sensor selector & cycle window */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                className="bg-[#161C18] border border-[#232C26] text-xs text-[#E6ECE8] px-2.5 py-1 rounded focus:border-[#FF805F] focus:outline-none"
              >
                <option value="s2_t24">s2: T24 LPC Outlet Temp (°C)</option>
                <option value="s4_t50">s4: T50 LPT Outlet Temp (°C)</option>
                <option value="s7_p30">s7: P30 HPC Outlet Pressure (kPa)</option>
                <option value="s8_nf">s8: Nf Fan Speed (RPM)</option>
                <option value="s9_nc">s9: Nc Core Speed (RPM)</option>
                <option value="s11_ps30">s11: Ps30 Static Pressure HPC (psia)</option>
                <option value="vibration">Vibration Amplitude (mm/s)</option>
              </select>

              <div className="flex items-center border border-[#232C26] rounded overflow-hidden text-xs">
                {[20, 35, 50].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setSelectedRange(cnt)}
                    className={`px-2 py-1 ${selectedRange === cnt ? 'bg-[#202A23] text-[#E6ECE8]' : 'bg-[#141B16] text-[#8B9890] hover:text-[#E6ECE8]'}`}
                  >
                    {cnt} cyc
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SensorTrendChart
            data={sensorData}
            selectedSensor={selectedSensor}
            sensorLabel={sensorConfigs[selectedSensor].label}
            color={sensorConfigs[selectedSensor].color}
            height={260}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#202722] text-[11px] text-[#8B9890] gap-2">
            <span>Telemetric Source: {machine.dataSource}</span>
            <span className="flex items-center gap-1.5 text-[#43D17D]">
              <ShieldCheck size={13} /> {machine.dataQuality}
            </span>
          </div>
        </div>

        {/* TWO-COLUMN DIAGNOSTICS & ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Explainability & Suspected Component Card */}
          <div className="lg:col-span-6 bg-[#111613] border border-[#232C26] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#202722]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E6ECE8] flex items-center gap-2">
                <Sparkles size={14} className="text-[#FF805F]" /> Diagnostic Evidence & Contributing Signals
              </span>
              <span className="text-[10px] text-[#56635A]">Explainable AI</span>
            </div>

            <div>
              <span className="text-[11px] text-[#8B9890] block mb-1">Suspected Anomaly Hypothesis:</span>
              <div className="p-2.5 rounded bg-[#161D19] border border-[#2B352E] text-[#E6ECE8] text-xs">
                {machine.predictedFault}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] text-[#8B9890] block">Top Ranked Degradation Factors:</span>
              {machine.topFactors.map((f, i) => (
                <div key={i} className="p-2 rounded bg-[#161C18] border border-[#232C26] flex items-center justify-between text-xs">
                  <span className="text-[#C2CDC5]">{f.name}</span>
                  <span className="font-bold text-[#FF805F]">{f.value}%</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded bg-[#161D19]/60 border border-[#232C26] text-[11px] text-[#8B9890] leading-relaxed">
              <strong className="text-[#E6ECE8]">Operator Advisory: </strong>
              C-MAPSS models highlight influential telemetric channels. Field engineers must visually inspect physical clearances before disassembling assemblies.
            </div>
          </div>

          {/* Machine Work Orders & Historical Interventions */}
          <div className="lg:col-span-6 bg-[#111613] border border-[#232C26] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#202722]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E6ECE8] flex items-center gap-2">
                <Wrench size={14} className="text-[#38BDF8]" /> Machine Maintenance Tasks ({relatedWorkOrders.length})
              </span>
              <button
                onClick={() => setModalOpen(true)}
                className="text-[11px] text-[#FF805F] hover:underline"
              >
                + Dispatch Order
              </button>
            </div>

            {relatedWorkOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8B9890] border border-dashed border-[#232C26] rounded">
                No active work orders dispatched for this machine.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {relatedWorkOrders.map(wo => (
                  <div key={wo.id} className="p-2.5 rounded bg-[#161C18] border border-[#232C26] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#E6ECE8]">{wo.id}</span>
                      <StatusBadge status={wo.status} />
                    </div>
                    <p className="text-[#8B9890] text-[11px] line-clamp-2">{wo.suspectedIssue}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#748279] pt-1 border-t border-[#202722]">
                      <span>Tech: {wo.technician.split(' ')[0]}</span>
                      <span>Scheduled: {wo.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <WorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedMachine={machine}
      />
    </Layout>
  );
}
