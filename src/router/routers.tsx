import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from "../layouts/AdminLayout.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx"; 
import RegisterClientPage from "../modules/RegisterClient/RegisterClientPage.tsx";
import ClientHistoryPage from "../modules/ClientHistory/ClientHistoryPage.tsx";
import ServiceManager from "../modules/ServicesLanding/pages/ServiceManager.tsx";
import AllergyClientPage from "../modules/AllergyForm/AllergyClientPage.tsx";
import AppointmentLandingPage from "../modules/ScheduleAppointment/AppointmentClientPage.tsx";
import AppointmentListPage from "../modules/ViewAppointments/AppoinmentsListPage.tsx";
import LoginPage from "../components/auth/login.tsx"; 
import CompanyRegisterPage from "../modules/CompanyRegister/CompanyRegisterPage.tsx";
import React from 'react';
import ClientListPage from "../modules/RegisterClient/ListarClientes/ClientListPage.tsx";
import FormPreview from "../modules/AllergyForm/ListarFormularios/FormsPreview.tsx";
import FormsTable from "../modules/AllergyForm/ListarFormularios/FormsTable.tsx";
import CompanyLandingPage from '../modules/ServicesLanding/pages/CompanyLandingPage.tsx';
import RedirectClientToSlugLanding from '../modules/ServicesLanding/pages/RedirectClientToSlugLanding.tsx';
import LoginClientPage from '../components/Pages/loginClientPage.tsx'; 
import FillFormPage from '../modules/ViewAppointments/FillFormPage';
import FormSubmissionsTable from "../modules/ViewAppointments/FormSubmissionsTable";

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />, 
  },
  {
    path: '/empresa/:slug',
    element: <CompanyLandingPage />, // Ruta pública de landing
  },
  {
  path: '/mi-empresa',
  element: <RedirectClientToSlugLanding />
  },
  {
  path: '/login-cliente',
  element: <LoginClientPage />, 
  },
  {
  path: '/formularios/llenar/:formId/:clientId',
  element: <FillFormPage />,
  },
  { 
  path: 'formularios/enviados', 
  element: <FormSubmissionsTable /> 
  },
  {
  path: '/mi-empresa',
  element: <RedirectClientToSlugLanding />
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
    { path: 'services', element: <ServiceManager /> },
    { path: 'allergy', element: <AllergyClientPage /> },
    { path: 'agendar', element: <AppointmentLandingPage /> },
    { path: 'ver-cita', element: <AppointmentListPage /> },
    { path: 'register-company', element: <CompanyRegisterPage /> },
    {path: 'clientes', element: <ClientListPage />},
    {path: 'formularios', element: <FormsTable />},
    {path: 'formularios/vista-previa/:id', element: <FormPreview />},
  ],
},
]);
