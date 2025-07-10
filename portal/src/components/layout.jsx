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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-in-out shadow-xl",
          isSidebarOpen ? "w-72" : "w-20",
          "lg:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-20 items-center px-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Gifts</h1>
                <p className="text-xs text-muted-foreground">Shop System</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
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
              className="hidden lg:flex h-8 w-8 hover:bg-muted/50"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden h-8 w-8 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-6 flex flex-col h-[calc(100%-5rem)] justify-between">
          <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
            <nav className="px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
              {navItems
                .filter((item) => item.roles.includes(user?.role))
                .map((item) => {
                  if (item.isMenu) {
                    return (
                      <div key={item.title}>
                        <button
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all relative group hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30",
                            usersMenuOpen
                              ? "bg-gradient-to-r from-muted to-muted/70 shadow-sm"
                              : "text-muted-foreground"
                          )}
                          onClick={() => setUsersMenuOpen((open) => !open)}
                        >
                          <item.icon className="flex-shrink-0 h-5 w-5" />
                          {isSidebarOpen && (
                            <>
                              <span className="truncate flex-1 text-left">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronRight className={cn(
                                "h-4 w-4 transition-transform",
                                usersMenuOpen && "rotate-90"
                              )} />
                            </>
                          )}
                        </button>
                        {isSidebarOpen && usersMenuOpen && (
                          <div className="ml-6 mt-2 space-y-1 border-l-2 border-border/30 pl-4">
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-muted/50",
                                  location.pathname === sub.href
                                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                                    : "text-muted-foreground"
                                )}
                              >
                                <div className="w-2 h-2 rounded-full bg-current opacity-60" />
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
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group",
                            isActive
                              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                              : "text-muted-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground"
                          )}
                        >
                          <item.icon className="flex-shrink-0 h-5 w-5" />
                          {isSidebarOpen && (
                            <>
                              <span className="truncate flex-1">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant={isActive ? "secondary" : "outline"}
                                  className={cn(
                                    "text-xs px-2 py-0",
                                    item.badge === "!" && "bg-destructive text-destructive-foreground animate-pulse",
                                    item.badge === "New" && "bg-accent text-accent-foreground"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
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
          <div className="px-4 mt-auto space-y-4">
            <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl py-3",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => logout()}
                  >
                    <LogOut className="h-5 w-5" />
                    {isSidebarOpen && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-muted-foreground">Sign out of your account</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {isSidebarOpen && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 text-xs text-muted-foreground border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="font-medium text-foreground">System Online</p>
                </div>
                <p>Fire Emergency Response</p>
                <p className="mt-1">Version 1.0.0</p>
                <p className="mt-2 text-[10px]">© 2023 Fire Response Systems</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out min-h-screen",
        isSidebarOpen ? "lg:pl-72" : "lg:pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-md lg:hidden">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">            <ThemeToggle />

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs">
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/profile")} className="cursor-pointer">
                  <UserCircle className="mr-3 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:p-8 min-h-[calc(100vh-5rem)]">
          <div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};