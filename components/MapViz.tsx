import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { formatNumberRussian } from '../utils/data';
import { Navigation, MousePointer2, Info } from 'lucide-react';

const FORMAT_COLORS: Record<string, string> = {
  'BB': '#2563eb', 'DBB': '#0891b2', 'CB': '#ea580c',
  'DCB': '#f59e0b', 'CF': '#16a34a', 'DCF': '#10b981',
  'SS': '#84cc16', 'DSS': '#e11d48', 'MF': '#9333ea',
};

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
};

const Clusters = ({ index, onSelect }: any) => {
  const map = useMap();
  const [clusters, setClusters] = useState([]);

  const update = () => {
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
    ];
    setClusters(index.getClusters(bbox, map.getZoom()));
  };

  useEffect(() => {
    update();
    map.on('moveend zoomend', update);
    return () => { map.off('moveend zoomend', update); };
  }, [map, index]);

  return (
    <>
      {clusters.map((cluster: any) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster_id}`}
              position={[lat, lng]}
              icon={L.divIcon({
                html: `<div style="background: #0f172a; color: white; border: 2px solid white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">${point_count}</div>`,
                className: '',
                iconSize: [35, 35]
              })}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(index.getClusterExpansionZoom(cluster_id), 18);
                  map.setView([lat, lng], expansionZoom);
                }
              }}
            />
          );
        }

        return (
          <Marker
            key={`point-${cluster.properties.address}`}
            position={[lat, lng]}
            icon={L.divIcon({
              html: `<svg width="30" height="30" viewBox="0 0 24 24"><path fill="${FORMAT_COLORS[cluster.properties.format] || '#64748b'}" stroke="white" stroke-width="2" d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602z"/></svg>`,
              className: '',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            })}
            eventHandlers={{ click: () => onSelect(cluster.properties.address) }}
          />
        );
      })}
    </>
  );
};

export const MapViz: React.FC<{ data: any[] }> = ({ data }) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // Карта адресов для быстрого поиска
  const surfaceStats = useMemo(() => {
    const stats = new Map();
    data.forEach(p => stats.set(p.address, p));
    return stats;
  }, [data]);

  const center = useMemo((): [number, number] => {
    if (data.length === 0) return [55.75, 37.61];
    return [
      data.reduce((s, p) => s + p.lat, 0) / data.length,
      data.reduce((s, p) => s + p.lng, 0) / data.length
    ];
  }, [data]);

  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 50, maxZoom: 17 });
    sc.load(data.map(p => ({
      type: 'Feature',
      properties: { ...p },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] } as any
    })));
    return sc;
  }, [data]);

  const currentSelection = selectedAddress ? surfaceStats.get(selectedAddress) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[650px]">
      <div className="flex-grow relative rounded-[2.5rem] overflow-hidden border border-slate-200 z-10 shadow-inner bg-slate-50">
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} attributionControl={false}>
          <MapController center={center} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <AttributionControl position="bottomright" prefix="OOH Analytics" />
          <Clusters index={index} onSelect={setSelectedAddress} />
        </MapContainer>
      </div>

      <div className="w-full lg:w-[420px] shrink-0">
        {!currentSelection ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">
            <MousePointer2 className="w-12 h-12 mb-4 animate-bounce opacity-20" />
            <div className="text-sm font-bold uppercase tracking-widest">Выберите объект</div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 text-white relative" style={{ backgroundColor: FORMAT_COLORS[currentSelection.format] || '#64748b' }}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Сведения об объекте</span>
                <button onClick={() => setSelectedAddress(null)} className="bg-white/20 p-2 rounded-full hover:bg-white/40">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 flex-grow overflow-y-auto">
              <div className="text-lg font-black text-slate-900 leading-tight">{currentSelection.address}</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Формат</label>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: FORMAT_COLORS[currentSelection.format] || '#64748b' }}>{currentSelection.format}</span>
                    <span className="text-xs font-bold text-slate-700">Конструкция</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Продавец</label>
                  <div className="text-xs font-black text-slate-800 truncate">{currentSelection.vendor}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] text-center shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Средний GRP</label>
                  <div className="text-3xl font-black text-blue-600">
                    {formatNumberRussian(currentSelection.avgGrp)}
                  </div>
                </div>
                <div className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] text-center shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Средний OTS</label>
                  <div className="text-3xl font-black text-slate-900">
                    {formatNumberRussian(currentSelection.avgOts, 1)}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100/50">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Показатели усреднены по всем доступным волнам за выбранный период фильтрации.</p>
              </div>
            </div>

            <div className="p-8 pt-0 mt-auto">
               <button onClick={() => window.open(`https://yandex.ru/maps/?text=${currentSelection.lat},${currentSelection.lng}`, '_blank')} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                 <Navigation size={16} fill="white" /> Смотреть панораму
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
