import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileNav } from './MobileNav';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Determine current page title
  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/students')) return 'Student Directory';
    if (pathname.startsWith('/hostels')) return 'Hostel Buildings';
    if (pathname.startsWith('/rooms')) return 'Rooms & Inventory';
    if (pathname.startsWith('/allocations')) return 'Room Allocations';
    if (pathname.startsWith('/fees')) return 'Fee Management';
    if (pathname.startsWith('/payments')) return 'Payment Receipts';
    if (pathname.startsWith('/visitors')) return 'Hostel Visitor Logs';
    if (pathname.startsWith('/maintenance')) return 'Maintenance & Complaints';
    if (pathname.startsWith('/attendance')) return 'Daily Roll Call Attendance';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/settings')) return 'Profile & Settings';
    return 'Hostel Management System';
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          pageTitle={getPageTitle(location.pathname)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
