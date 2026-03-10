//════════════════════════════════════════════════════════════════
// 應用程式根元件
//════════════════════════════════════════════════════════════════
// 包裹 TheDevProvider 與 GameScreen
// 在渲染遊戲前，依 debugConfig.useLocalData 初始化任務資料來源

import { useState, useEffect } from 'react';
import { GameScreen } from './game/GameScreen';
import { TheDevProvider, TheDev, API_BASE_URL } from './theDev';
import { APP_VERSION, debugConfig } from './devVersion';
// 切換自測題：依版本號更換 import 並更新 selfTestConfig prop
//   MVP-01.xx  → mvp01SelfTest
//   MVP-02.01  → mvp02aSelfTest
//   MVP-02.02  → mvp02bSelfTest
import { mvp01SelfTestConfig } from './theDev/configs/mvp01SelfTest';
import { getQuestTable, getQuestList } from './core/config/dataSource';
import { initQuestRuntime } from './quests/data/questData';

type InitState = 'loading' | 'ready' | 'error';

function App() {
  const [initState, setInitState] = useState<InitState>(
    // 本地模式：跳過非同步載入，直接 ready（本地資料已是預設值）
    debugConfig.useLocalData ? 'ready' : 'loading'
  );
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (debugConfig.useLocalData) return; // 本地模式不需要載入

    let cancelled = false;

    (async () => {
      try {
        const [table, list] = await Promise.all([getQuestTable(), getQuestList()]);
        if (cancelled) return;
        initQuestRuntime(table, list);
        setInitState('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('[dataSource] 遠端資料載入失敗，回退至本地資料', err);
        setInitError(err instanceof Error ? err.message : String(err));
        // 不呼叫 initQuestRuntime → 自動沿用本地靜態預設值
        setInitState('ready');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (initState === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-text-muted)]">載入任務資料中…</span>
        </div>
      </div>
    );
  }

  return (
    <TheDevProvider
      apiBaseUrl={API_BASE_URL}
      project="PocketAlchemist"
      appVersion={APP_VERSION}
      selfTestConfig={mvp01SelfTestConfig}
    >
      {initError && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 rounded-lg bg-[var(--color-text-error)]/10 border border-[var(--color-text-error)] text-[var(--color-text-error)] text-xs">
          ⚠ 遠端資料載入失敗，使用本地備份資料（{initError}）
        </div>
      )}
      <GameScreen />
      <TheDev />
    </TheDevProvider>
  );
}

export default App;
