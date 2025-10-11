import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import ChatbotWidget from "@/components/ChatbotWidget";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import RFQBrowse from "@/pages/RFQBrowse";
import RFQCreate from "@/pages/RFQCreate";
import RFQDetail from "@/pages/RFQDetail";
import SupplierProfile from "@/pages/SupplierProfile";
import InquiryCart from "@/pages/InquiryCart";
import Messages from "@/pages/Messages";
import Dashboard from "@/pages/Dashboard";
import SupplierDashboard from "@/pages/SupplierDashboard";
import Categories from "@/pages/Categories";
import FindSuppliers from "@/pages/FindSuppliers";
import ReadyToShip from "@/pages/ReadyToShip";
import TradeShows from "@/pages/TradeShows";
import BuyerProtection from "@/pages/BuyerProtection";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import MyOrders from "@/pages/MyOrders";
import MyRFQs from "@/pages/MyRFQs";
import Favorites from "@/pages/Favorites";
import ContactSupplier from "@/pages/ContactSupplier";
import StartOrder from "@/pages/StartOrder";
import SendQuotation from "@/pages/SendQuotation";
import CategoryProducts from "@/pages/CategoryProducts";
import GetVerified from "@/pages/GetVerified";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminBulkUpload from "@/pages/admin/AdminBulkUpload";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminOrders from "@/pages/admin/AdminOrders";
import NotFound from "@/pages/not-found";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/bulk-upload" component={AdminBulkUpload} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/suppliers" component={AdminSuppliers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/categories" component={Categories} />
      <Route path="/supplier/:id" component={SupplierProfile} />
      <Route path="/find-suppliers" component={FindSuppliers} />
      <Route path="/ready-to-ship" component={ReadyToShip} />
      <Route path="/trade-shows" component={TradeShows} />
      <Route path="/rfq/browse" component={RFQBrowse} />
      <Route path="/rfq/create" component={RFQCreate} />
      <Route path="/rfq/:id" component={RFQDetail} />
      <Route path="/inquiry-cart" component={InquiryCart} />
      <Route path="/messages" component={Messages} />
      <Route path="/dashboard/buyer" component={Dashboard} />
      <Route path="/dashboard/supplier" component={SupplierDashboard} />
      <Route path="/buyer-protection" component={BuyerProtection} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={Help} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/my-rfqs" component={MyRFQs} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/contact-supplier/:id" component={ContactSupplier} />
      <Route path="/start-order/:productId" component={StartOrder} />
      <Route path="/send-quotation/:rfqId" component={SendQuotation} />
      <Route path="/category/:slug" component={CategoryProducts} />
      <Route path="/get-verified" component={GetVerified} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, loadingMessage, showProgress, progress, setLoading } = useLoading();
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  
  // Ensure loader starts in non-loading state
  React.useEffect(() => {
    setLoading(false);
  }, []);
  
  if (isAdminRoute) {
    const style = {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
    };
    
    return (
      <>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AdminSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h2 className="text-lg font-semibold">B2B Admin Panel</h2>
              </header>
              <main className="flex-1 overflow-auto">
                <AdminRouter />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <FullScreenLoader 
          isLoading={isLoading}
          message={loadingMessage}
          showProgress={showProgress}
          progress={progress}
        />
      </>
    );
  }
  
  return (
    <>
      <PublicRouter />
      <ChatbotWidget />
      <FullScreenLoader 
        isLoading={isLoading}
        message={loadingMessage}
        showProgress={showProgress}
        progress={progress}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
