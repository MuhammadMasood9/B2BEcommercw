import React, { useState, useEffect } from "react";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallerProps {
  className?: string;
}

export function PWAInstaller({ className }: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check if PWA is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running as PWA on mobile
      const isPWA = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isPWA);
    };

    checkInstalled();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('Admin Panel installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-sw.js', {
        scope: '/admin/'
      })
      .then((registration) => {
        console.log('Admin SW registered:', registration);
        setSwRegistration(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Admin SW registration failed:', error);
      });
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast.success('Installing Admin Panel...');
      } else {
        toast.info('Installation cancelled');
      }
      
      setDeferredPrompt(null);
      setShowInstallDialog(false);
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Click the install button above',
          'Or click the install icon in the address bar',
          'Click "Install" in the popup'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the menu button (☰)',
          'Select "Install this site as an app"',
          'Click "Install" in the dialog'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Click the Share button',
          'Select "Add to Home Screen"',
          'Tap "Add" to install'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        steps: [
          'Click the install button above',
          'Or click the app icon in the address bar',
          'Click "Install" in the popup'
        ]
      };
    }
    
    return {
      browser: 'Your Browser',
      steps: [
        'Look for an install option in your browser menu',
        'Or check the address bar for an install icon',
        'Follow your browser\'s installation prompts'
      ]
    };
  };

  const instructions = getInstallInstructions();

  if (isInstalled) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" />
          Installed
        </Badge>
        
        {!isOnline && (
          <Badge variant="outline" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
        
        {updateAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdate}
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Update
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {deferredPrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstallDialog(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}
        
        {!isOnline && (
          <Badge variant="destructive" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
      </div>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Install Admin Panel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Benefits of Installing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <span>Works like a native app</span>
                </div>
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-green-500" />
                  <span>Access key features offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                  <span>Faster loading and performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span>Push notifications for alerts</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Installation Steps ({instructions.browser})</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1 text-sm">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInstallDialog(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleInstall}
                disabled={isInstalling || !deferredPrompt}
                className="flex-1 gap-2"
              >
                {isInstalling ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Install Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PWAInstaller;