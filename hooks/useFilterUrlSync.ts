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

export const useFilterUrlSync = () => {
  const initializedRef = useRef(false);
  const filters = useDataStore((state) => state.filters);
  const replaceFilters = useDataStore((state) => state.replaceFilters);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const parsedFilters = parseFiltersFromUrl();
    replaceFilters(parsedFilters);

    const handlePopState = () => {
      replaceFilters(parseFiltersFromUrl());
    };

    window.addEventListener('popstate', handlePopState);

    initializedRef.current = true;

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
