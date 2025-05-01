import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RegisterClientPage from '../modules/RegisterClient/RegisterClientPage';
// etc.

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout/>,
    children: [
    { index: true, element: <div style={{ padding: '2rem' }}>Bienvenido al panel administrativo</div>, },
      { path: 'register-client', element: <RegisterClientPage /> },
      { path: 'history-client', element: <div>ClientHistoryPage </div> },
      { path: 'servicios', element: <div>Servicios</div> },
      { path: 'alergias', element: <div>Formulario Alergias</div> },
      { path: 'agendar', element: <div>Agendar Cita</div> },
      { path: 'ver-cita', element: <div>Ver Cita</div> },
    ],
  },
]);
