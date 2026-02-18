import { useEffect, useRef } from 'react';
import { FilterState } from '../types';
import { useDataStore, emptyFilters } from '../store/useDataStore';

const FILTER_KEYS: Array<keyof FilterState> = ['city', 'year', 'month', 'format', 'vendor'];

const parseFiltersFromUrl = (): FilterState => {
  const params = new URLSearchParams(window.location.search);

  return FILTER_KEYS.reduce((acc, key) => {
    const values = params.getAll(key).map((value) => value.trim()).filter(Boolean);
    acc[key] = values;
    return acc;
  }, { ...emptyFilters });
};

const hasAnyFilters = (filters: FilterState): boolean => FILTER_KEYS.some((key) => filters[key].length > 0);

export const useFilterUrlSync = () => {
  const initializedRef = useRef(false);
  const filters = useDataStore((state) => state.filters);
  const replaceFilters = useDataStore((state) => state.replaceFilters);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const parsedFilters = parseFiltersFromUrl();
    if (hasAnyFilters(parsedFilters)) {
      replaceFilters(parsedFilters);
    }

    initializedRef.current = true;
  }, [replaceFilters]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    FILTER_KEYS.forEach((key) => {
      params.delete(key);
      filters[key].forEach((value) => params.append(key, value));
    });

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [filters]);
};
