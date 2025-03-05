
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package2, FileText, 
  Receipt, Settings, Menu, X, LogOut, 
  Sun, Moon, ChevronRight, BarChart3, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { isAdmin, logout, userData } = useAuth();
  const { setTheme, theme } = useTheme();
  const [activeGroup, setActiveGroup] = useState<string | null>("main");

  const mainMenuItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
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
  ];

  const analyticsMenuItems = [
    { 
      title: 'Performance', 
      path: '/analytics/performance', 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      title: 'Energy Output', 
      path: '/analytics/energy', 
      icon: <Zap className="h-5 w-5" /> 
    },
  ];

  const settingsMenuItems = [
    { 
      title: 'Settings', 
      path: '/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  const menuGroups = [
    { id: "main", title: "Main Menu", items: mainMenuItems },
    { id: "analytics", title: "Analytics", items: analyticsMenuItems },
    { id: "settings", title: "Settings", items: settingsMenuItems },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleGroup = (groupId: string) => {
    setActiveGroup(activeGroup === groupId ? null : groupId);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar z-30 border-r border-border/60 transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-3 py-4 justify-between">
          {!collapsed && (
            <Link 
              to="/" 
              className="flex items-center gap-2 font-semibold transition-all duration-300 text-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <span className="h-3 w-3 rounded-full bg-primary animate-pulse-slow"></span>
              </span>
              <span className="animate-fade-in text-lg">Prakash Energy</span>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)} 
            className={cn("ml-auto", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>

        <Separator className="my-2" />

        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="rounded-lg bg-sidebar-accent/20 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {userData?.name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userData?.name || "User"}</span>
                  <span className="text-xs text-sidebar-foreground/70">{isAdmin ? "Administrator" : "Employee"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-auto p-2 mt-2">
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-3">
              {!collapsed && (
                <div 
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{group.title}</span>
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 transition-transform", 
                      activeGroup === group.id && "transform rotate-90"
                    )} 
                  />
                </div>
              )}
              
              {(collapsed || activeGroup === group.id) && (
                <ul className="flex flex-col gap-1 mt-1">
                  {group.items.map((item) => (
                    <li key={item.path}>
                      {collapsed ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={item.path}
                                className={cn(
                                  "sidebar-item justify-center",
                                  isActive(item.path) && "active"
                                )}
                              >
                                {item.icon}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Link
                          to={item.path}
                          className={cn(
                            "sidebar-item",
                            isActive(item.path) && "active"
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="p-2 mt-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="mb-2 w-full justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
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
