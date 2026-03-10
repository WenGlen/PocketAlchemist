import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { QuestListPage } from './pages/QuestListPage';
import { QuestNewPage } from './pages/QuestNewPage';
import { QuestDetailPage } from './pages/QuestDetailPage';
import { StepsPage } from './pages/StepsPage';
import { StepEditorPage } from './pages/StepEditorPage';
import { MapsPage } from './pages/MapsPage';
import { SyncPage } from './pages/SyncPage';

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<QuestListPage />} />
        <Route path="quest/new" element={<QuestNewPage />} />
        <Route path="quest/:questId" element={<QuestDetailPage />} />
        <Route path="quest/:questId/steps" element={<StepsPage />} />
        <Route path="quest/:questId/step/:idx" element={<StepEditorPage />} />
        <Route path="maps" element={<MapsPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
