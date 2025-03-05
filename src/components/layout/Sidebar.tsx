
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package2, FileText, 
  Receipt, Settings, Menu, X, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const menuItems = [
    { 
      title: 'Dashboard', 
      path: '/', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      title: 'Customers', 
      path: '/customers', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      title: 'Products', 
      path: '/products', 
      icon: <Package2 className="h-5 w-5" /> 
    },
    { 
      title: 'Quotations', 
      path: '/quotations', 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      title: 'Invoices', 
      path: '/invoices', 
      icon: <Receipt className="h-5 w-5" /> 
    },
    { 
      title: 'Settings', 
      path: '/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar z-30 border-r border-border/60 transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center px-3 py-4 justify-between">
          {!collapsed && (
            <Link 
              to="/" 
              className="flex items-center gap-2 font-semibold transition-all duration-300 text-primary"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <span className="h-3 w-3 rounded-full bg-primary animate-pulse-slow"></span>
              </span>
              <span className="animate-fade-in">Prakash Greens</span>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)} 
            className="ml-auto"
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>

        <Separator className="my-2" />

        <nav className="flex-1 overflow-auto p-2">
          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "sidebar-item",
                    location.pathname === item.path && "active"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 mt-auto">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
              !collapsed ? "px-3" : "px-0 justify-center"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
