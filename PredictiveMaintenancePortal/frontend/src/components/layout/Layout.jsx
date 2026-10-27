import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Layers,
  SlidersHorizontal,
  Wrench,
  Activity,
  Bell,
  RefreshCw,
  Terminal,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { ToastContainer } from '../common/Toast';
import { GuidedDemoModal } from '../demo/GuidedDemoModal';

export function Layout({ children, pageTitle = "Overview", breadcrumb = [] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const { alerts, markAlertAsRead, resetAllDemoData } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = alerts.filter(a => !a.read);

  // Grouped Navigation strictly matching DEV-P04 Hackathon requirements
  const navigationSections = [
    {
      title: "OPERATIONS",
      items: [
        { to: "/dashboard", label: "Fleet Overview", icon: LayoutGrid, tag: "Live" },
        { to: "/machines", label: "Machine Fleet", icon: Layers, count: 8 },
        { to: "/maintenance-priority", label: "Priority Decision", icon: SlidersHorizontal, highlight: true }
      ]
    },
    {
      title: "MAINTENANCE ACTIONS",
      items: [
        { to: "/work-orders", label: "Work Orders", icon: Wrench, tag: "Draft/Log" }
      ]
    },
    {
      title: "ML DECISION ENGINE",
      items: [
        { to: "/predictions", label: "Models & Evaluation", icon: Activity, tag: "NASA" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0C100E] text-[#E6ECE8] flex font-sans antialiased selection:bg-[#FF805F] selection:text-black">
      <ToastContainer />

      {/* MOBILE TOPBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#101512] border-b border-[#232C26] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-7 h-7 rounded bg-[#FF805F]/15 border border-[#FF805F]/40 flex items-center justify-center text-[#FF805F]">
            <Terminal size={15} />
          </div>
          <span className="font-mono font-bold tracking-wider text-sm">
            PREDICT<span className="text-[#FF805F]">X</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 text-[#8B9890] hover:text-[#E6ECE8] relative"
          >
            <Bell size={18} />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5B64]" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#8B9890] hover:text-[#E6ECE8]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (Original Industrial Graphite Rail) */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-64 bg-[#101412] border-r border-[#202722] flex flex-col justify-between z-30 transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Identity & Plant Info */}
          <div className="px-5 py-4 border-b border-[#202722] flex items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#FF805F]/10 border border-[#FF805F]/30 flex items-center justify-center text-[#FF805F] group-hover:bg-[#FF805F]/20 transition-all">
                <Terminal size={17} />
              </div>
              <div>
                <div className="font-mono font-bold text-sm tracking-wider text-[#E6ECE8]">
                  Predict<span className="text-[#FF805F]">X</span>
                </div>
                <div className="text-[10px] font-mono text-[#748279] tracking-tight">Plant Ops Platform</div>
              </div>
            </NavLink>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161D19] border border-[#2B352E] text-[#8B9890]">
              PROT-V1
            </span>
          </div>

          {/* Plant Unit Context Badge */}
          <div className="px-4 py-2.5 mx-3 mt-3 rounded bg-[#151C17] border border-[#242E27] flex items-center justify-between text-[11px] font-mono text-[#8B9890]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43D17D] animate-pulse" />
              Line-01 Telemetry Active
            </span>
            <span className="text-[10px] text-[#56635A]">8 Nodes</span>
          </div>

          {/* Nav Categories */}
          <nav className="flex-1 px-3 py-4 space-y-5">
            {navigationSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-2 text-[10px] font-mono tracking-widest text-[#56635A] uppercase font-bold">
                  {sec.title}
                </div>
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all group
                        ${isActive
                          ? 'bg-[#1C2520] text-[#FF805F] font-semibold border-l-2 border-[#FF805F]'
                          : 'text-[#8B9890] hover:text-[#E6ECE8] hover:bg-[#151C18]'}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-[#FF805F]' : 'text-[#748279] group-hover:text-[#E6ECE8]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.tag && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#202A23] text-[#8B9890] border border-[#2B352E]">
                            {item.tag}
                          </span>
                        )}
                        {item.count && (
                          <span className="text-[10px] text-[#748279] font-normal">{item.count}</span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer Engine Status Panel */}
          <div className="p-3 border-t border-[#202722] bg-[#0E1210]">
            <div className="p-2.5 rounded bg-[#141B16] border border-[#232C25] text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8B9890]">Pipeline Status</span>
                <span className="text-[#43D17D] flex items-center gap-1 text-[10px]">
                  <ShieldCheck size={12} /> Local Replay
                </span>
              </div>
              <div className="text-[10px] text-[#748279] leading-tight">
                Simulated NASA C-MAPSS dataset. Future integration endpoints pre-configured.
              </div>
              <button
                onClick={resetAllDemoData}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-[#1C2520] hover:bg-[#26322B] border border-[#2B362F] text-[#E6ECE8] text-[10px] transition-colors"
                title="Reset local changes and work orders to baseline"
              >
                <RefreshCw size={11} /> Reset Local Data
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        {/* TOP UTILITY HEADER */}
        <header className="h-14 bg-[#101412] border-b border-[#202722] px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#56635A]">CONTROL //</span>
            <span className="text-xs font-mono text-[#E6ECE8] font-bold tracking-wider uppercase">
              {pageTitle}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Launch Guided Demo Button */}
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-3 py-1.5 rounded bg-[#FF805F] hover:bg-[#FF957A] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,128,95,0.25)]"
              title="Launch DEV-P04 End-to-End Guided Demo Flow"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Launch Guided Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Clock & Replay Mode Tag */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141B16] border border-[#232C25] text-[#8B9890] text-[11px]">
              <Clock size={12} className="text-[#FF805F]" />
              <span className="text-[#E6ECE8] font-medium">{currentTime} UTC</span>
              <span className="text-[#56635A]">|</span>
              <span className="text-[#43D17D]">Offline Demo Mode</span>
            </div>

            {/* Quick Reset Button */}
            <button
              onClick={resetAllDemoData}
              className="p-1.5 rounded bg-[#141B16] border border-[#232C25] text-[#8B9890] hover:text-[#E6ECE8] hover:border-[#333F36] transition-colors"
              title="Reset state to initial C-MAPSS demo data"
            >
              <RefreshCw size={14} />
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded bg-[#141B16] border border-[#232C25] text-[#8B9890] hover:text-[#E6ECE8] hover:border-[#333F36] transition-colors relative"
                title="Plant Telemetry Alerts"
              >
                <Bell size={14} />
                {unreadAlerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF5B64] ring-2 ring-[#101412]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#141B16] border border-[#2A342D] rounded-lg shadow-2xl p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232C25]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E6ECE8]">
                      Plant Alerts ({alerts.length})
                    </span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#8B9890] hover:text-[#E6ECE8]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {alerts.map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          markAlertAsRead(alert.id);
                          navigate(`/machines/${alert.machineId}`);
                          setNotificationsOpen(false);
                        }}
                        className={`p-2 rounded border cursor-pointer transition-colors text-xs ${
                          alert.severity === 'Critical'
                            ? 'bg-[#FF5B64]/5 border-[#FF5B64]/30 hover:border-[#FF5B64]'
                            : 'bg-[#F5B942]/5 border-[#F5B942]/30 hover:border-[#F5B942]'
                        } ${alert.read ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#8B9890] mb-0.5">
                          <span className="font-bold text-[#E6ECE8]">{alert.machineId}</span>
                          <span>{alert.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-[#E6ECE8] leading-tight">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Identifier */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#202722]">
              <div className="w-6 h-6 rounded bg-[#1C2520] border border-[#2B352E] flex items-center justify-center text-[10px] text-[#FF805F] font-bold">
                PX
              </div>
              <span className="hidden lg:inline text-[11px] text-[#8B9890]">Supervisor Mode</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <GuidedDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
