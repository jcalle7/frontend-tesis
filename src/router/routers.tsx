import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RegisterClientPage from '../modules/RegisterClient/RegisterClientPage';
import ClientHistoryPage from '../modules/ClientHistory/ClientHistoryPage';
import ServiceLandingPage from '../modules/ServicesLanding/ServiceLandingPage';
import AllergyClientPage from '../modules/AllergyForm/AllergyClientPage';
import AppointmentLandingPage from '../modules/ScheduleAppointment/AppointmentClientPage';
import AppointmentListPage from '../modules/ViewAppointments/AppoinmentsListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout/>,
    children: [
    { index: true, element: <div style={{ padding: '2rem' }}>Bienvenido al panel administrativo</div>, },
      { path: 'register-client', element: <RegisterClientPage /> },
      { path: 'history-client', element: <ClientHistoryPage /> },
      { path: 'services', element: <ServiceLandingPage /> },
      { path: 'allergy', element: <AllergyClientPage /> },
      { path: 'agendar', element: <AppointmentLandingPage /> },
      { path: 'ver-cita', element: <AppointmentListPage/> },
    ],
  },
]);
