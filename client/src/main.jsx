import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AdminPage from './pages/AdminPage.jsx';

const path = window.location.pathname.toLowerCase();
const isRouteAdmin = path === '/admin' || path.startsWith('/admin/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isRouteAdmin ? <AdminPage /> : <App />}
  </StrictMode>,
);
