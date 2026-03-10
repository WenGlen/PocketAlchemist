import { Navigate, useParams } from 'react-router-dom';

// 步驟管理已整合至任務主設定頁的「步驟管理」分頁，此路由直接跳轉。
export function StepsPage() {
  const { questId } = useParams<{ questId: string }>();
  return <Navigate to={`/admin/quest/${questId}`} replace />;
}
