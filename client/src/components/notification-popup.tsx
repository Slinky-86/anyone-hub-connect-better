import { useState } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  Trash,
  Settings
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type NotificationType = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

export function NotificationPopup() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "settings">("list");
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      id: "1",
      title: "New Message",
      message: "You have a new message from AnyoneHub.dev",
      timestamp: new Date(),
      read: false
    },
    {
      id: "2",
      title: "Welcome",
      message: "Welcome to Anyone Connect! Secure messaging for developers.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: false
    }
  ]);
  
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    showPreview: true
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast({
      title: "Notifications cleared",
      description: "All notifications have been marked as read"
    });
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "Notifications cleared",
      description: "All notifications have been removed"
    });
  };
  
  const toggleNotificationSetting = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
    
    // Show toast for settings changes
    const settingLabels = {
      enabled: "Notifications",
      sound: "Sound alerts",
      vibration: "Vibration alerts",
      showPreview: "Message previews"
    };
    
    toast({
      title: `${settingLabels[setting]} ${notificationSettings[setting] ? "disabled" : "enabled"}`,
      description: `${settingLabels[setting]} have been ${notificationSettings[setting] ? "turned off" : "turned on"}`
    });
  };
  
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && activeTab === "list") {
      // Mark notifications as read when opening the list
      setTimeout(() => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }, 1000);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "list" | "settings");
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {notificationSettings.enabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && notificationSettings.enabled && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Tabs defaultValue="list" value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Notifications</h3>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="list">
                <Bell className="h-4 w-4 mr-2" />
                <span>List</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-72">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 rounded-lg transition-colors",
                          notification.read 
                            ? "bg-gray-100 dark:bg-gray-800" 
                            : "bg-blue-50 dark:bg-blue-900"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex items-center justify-between mt-2">
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                    <Trash className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive notifications about messages and updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationSettings.enabled}
                  onCheckedChange={() => toggleNotificationSetting('enabled')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-2" />
                    <Label htmlFor="sound">Sound alerts</Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    Play sound when receiving notifications
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={notificationSettings.sound && notificationSettings.enabled}
                  onCheckedChange={() => toggleNotificationSetting('sound')}
                  disabled={!notificationSettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Vibrate className="h-4 w-4 mr-2" />
                    <Label htmlFor="vibration">Vibration alerts</Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    Vibrate when receiving notifications
                  </p>
                </div>
                <Switch
                  id="vibration"
                  checked={notificationSettings.vibration && notificationSettings.enabled}
                  onCheckedChange={() => toggleNotificationSetting('vibration')}
                  disabled={!notificationSettings.enabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="preview">Show message previews</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display message content in notifications
                  </p>
                </div>
                <Switch
                  id="preview"
                  checked={notificationSettings.showPreview && notificationSettings.enabled}
                  onCheckedChange={() => toggleNotificationSetting('showPreview')}
                  disabled={!notificationSettings.enabled}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}