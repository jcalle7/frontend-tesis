import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from "../layouts/AdminLayout.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx"; 
import RegisterClientPage from "../modules/RegisterClient/RegisterClientPage.tsx";
import ClientHistoryPage from "../modules/ClientHistory/ClientHistoryPage.tsx";
import ServiceLandingPage from "../modules/ServicesLanding/ServiceLandingPage.tsx";
import AllergyClientPage from "../modules/AllergyForm/AllergyClientPage.tsx";
import AppointmentLandingPage from "../modules/ScheduleAppointment/AppointmentClientPage.tsx";
import AppointmentListPage from "../modules/ViewAppointments/AppoinmentsListPage.tsx";
import LoginPage from "../components/auth/login.tsx"; 
import CompanyRegisterPage from "../modules/CompanyRegister/CompanyRegisterPage.tsx";
import React from 'react';
import ClientListPage from "../modules/RegisterClient/ListarClientes/ClientListPage.tsx";


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
  errorElement: <div style={{ padding: '2rem' }}>Ruta no encontrada 😢</div>, 
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
    {path: '/clientes', element: <ClientListPage />}
  ],
},
]);
