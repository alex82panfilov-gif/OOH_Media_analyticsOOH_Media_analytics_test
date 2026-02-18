import React, { useState, useRef, useEffect, useId } from 'react';

interface MultiSelectProps {
  label: string; 
  options: string[]; 
  value: string[]; 
  onChange: (vals: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // БЕЗОПАСНАЯ ФИЛЬТРАЦИЯ
  const filteredOptions = (options || []).filter(opt => {
    if (opt === null || opt === undefined) return false;
    return String(opt).toLowerCase().includes((search || '').toLowerCase());
  });

  return (
    <div className="relative flex flex-col min-w-[160px]" ref={containerRef}>
      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{label}</label>
      <button 
        type="button"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold shadow-sm hover:border-teal-500 transition-all h-10"
      >
        <span className="truncate">{value.length === 0 ? 'Все' : `Выбрано: ${value.length}`}</span>
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div id={dropdownId} className="absolute top-full left-0 z-[100] w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-150">
          <input 
            type="text" 
            placeholder="Поиск..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-2 text-xs border-b border-gray-100 outline-none focus:border-teal-500"
          />
          <div className="max-h-48 overflow-y-auto space-y-1" role="listbox" aria-multiselectable="true">
            <button 
              type="button"
              onClick={() => { onChange([]); setIsOpen(false); }} 
              className="w-full text-left px-2 py-1 text-[10px] text-teal-600 font-bold uppercase hover:bg-teal-50 rounded-lg"
            >
              Сбросить все
            </button>
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-[10px] text-gray-400 uppercase">Ничего не найдено</div>
            ) : (
              filteredOptions.map(opt => {
                const valStr = String(opt);
                const isSelected = value.includes(valStr);

                return (
                  <label key={valStr} role="option" aria-selected={isSelected} className="flex items-center px-2 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-teal-600" 
                      checked={isSelected}
                      onChange={() => {
                        const next = isSelected ? value.filter(i => i !== valStr) : [...value, valStr];
                        onChange(next);
                      }} 
                    />
                    <span className="ml-2 text-xs text-gray-600 truncate group-hover:text-gray-900">{valStr}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
