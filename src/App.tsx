import { GameScreen } from './game/GameScreen';
import { TheDevProvider, TheDev, API_BASE_URL } from './theDev';

function App() {
  return (
    <TheDevProvider
      apiBaseUrl={API_BASE_URL}
      project="PocketAlchemist"
      appVersion="0.0.1"
    >
      <GameScreen />
      <TheDev />
    </TheDevProvider>
  );
}

export default App;
