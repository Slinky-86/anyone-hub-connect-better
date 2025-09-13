import { useState, useEffect } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { useLocation } from "wouter";
import { useUser } from "@/lib/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, 
  Unlock, 
  Shield, 
  MessageSquare, 
  Key, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// Define PrivateMessage interface
interface PrivateMessage {
  id: number;
  senderName: string;
  senderAvatar: string | null;
  subject: string;
  preview: string;
  date: string;
  isLocked: boolean;
}

export default function PrivateMessages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmingPassword, setConfirmingPassword] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<PrivateMessage | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const { user } = useUser();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if there's a stored password on load
  useEffect(() => {
    const savedPassword = localStorage.getItem('secureMessagesPassword');
    if (savedPassword) {
      setStoredPassword(savedPassword);
    }
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const unlockMessages = () => {
    if (!storedPassword) {
      // First time setup - store the password
      if (password.length < 6) {
        toast({
          title: "Password too short",
          description: "Please use at least 6 characters for your password",
          variant: "destructive"
        });
        return;
      }
      
      setConfirmDialog(true);
      return;
    }
    
    // Password exists, verify it
    setAuthenticating(true);
    
    // Simulate authentication delay
    setTimeout(() => {
      if (password === storedPassword) {
        setIsLocked(false);
        toast({
          title: "Unlocked",
          description: "Your secure messages are now accessible",
        });
      } else {
        toast({
          title: "Authentication failed",
          description: "Incorrect password. Please try again.",
          variant: "destructive"
        });
      }
      setAuthenticating(false);
      setPassword("");
    }, 1000);
  };
  
  const confirmSetPassword = () => {
    if (password !== confirmingPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }
    
    // Store the password
    localStorage.setItem('secureMessagesPassword', password);
    setStoredPassword(password);
    setIsLocked(false);
    setConfirmDialog(false);
    
    toast({
      title: "Password set",
      description: "Your secure messages are now protected and accessible",
    });
  };
  
  const lockMessages = () => {
    setIsLocked(true);
    setPassword("");
    setSelectedMessage(null);
    
    toast({
      title: "Locked",
      description: "Your secure messages are now locked",
    });
  };
  
  const viewMessage = (message: PrivateMessage) => {
    setSelectedMessage(message);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header 
        title="Private Messages" 
        toggleSidebar={toggleSidebar} 
        showBackButton={true}
        onBack={() => navigate("/messaging")}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex-1 overflow-y-auto ml-0 md:ml-64 transition-all duration-300 p-4">
          {/* Lock status indicator */}
          <div className="mb-4 flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center">
              {isLocked ? (
                <>
                  <Lock className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">Private Messages Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Private Messages Unlocked</span>
                </>
              )}
            </div>
            
            <Button
              variant={isLocked ? "default" : "destructive"}
              size="sm"
              onClick={isLocked ? unlockMessages : lockMessages}
              disabled={authenticating}
            >
              {authenticating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isLocked ? (
                <Unlock className="h-4 w-4 mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {isLocked ? "Unlock" : "Lock"}
            </Button>
          </div>
          
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md max-w-md w-full">
                <div className="flex flex-col items-center mb-6">
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <h2 className="text-xl font-bold mb-2">Secure Messages</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Enter your password to access private and sensitive messages
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && unlockMessages()}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={unlockMessages}
                    disabled={authenticating}
                  >
                    {authenticating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {storedPassword ? "Unlock Messages" : "Set Password & Unlock"}
                  </Button>
                </div>
                
                {!storedPassword && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        You'll need to remember this password. It's used to protect your sensitive messages and cannot be recovered.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : selectedMessage ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedMessage(null)}
                    className="mr-2"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Back to messages
                  </Button>
                  
                  <Badge variant="outline" className="ml-2">Secure</Badge>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedMessage.senderAvatar || undefined} alt={selectedMessage.senderName} />
                    <AvatarFallback>{getInitials(selectedMessage.senderName)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">{selectedMessage.senderName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(selectedMessage.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">{selectedMessage.subject}</h2>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p>
                    Dear {user?.displayName || user?.username || "User"},
                  </p>
                  <p>
                    {selectedMessage.preview}
                  </p>
                  <p>
                    Best regards,<br />
                    {selectedMessage.senderName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No private messages</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Secure messages from your colleagues will appear here
                  </p>
                </div>
              ) : (
                messages.map(message => (
                  <Card 
                    key={message.id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => viewMessage(message)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{message.senderName}</CardTitle>
                            <CardDescription className="text-xs">
                              {formatDate(message.date)}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2 text-xs">Secure</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-1">{message.subject}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {message.preview}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirm password dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>
              You'll need this password to unlock your secure messages in the future.
              Please confirm your password to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmingPassword}
                onChange={(e) => setConfirmingPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSetPassword}>
              Confirm & Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}