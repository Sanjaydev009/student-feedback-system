'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';

interface UseRealTimeDataOptions {
  endpoint: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useRealTimeData<T = any>({
  endpoint,
  refreshInterval = 30000,
  autoRefresh = true,
  onSuccess,
  onError
}: UseRealTimeDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(endpoint);
      const newData = response.data;
      
      setData(newData);
      setLastUpdate(new Date());
      
      if (onSuccess) {
        onSuccess(newData);
      }
    } catch (error: any) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, fetchData]);

  const manualRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  const forceRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    refreshing,
    lastUpdate,
    isAutoRefreshEnabled,
    manualRefresh,
    toggleAutoRefresh,
    forceRefresh,
    refetch: fetchData
  };
}

export default useRealTimeData;
