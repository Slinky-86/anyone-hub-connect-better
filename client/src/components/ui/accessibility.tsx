import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Settings, Eye, Type, ZoomIn, MessageSquare } from 'lucide-react';

// AccessibilityContext to store and share accessibility settings
export const AccessibilityContext = React.createContext<{
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reduceMotion: boolean;
  textSize: number;
  setHighContrast: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setScreenReader: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setTextSize: (value: number) => void;
}>({
  highContrast: false,
  largeText: false,
  screenReader: false,
  reduceMotion: false,
  textSize: 100,
  setHighContrast: () => {},
  setLargeText: () => {},
  setScreenReader: () => {},
  setReduceMotion: () => {},
  setTextSize: () => {},
});

export const useAccessibility = () => React.useContext(AccessibilityContext);

// Provider component to wrap the app
export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textSize, setTextSize] = useState(100); // 100% is default
  
  // Effect to apply classes to the document body
  useEffect(() => {
    const body = document.body;
    
    // Apply high contrast
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
    
    // Apply large text
    if (largeText) {
      body.classList.add('large-text');
    } else {
      body.classList.remove('large-text');
    }
    
    // Apply screen reader announcements 
    if (screenReader) {
      body.setAttribute('aria-live', 'polite');
    } else {
      body.removeAttribute('aria-live');
    }
    
    // Apply reduced motion
    if (reduceMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
    
    // Apply text size
    document.documentElement.style.fontSize = `${textSize}%`;
    
  }, [highContrast, largeText, screenReader, reduceMotion, textSize]);
  
  // Store settings in localStorage
  useEffect(() => {
    const saveSettings = () => {
      localStorage.setItem('accessibility', JSON.stringify({
        highContrast,
        largeText,
        screenReader,
        reduceMotion,
        textSize,
      }));
    };
    
    saveSettings();
  }, [highContrast, largeText, screenReader, reduceMotion, textSize]);
  
  // Load settings from localStorage on initial render
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('accessibility');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setHighContrast(parsed.highContrast || false);
        setLargeText(parsed.largeText || false);
        setScreenReader(parsed.screenReader || false);
        setReduceMotion(parsed.reduceMotion || false);
        setTextSize(parsed.textSize || 100);
      }
    };
    
    loadSettings();
  }, []);
  
  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        largeText,
        screenReader,
        reduceMotion,
        textSize,
        setHighContrast,
        setLargeText,
        setScreenReader,
        setReduceMotion,
        setTextSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// AccessibilityMenu component for display
export const AccessibilityMenu = () => {
  const {
    highContrast,
    largeText,
    screenReader,
    reduceMotion,
    textSize,
    setHighContrast,
    setLargeText,
    setScreenReader,
    setReduceMotion,
    setTextSize,
  } = useAccessibility();
  
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="fixed bottom-4 right-4 z-50 rounded-full h-10 w-10 bg-primary text-white shadow-lg"
                aria-label="Accessibility Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Accessibility Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize your experience to make the application more accessible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label htmlFor="high-contrast">High Contrast</Label>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
              aria-label="Toggle high contrast mode"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <Label htmlFor="large-text">Large Text</Label>
            </div>
            <Switch
              id="large-text"
              checked={largeText}
              onCheckedChange={setLargeText}
              aria-label="Toggle large text mode"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="screen-reader">Screen Reader Support</Label>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReader}
              onCheckedChange={setScreenReader}
              aria-label="Toggle screen reader support"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              <Label htmlFor="text-size">Text Size: {textSize}%</Label>
            </div>
            <div className="w-[180px]">
              <Slider
                id="text-size"
                value={[textSize]}
                min={80}
                max={150}
                step={5}
                onValueChange={(value) => setTextSize(value[0])}
                aria-label="Adjust text size"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};