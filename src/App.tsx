//════════════════════════════════════════════════════════════════
// 應用程式根元件
//════════════════════════════════════════════════════════════════
// 包裹 TheDevProvider 與 GameScreen

import { GameScreen } from './game/GameScreen';
import { TheDevProvider, TheDev, API_BASE_URL } from './theDev';
import { APP_VERSION } from './game/version';
// 切換自測題：依版本號更換 import 並更新 selfTestConfig prop
//   MVP-01.xx  → mvp01SelfTest
//   MVP-02.01  → mvp02aSelfTest
//   MVP-02.02  → mvp02bSelfTest
import { mvp01SelfTestConfig } from './theDev/configs/mvp01SelfTest';

function App() {
  return (
    <TheDevProvider
      apiBaseUrl={API_BASE_URL}
      project="PocketAlchemist"
      appVersion={APP_VERSION}
      selfTestConfig={mvp01SelfTestConfig}
    >
      <GameScreen />
      <TheDev />
    </TheDevProvider>
  );
}

export default App;
