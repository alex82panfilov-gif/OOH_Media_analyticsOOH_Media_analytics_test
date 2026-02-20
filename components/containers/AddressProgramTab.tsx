import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMediaPlanStore } from '../../store/useMediaPlanStore';
import { EmptyState } from '../ui/EmptyState';

const markerIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#0d9488;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const AddressProgramTab: React.FC = () => {
  const items = useMediaPlanStore((state) => state.items);

  const mappedItems = React.useMemo(
    () => items.filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number'),
    [items],
  );

  const missingCoordsCount = items.length - mappedItems.length;

  const center = React.useMemo((): [number, number] => {
    if (mappedItems.length === 0) {
      return [55.751244, 37.618423];
    }

    const totals = mappedItems.reduce(
      (acc, item) => ({ lat: acc.lat + (item.lat ?? 0), lng: acc.lng + (item.lng ?? 0) }),
      { lat: 0, lng: 0 },
    );

    return [totals.lat / mappedItems.length, totals.lng / mappedItems.length];
  }, [mappedItems]);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <EmptyState className="min-h-[55vh]" />
      </div>
    );
  }

  if (mappedItems.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 min-h-[55vh] flex flex-col justify-center">
        <p className="text-sm font-bold uppercase tracking-wide">Нет координат для отображения</p>
        <p className="text-xs mt-2">Добавьте в медиаплан конструкции из вкладки «Карта», чтобы увидеть их в адресной программе.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {missingCoordsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          {missingCoordsCount} поз. не отображаются на карте, т.к. добавлены из отчета без координат.
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2">
        <MapContainer center={center} zoom={9} className="h-[72vh] w-full" attributionControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {mappedItems.map((item) => (
            <Marker key={item.id} position={[item.lat!, item.lng!]} icon={markerIcon}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-gray-500">{item.city} · {item.format}</div>
                  <div className="text-gray-400">{item.period}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
