'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { WeeklyProjectCheckBatchSummary, WeeklyProjectCheckRunItem } from '@kanban/types';

export function useWeeklyProjectCheck(projectId: string) {
  const historyPath = `/internal/weekly-project-check/history?projectId=${projectId}`;

  const {
    data,
    mutate,
    isLoading,
  } = useSWR<WeeklyProjectCheckRunItem[]>(historyPath, api.get, {
    refreshInterval: 30000,
  });

  const runManualCheck = async (targetProjectId?: string): Promise<WeeklyProjectCheckBatchSummary> => {
    const summary = await api.post<WeeklyProjectCheckBatchSummary>('/internal/weekly-project-check/run-once', {
      projectId: targetProjectId,
    });

    await mutate();
    return summary;
  };

  return {
    history: data ?? [],
    isLoading,
    runManualCheck,
    refreshHistory: mutate,
  };
}
