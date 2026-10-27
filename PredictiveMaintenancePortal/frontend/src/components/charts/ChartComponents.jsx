import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie
} from 'recharts';

/**
 * Custom dark industrial tooltip
 */
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141916] border border-[#2B352E] px-2.5 py-1.5 rounded shadow-xl text-xs font-mono">
        <div className="text-[#8B9890] text-[10px] mb-0.5">{label}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#E6ECE8] font-semibold">
              {entry.name ? `${entry.name}: ` : ''}{entry.value}{unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Fleet Risk Distribution bar chart - showing count of machines across 4 risk bands
 */
export function FleetRiskBarChart({ data, height = 180 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1D2520" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
          />
          <YAxis
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip unit=" assets" />} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#FF805F'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Fleet-wide Workload & Work Order trend over recent days/weeks
 */
export function MaintenanceWorkloadTrendChart({ data, height = 180 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="workloadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF805F" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#FF805F" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#43D17D" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#43D17D" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1D2520" vertical={false} />
          <XAxis
            dataKey="period"
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
          />
          <YAxis
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit=" orders" />} />
          <Area
            type="monotone"
            dataKey="created"
            name="Logged Tasks"
            stroke="#FF805F"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#workloadGrad)"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resolved Tasks"
            stroke="#43D17D"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#resolvedGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Time-series sensor trend graph with selectable telemetry metric
 */
export function SensorTrendChart({ data, selectedSensor = 'temperature', sensorLabel = 'LPC Temp (°C)', color = '#FF805F', height = 240 }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center border border-[#232C26] rounded bg-[#101412] text-xs font-mono text-[#8B9890]">
        No telemetry stream available for selected machine
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#1D2520" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
          />
          <YAxis
            stroke="#56635A"
            tick={{ fill: '#8B9890', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip unit="" />} />
          <Line
            type="monotone"
            dataKey={selectedSensor}
            name={sensorLabel}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#0C100E', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
