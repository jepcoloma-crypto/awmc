import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refresh: () => void;
}

export function useApi<T = any>(
  url: string,
  deps: any[] = []
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await apiClient.get(url);
      if (mountedRef.current) {
        setState({ data: res.data, loading: false, error: null });
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: err.response?.data?.error || err.message || 'Request failed',
        });
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, deps);

  return { ...state, refresh: fetchData };
}

interface UseMutationOptions<T> {
  method?: 'post' | 'put' | 'delete';
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseMutationResult<T> {
  execute: (body?: any, params?: string) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}

export function useMutation<T = any>(
  url: string,
  options: UseMutationOptions<T> = {}
): UseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (body?: any, params?: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const fullUrl = params ? `${url}/${params}` : url;
      const method = options.method || 'post';
      const res = await (apiClient as any)[method](fullUrl, body);
      if (mountedRef.current) {
        setLoading(false);
        options.onSuccess?.(res.data);
      }
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Request failed';
      if (mountedRef.current) {
        setLoading(false);
        setError(msg);
        options.onError?.(msg);
      }
      return null;
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return { execute, loading, error };
}
