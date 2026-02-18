import React from 'react';
import { MapDataPoint, MatrixDataPoint, TrendDataPoint } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Treemap, LabelList
} from 'recharts';

// --- TREND CHART ---
export const TrendChart: React.FC<{ data: TrendDataPoint[] }> = ({ data }) => {
  const chartData = React.useMemo(() => {
    const monthOrder = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    }).map(d => ({
      name: `${d.month} ${d.year}`,
      avgGrp: Number(d.avgGrp.toFixed(2))
    }));
  }, [data]);

  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">Динамика среднего GRP</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 30, right: 40, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 9, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false}
            padding={{ left: 40, right: 40 }} // Отступы, чтобы точки не вылетали
          />
          <YAxis 
            tick={{ fontSize: 9, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false} 
            domain={[0, (max: number) => Math.ceil(max * 1.3)]} // Запас сверху для меток
          />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
          <Line 
            type="monotone" 
            dataKey="avgGrp" 
            stroke="#0f172a" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
            activeDot={{ r: 6 }}
            animationDuration={500}
          >
            <LabelList dataKey="avgGrp" position="top" offset={12} style={{ fontSize: 10, fontWeight: 'bold', fill: '#0f172a' }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- BAR CHART ---
export const FormatBarChart: React.FC<{ data: MatrixDataPoint[] }> = ({ data }) => {
  const chartData = React.useMemo(() => {
    const map = new Map<string, { sum: number, count: number }>();
    data.forEach(d => {
      const cur = map.get(d.format) || { sum: 0, count: 0 };
      map.set(d.format, { sum: cur.sum + d.avgGrp, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, avgGrp: Number((val.sum / val.count).toFixed(2)) }))
      .sort((a, b) => b.avgGrp - a.avgGrp);
  }, [data]);

  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">Средний GRP по форматам</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ left: -10, right: 40, top: 10, bottom: 10 }}
          barCategoryGap="20%" // Уменьшаем расстояние между группами
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 9, fontWeight: '800', fill: '#475569' }} 
            axisLine={false} 
            tickLine={false} 
            width={70} 
          />
          <Tooltip cursor={{ fill: '#f8fafc' }} />
          <Bar 
            dataKey="avgGrp" 
            fill="#0f172a" 
            radius={[0, 4, 4, 0]} 
            barSize={24} // Делаем линии толще
          >
            <LabelList dataKey="avgGrp" position="right" offset={8} style={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- TREEMAP ---
const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, avgOts, index } = props;
  if (width < 45 || height < 25) return null;
  
  // ЗАЩИТА: Превращаем name в строку и проверяем на null
  const displayName = name ? String(name) : "Неизвестно";
  
  return (
    <g>
      <rect 
        x={x} y={y} width={width} height={height} 
        style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 1 }} 
      />
      <text 
        x={x + 5} y={y + 15} 
        fill="#fff" 
        fontSize={10} 
        fontWeight="700" 
        className="uppercase tracking-tight"
      >
        {/* ЗАЩИТА: Используем displayName.length */}
        {displayName.length > width / 7 
          ? displayName.substring(0, Math.floor(width / 7)) + '...' 
          : displayName}
      </text>
      <text x={x + 5} y={y + height - 7} fill="rgba(255,255,255,0.7)" fontSize={9}>
        {Math.round(avgOts || 0).toLocaleString()} т.
      </text>
    </g>
  );
};

export const VendorTreemap: React.FC<{ data: MapDataPoint[] }> = ({ data }) => {
  const chartData = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      const cur = map.get(d.vendor) || 0;
      map.set(d.vendor, cur + (d.avgOts || 0));
    });
    return Array.from(map.entries())
      .map(([name, avgOts]) => ({ name, avgOts }))
      .sort((a, b) => b.avgOts - a.avgOts);
  }, [data]);

  return (
    <div className="h-64 w-full flex flex-col">
      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">Доля рынка (OTS)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap 
          data={chartData} 
          dataKey="avgOts" 
          stroke="#fff" 
          content={<CustomTreemapContent />}
          animationDuration={500}
        >
          <Tooltip formatter={(val: number) => `${Math.round(val).toLocaleString()} тыс.`} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
