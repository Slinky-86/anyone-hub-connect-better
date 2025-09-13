import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import SettingsView from "@/components/settings-view";
import { useLocation } from "wouter";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_, navigate] = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleBackButton = () => {
    navigate("/messaging");
  };

  return (
    <div className="h-screen flex flex-col">
      <Header 
        title="Settings" 
        toggleSidebar={toggleSidebar} 
        showBackButton={true}
        onBack={handleBackButton}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex-1 overflow-y-auto ml-0 md:ml-64 transition-all duration-300">
          <SettingsView />
        </div>
      </div>
    </div>
  );
}
