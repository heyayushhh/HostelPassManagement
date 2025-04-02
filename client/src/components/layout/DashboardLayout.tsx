import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import NotificationPanel from "../shared/NotificationPanel";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({ children, title, icon }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get notifications
  const { data } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      const data = await res.json();
      return data.notifications as Notification[];
    },
  });

  const unreadNotifications = data?.filter((n) => !n.isRead) || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* App Bar */}
      <div className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {icon}
            <h1 className="text-xl font-medium">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative focus:outline-none"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <NotificationPanel 
                  notifications={data || []} 
                  onClose={() => setShowNotifications(false)} 
                />
              )}
            </div>
            
            <div className="ml-4 relative">
              <div className="flex items-center space-x-1 cursor-pointer group">
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
                
                <div className="absolute hidden group-hover:block right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => logout()}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {children}
      </div>
    </div>
  );
}
