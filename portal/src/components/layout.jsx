import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCog,
  LogOut,
  Shield,
  X,
  ChevronRight,
  ChevronLeft,
  Flame,
  FileText,
  Building,
  Bell,
  AlertTriangle,
  UserCircle,
  Truck,
  CreditCard,
  Settings,
  Users,
  Box,
  ShoppingCart,
  Menu,
  Sparkles,
  Activity,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [usersMenuOpen, setUsersMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      description: "Overview of emergencies and staff",
      roles: ["admin", "staff"],
      badge: null,
    },
    {
      title: "Users",
      icon: Users,
      href: "#users-menu",
      description: "Manage admins, employees, and customers",
      roles: ["admin"],
      isMenu: true,
      badge: "3",
      subItems: [
        {
          title: "Admins",
          href: "/users/admins",
        },
        {
          title: "Employees",
          href: "/users/employees",
        },
        {
          title: "Customers",
          href: "/users/customers",
        },
      ],
    },
    {
      title: "Products",
      icon: Box,
      href: "/products",
      description: "Manage products, images, and stock",
      roles: ["admin", "staff"],
      badge: null,
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: "/orders",
      description: "Manage orders, payments, and deliveries",
      roles: ["admin", "staff"],
      badge: "New",
    },
    {
      title: "Payments",
      icon: CreditCard,
      href: "/payments",
      description: "Manage payments",
      roles: ["admin", "staff"],
      badge: null,
    },
    {
      title: "Deliveries",
      icon: Truck,
      href: "/deliveries",
      description: "Manage deliveries",
      roles: ["admin", "staff"],
      badge: null,
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/reports",
      description: "Comprehensive reports and analytics",
      roles: ["admin"],
      badge: null,
    },
  ];

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.href === location.pathname);
    if (currentItem) return currentItem.title;

    // Check sub-items
    for (const item of navItems) {
      if (item.subItems) {
        const subItem = item.subItems.find(sub => sub.href === location.pathname);
        if (subItem) return subItem.title;
      }
    }

    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/50">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-700/50 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-80" : "w-20",
          "lg:transform-none shadow-2xl shadow-slate-900/10 dark:shadow-black/20",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-20 items-center px-6 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 dark:from-emerald-400/5 dark:via-blue-400/5 dark:to-purple-400/5",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl blur opacity-20" />
                <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Gifts Shop
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Management System</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl blur opacity-20" />
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (windowWidth >= 1024) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  setIsMobileMenuOpen(false);
                }
              }}
              className="hidden lg:flex h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-8 flex flex-col h-[calc(100%-5rem)] justify-between">
          <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
            <nav className="px-6 space-y-3 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {navItems
                .filter((item) => item.roles.includes(user?.role))
                .map((item) => {
                  if (item.isMenu) {
                    return (
                      <div key={item.title}>
                        <button
                          className={cn(
                            "flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium w-full transition-all relative group",
                            usersMenuOpen
                              ? "bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                          onClick={() => setUsersMenuOpen((open) => !open)}
                        >
                          <item.icon className="flex-shrink-0 h-6 w-6" />
                          {isSidebarOpen && (
                            <>
                              <span className="truncate flex-1 text-left font-semibold">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronRight className={cn(
                                "h-5 w-5 transition-transform",
                                usersMenuOpen && "rotate-90"
                              )} />
                            </>
                          )}
                        </button>
                        {isSidebarOpen && usersMenuOpen && (
                          <div className="ml-6 mt-3 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-6">
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                  location.pathname === sub.href
                                    ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/25"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                )}
                              >
                                <div className="w-2 h-2 rounded-full bg-current opacity-70" />
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = location.pathname === item.href;
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all relative group",
                            isActive
                              ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-xl shadow-emerald-500/30"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                        >
                          <item.icon className="flex-shrink-0 h-6 w-6" />
                          {isSidebarOpen && (
                            <>
                              <span className="truncate flex-1 font-semibold">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant={isActive ? "secondary" : "outline"}
                                  className={cn(
                                    "text-xs px-2.5 py-1 border-0",
                                    isActive && "bg-white/20 text-white",
                                    !isActive && item.badge === "!" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse",
                                    !isActive && item.badge === "New" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full shadow-lg" />
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right" className="max-w-xs bg-slate-900 text-white border-slate-700">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
            </nav>
          </TooltipProvider>

          {/* Sidebar Footer */}
          <div className="px-6 mt-auto space-y-6">
            <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-4 justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-2xl py-4 font-medium transition-all",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => logout()}
                  >
                    <LogOut className="h-6 w-6" />
                    {isSidebarOpen && <span>Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                    <p className="font-semibold">Sign Out</p>
                    <p className="text-xs text-slate-300">Log out of your account</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {isSidebarOpen && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-sm text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-600/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-20" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">System Online</p>
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Gifts Management System</p>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Version 2.0.0</p>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-400 dark:text-slate-500">© 2025 Gifts Shop System</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out min-h-screen",
        isSidebarOpen ? "lg:pl-80" : "lg:pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-8 shadow-sm">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="relative lg:hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl blur opacity-20" />
                <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-20" />
              </div>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white font-bold text-lg">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white font-bold">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                {/* <DropdownMenuItem onClick={() => navigate("/admin/profile")} className="cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <UserCircle className="mr-4 h-5 w-5" />
                  <span className="font-medium">Profile Settings</span>
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Settings className="mr-4 h-5 w-5" />
                  <span className="font-medium">Preferences</span>
                </DropdownMenuItem> */}
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-4 font-medium">
                  <LogOut className="mr-4 h-5 w-5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 lg:p-12 min-h-[calc(100vh-5rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};