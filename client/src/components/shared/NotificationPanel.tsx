import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { CheckCircle, XCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: NotificationPanelProps) {
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <div className="fixed right-4 top-16 w-80 bg-white rounded-md shadow-lg z-50">
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-md font-medium">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer ${
                  notification.isRead ? "opacity-70" : ""
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <span className="flex h-8 w-8 rounded-full bg-green-100 items-center justify-center">
                      {notification.message.includes("approved") ? (
                        <CheckCircle className="text-green-600 h-4 w-4" />
                      ) : notification.message.includes("rejected") ? (
                        <XCircle className="text-red-600 h-4 w-4" />
                      ) : (
                        <span className="material-icons text-primary h-4 w-4">notifications</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button
            onClick={() => {
              notifications
                .filter((n) => !n.isRead)
                .forEach((n) => markAsReadMutation.mutate(n.id));
            }}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
