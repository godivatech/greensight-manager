
import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div 
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-[70px]" : "ml-[240px]"
        )}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
