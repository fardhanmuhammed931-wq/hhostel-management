import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/students/StudentList';
import { StudentDetail } from './pages/students/StudentDetail';
import { HostelList } from './pages/hostels/HostelList';
import { RoomList } from './pages/rooms/RoomList';
import { AllocationList } from './pages/allocations/AllocationList';
import { FeeList } from './pages/fees/FeeList';
import { PaymentHistory } from './pages/fees/PaymentHistory';
import { VisitorList } from './pages/visitors/VisitorList';
import { MaintenanceList } from './pages/maintenance/MaintenanceList';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserList } from './pages/users/UserList';
import { ProfileSettings } from './pages/profile/ProfileSettings';
import { NotFound } from './pages/NotFound';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-cyan-400">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Application Routes inside AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Student Management */}
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warden']}>
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route path="students/:id" element={<StudentDetail />} />

        {/* Hostel & Room Inventory */}
        <Route
          path="hostels"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warden']}>
              <HostelList />
            </ProtectedRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warden']}>
              <RoomList />
            </ProtectedRoute>
          }
        />

        {/* Room Allocations */}
        <Route
          path="allocations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warden']}>
              <AllocationList />
            </ProtectedRoute>
          }
        />

        {/* Fees & Payments */}
        <Route path="fees" element={<FeeList />} />
        <Route path="payments" element={<PaymentHistory />} />

        {/* Visitors */}
        <Route path="visitors" element={<VisitorList />} />

        {/* Maintenance */}
        <Route path="maintenance" element={<MaintenanceList />} />

        {/* Attendance */}
        <Route path="attendance" element={<AttendancePage />} />

        {/* Reports & Analytics */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'warden']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* User Administration */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserList />
            </ProtectedRoute>
          }
        />

        {/* User Profile & Settings */}
        <Route path="settings" element={<ProfileSettings />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
