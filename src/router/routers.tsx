import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../router/ProtectedRoute'; 
import RegisterClientPage from '../modules/RegisterClient/RegisterClientPage';
import ClientHistoryPage from '../modules/ClientHistory/ClientHistoryPage';
import ServiceLandingPage from '../modules/ServicesLanding/ServiceLandingPage';
import AllergyClientPage from '../modules/AllergyForm/AllergyClientPage';
import AppointmentLandingPage from '../modules/ScheduleAppointment/AppointmentClientPage';
import AppointmentListPage from '../modules/ViewAppointments/AppoinmentsListPage';
import LoginPage from '../components/auth/login'; 
import CompanyRegisterPage from '../modules/CompanyRegister/CompanyRegisterPage';


export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />, 
  },
  {
  path: '/',
  element: (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  ),
  errorElement: <div style={{ padding: '2rem' }}>Ruta no encontrada 😢</div>, // ← ESTO VA AQUÍ
  children: [
    {
      index: true,
      element: <div style={{ padding: '2rem' }}>Bienvenido al panel administrativo</div>,
    },
    { path: 'register-client', element: <RegisterClientPage /> },
    { path: 'history-client', element: <ClientHistoryPage /> },
    { path: 'services', element: <ServiceLandingPage /> },
    { path: 'allergy', element: <AllergyClientPage /> },
    { path: 'agendar', element: <AppointmentLandingPage /> },
    { path: 'ver-cita', element: <AppointmentListPage /> },
    { path: 'register-company', element: <CompanyRegisterPage /> },
  ],
},
]);
