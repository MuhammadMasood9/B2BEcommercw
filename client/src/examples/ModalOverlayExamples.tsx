import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function ModalOverlayExamples() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (variant: "default" | "destructive" | "success" | "warning" | "info") => {
    toast({
      title: "Brand Color Toast",
      description: `This is a ${variant} toast with brand colors.`,
      variant: variant as any,
    });
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Modal and Overlay Components with Brand Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Dialog Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Dialog Components</h3>
            <div className="flex gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="brand-button-primary">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-brand-grey-900">Brand Dialog</DialogTitle>
                    <DialogDescription className="text-brand-grey-600">
                      This dialog uses the brand color system with orange and dark grey colors.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-brand-grey-700">
                      The overlay uses brand-grey-900/80 and the close button has orange focus states.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="brand-button-secondary">Open Alert Dialog</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-brand-grey-900">Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription className="text-brand-grey-600">
                      This alert dialog also uses the brand color system for consistency.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="brand-button-primary">Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Sheet Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Sheet Component</h3>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="brand-button-outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-brand-grey-900">Brand Sheet</SheetTitle>
                  <SheetDescription className="text-brand-grey-600">
                    This sheet component uses brand colors for the overlay and close button.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-brand-grey-700">
                    The sheet overlay uses brand-grey-900/80 for consistency with other modals.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tooltip Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Tooltip Component</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="brand-button-ghost">Hover for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This tooltip uses the brand popover colors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Alert Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Alert Components</h3>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert using the brand color system.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning Alert</AlertTitle>
                <AlertDescription>
                  This warning alert uses brand orange colors for consistency.
                </AlertDescription>
              </Alert>

              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle>Info Alert</AlertTitle>
                <AlertDescription>
                  This info alert uses brand grey colors for a professional look.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Toast Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Toast Notifications</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => showToast("default")} size="sm">Default Toast</Button>
              <Button onClick={() => showToast("success")} size="sm" className="bg-green-500 hover:bg-green-600">Success Toast</Button>
              <Button onClick={() => showToast("warning")} size="sm" className="brand-button-primary">Warning Toast</Button>
              <Button onClick={() => showToast("info")} size="sm" className="brand-button-secondary">Info Toast</Button>
              <Button onClick={() => showToast("destructive")} size="sm" variant="destructive">Error Toast</Button>
            </div>
          </div>

          {/* Loading Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Loading Components</h3>
            <div className="space-y-4">
              <Button onClick={simulateLoading} className="brand-button-primary">
                Simulate Loading
              </Button>
              
              <div className="space-y-2">
                <p className="text-sm text-brand-grey-600">Skeleton Loading Examples:</p>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Brand Color Showcase */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-grey-900">Brand Color Showcase</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-brand-orange-500 text-white rounded-lg text-center">
                <div className="font-semibold">Primary Orange</div>
                <div className="text-sm opacity-90">#FF9900</div>
              </div>
              <div className="p-4 bg-brand-grey-900 text-white rounded-lg text-center">
                <div className="font-semibold">Primary Grey</div>
                <div className="text-sm opacity-90">#1A1A1A</div>
              </div>
              <div className="p-4 bg-brand-orange-100 text-brand-orange-800 rounded-lg text-center">
                <div className="font-semibold">Light Orange</div>
                <div className="text-sm opacity-90">Tint</div>
              </div>
              <div className="p-4 bg-brand-grey-100 text-brand-grey-800 rounded-lg text-center">
                <div className="font-semibold">Light Grey</div>
                <div className="text-sm opacity-90">Tint</div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}