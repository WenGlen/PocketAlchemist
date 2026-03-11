import { useState, useEffect } from 'react';
import { getQuestTable } from '../../core/config/dataSource';
import type { QuestDef } from '../../quests/data/questData';

interface UseQuestTableResult {
  questTable: Record<string, QuestDef> | null;
  loading: boolean;
  error: string | null;
}

export function useQuestTable(): UseQuestTableResult {
  const [questTable, setQuestTable] = useState<Record<string, QuestDef> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuestTable()
      .then(setQuestTable)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '載入任務資料失敗'))
      .finally(() => setLoading(false));
  }, []);

  return { questTable, loading, error };
}
