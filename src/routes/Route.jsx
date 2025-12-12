import { createBrowserRouter } from "react-router-dom";
import ForgotPassword from "../pages/Authentication/ForgotPassword";
import PrivateRoutes from "./PrivateRoutes";
import LoginPage from "../pages/Authentication/LoginPage";
import RegisterPage from "../pages/Authentication/RegisterPgae";
import ResetPassword from "../pages/Authentication/ResetPassword";
import CreateDoctor from "../pages/admin/CreateDoctor";
import DoctorPortal from "../pages/homepage/DoctorDashBoard/DoctorPortal";
import Home from "../pages/homepage/HomeDashborad/Home";
import Appointments from "../pages/homepage/HomeDashborad/Appointments";
import Billing from "../pages/homepage/HomeDashborad/Billing";
import Prescriptions from "../pages/homepage/HomeDashborad/Prescriptions";
import PrescriptionDetails from "../pages/homepage/HomeDashborad/PrescriptionDetails";
import Messages from "../pages/homepage/HomeDashborad/Messages";
import MedicalRecords from "../pages/homepage/HomeDashborad/MedicalRecords";
import DashboardHome from "../pages/homepage/HomeDashborad/DashboardHome";

import DoctorProfile from "../pages/homepage/DoctorDashBoard/DoctorProfile";
import UpdateDoctorProfile from "../pages/homepage/DoctorDashBoard/UpdateDoctorProfile";
import HelpDeskProfile from "../pages/helpdesk/HelpDeskProfile";
import UpdateHelpDeskProfile from "../pages/helpdesk/UpdateHelpDeskProfile";
import path from "path";
import HelpDesk from "../pages/helpdesk/HelpDesk";
import HelpDeskDashboard from "../pages/helpdesk/HelpDeskDashboard";
import HelpDeskAppointments from "../pages/helpdesk/HelpDeskAppointments";
import CreateHelpDesk from "../pages/admin/CreateHelpDesk";
import DoctorMessages from "../pages/helpdesk/DoctorMessages";
import AdminProfile from "../pages/admin/AdminProfile";
import UpdateAdminProfile from "../pages/admin/UpdateAdminProfile";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLayout from "../pages/admin/AdminLayout";
import UsersList from "../pages/admin/UsersList";
import HospitalsList from "../pages/admin/HospitalsList";
import HospitalDetails from "../pages/admin/HospitalDetails";
import CreateAdmin from "../pages/admin/CreateAdmin";
import AssignDoctor from "../pages/admin/AssignDoctor";
import AssignHelpDesk from "../pages/admin/AssignHelpDesk";
import Broadcast from "../pages/admin/Broadcast";
import AuditLogs from "../pages/admin/AuditLogs";
import PatientProfile from "../pages/homepage/HomeDashborad/PatientProfile";
import UpdatePatientProfile from "../pages/homepage/HomeDashborad/UpdatePatientProfile";
import CreateHospital from "../pages/admin/CreateHospital";
import NewDoctorDashboard from "../pages/homepage/DoctorDashBoard/NewDoctorDashboard";
import PatientsPage from "../pages/homepage/DoctorDashBoard/PatientsPage";
import FrontDeskPage from "../pages/homepage/DoctorDashBoard/FrontDeskPage";
import AppointmentsPage from "../pages/homepage/DoctorDashBoard/AppointmentsPage";
import Prescription from "../pages/homepage/DoctorDashBoard/Prescription";
import AnalyticsPage from "../pages/homepage/DoctorDashBoard/AnalyticsPage";
import DoctorLeave from "../pages/homepage/DoctorDashBoard/DoctorLeave";
import DoctorCalendar from "../pages/homepage/DoctorDashBoard/DoctorCalendar";
import HelpDeskLeaves from "../pages/helpdesk/HelpDeskLeaves";
import LandingPage from "../pages/homepage/LandingPage";
import Settings from "../pages/common/Settings";
import SupportDashboard from "../pages/support/SupportDashboard";
import CreateTicket from "../pages/support/CreateTicket";
import TicketDetail from "../pages/support/TicketDetail";
import NotFoundPage from "../components/cards/NotFoundPage";


let route = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/home",
    element: <Home />, // Layout with navbar/sidebar
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "appointments", element: <Appointments /> },
      { path: "records", element: <MedicalRecords /> },
      { path: "aisymptomchecker", element: <Messages /> },
      { path: "prescriptions", element: <Prescriptions /> },
      { path: "prescriptions/:id", element: <PrescriptionDetails /> },
      { path: "billing", element: <Billing /> },
      { path: "settings", element: <Settings /> },

      // Support Routes
      { path: "support", element: <SupportDashboard /> },
      { path: "support/create", element: <CreateTicket /> },
      { path: "support/ticket/:id", element: <TicketDetail /> },


      // Patient routes inside the layout
      {
        element: <PrivateRoutes allowedRoles={["patient"]} />,
        children: [
          { path: "patient/profile", element: <PatientProfile /> },
          { path: "patient/profile/edit", element: <UpdatePatientProfile /> },
        ],
      },
    ],
  },

  {
    element: <PrivateRoutes allowedRoles={["doctor"]} />,
    children: [
      {
        path: "/doctor",
        element: <DoctorPortal />, // LAYOUT
        children: [
          { index: true, element: <NewDoctorDashboard /> },
          { path: "profile", element: <DoctorProfile /> },
          { path: "profile/edit", element: <UpdateDoctorProfile /> },
          { path: "patients", element: <PatientsPage /> },
          { path: "appointments", element: <AppointmentsPage /> },
          { path: "prescription", element: <Prescription /> },
          { path: "frontdesk", element: <FrontDeskPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "leaves", element: <DoctorLeave /> },
          { path: "calendar", element: <DoctorCalendar /> },
          { path: "settings", element: <Settings /> },

          // Support Routes
          { path: "support", element: <SupportDashboard /> },
          { path: "support/create", element: <CreateTicket /> },
          { path: "support/ticket/:id", element: <TicketDetail /> },
        ],
      },
    ],
  },

  {
    element: <PrivateRoutes allowedRoles={["super-admin", "admin"]} />,
    children: [
      {
        path: "/",
        element: <AdminLayout />, // Layout
        children: [
          { path: "admin", element: <AdminDashboard /> },
          { path: "admin/profile", element: <AdminProfile /> },
          { path: "admin/profile/edit", element: <UpdateAdminProfile /> },
          { path: "admin/users", element: <UsersList /> },
          { path: "admin/hospitals", element: <HospitalsList /> },
          { path: "admin/hospitals/:id", element: <HospitalDetails /> },
          { path: "admin/doctors", element: <UsersList role="doctor" /> }, // Reusing UsersList for doctors
          { path: "admin/admins", element: <UsersList role="admin" /> },
          { path: "admin/patients", element: <UsersList role="patient" /> },
          { path: "admin/helpdesks", element: <UsersList role="helpdesk" /> },
          { path: "admin/create-admin", element: <CreateAdmin /> },
          { path: "admin/create-doctor", element: <CreateDoctor /> },
          { path: "admin/create-helpdesk", element: <CreateHelpDesk /> },
          { path: "admin/create-hospital", element: <CreateHospital /> },
          { path: "admin/assign-doctor", element: <AssignDoctor /> },
          { path: "admin/assign-helpdesk", element: <AssignHelpDesk /> },
          { path: "admin/broadcast", element: <Broadcast /> },
          { path: "admin/audits", element: <AuditLogs /> },
          { path: "settings", element: <Settings /> },

          // Support Routes
          { path: "support", element: <SupportDashboard /> },
          { path: "support/create", element: <CreateTicket /> },
          { path: "support/ticket/:id", element: <TicketDetail /> },
        ],
      },
    ],
  },

  {
    element: <PrivateRoutes allowedRoles={["admin", "helpdesk"]} />,
    children: [
      {
        path: "/helpdesk",
        element: <HelpDesk />, // Layout
        children: [
          { index: true, element: <HelpDeskDashboard /> },
          { path: "appointments", element: <HelpDeskAppointments /> },
          { path: "profile", element: <HelpDeskProfile /> },
          { path: "profile/edit", element: <UpdateHelpDeskProfile /> },
          { path: "messages", element: <DoctorMessages /> },
          { path: "create-doctor", element: <CreateDoctor /> },
          { path: "leaves", element: <HelpDeskLeaves /> },
          { path: "settings", element: <Settings /> },

          // Support Routes
          { path: "support", element: <SupportDashboard /> },
          { path: "support/create", element: <CreateTicket /> },
          { path: "support/ticket/:id", element: <TicketDetail /> },
        ],
      },
    ],
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgotpassword",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },



  {
    path: "*",
    element: <NotFoundPage />,
  }
]);
export default route;