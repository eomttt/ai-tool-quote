import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ComparePage } from '../pages/ComparePage';
import '../common/styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 영역이 없습니다.');

createRoot(root).render(
  <StrictMode>
    <ComparePage />
  </StrictMode>,
);
