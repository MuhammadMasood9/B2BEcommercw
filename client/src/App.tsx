import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from 'react-toastify';
import { Toaster as HotToaster } from 'react-hot-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import EnhancedB2BAssistant from "@/components/EnhancedB2BAssistant";
import FullScreenLoader from "@/components/FullScreenLoader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoriteProvider } from "@/contexts/FavoriteContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { UnseenCountsProvider } from "@/contexts/UnseenCountsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import 'react-toastify/dist/ReactToastify.css';
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDiscovery from "@/pages/buyer/ProductDiscovery";
import ProductDetail from "@/pages/ProductDetail";
import RFQBrowse from "@/pages/RFQBrowse";
import RFQCreate from "@/pages/RFQCreate";
import RFQDetail from "@/pages/RFQDetail";
import InquiryCart from "@/pages/InquiryCart";
import Messages from "@/pages/Messages";
import Dashboard from "@/pages/Dashboard";
import Categories from "@/pages/Categories";
import Favorites from "@/pages/Favorites";
import Cart from "@/pages/Cart";
import ReadyToShip from "@/pages/ReadyToShip";
import TradeShows from "@/pages/TradeShows";
import BuyerProtection from "@/pages/BuyerProtection";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SupplierSignup from "@/pages/SupplierSignup";
import SupplierDashboard from "@/pages/SupplierDashboard";
import StorePage from "@/pages/StorePage";
import SupplierDirectory from "@/pages/SupplierDirectory";
import MyOrders from "@/pages/MyOrders";
import MyRFQs from "@/pages/MyRFQs";
import StartOrder from "@/pages/StartOrder";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderTracking from "@/pages/OrderTracking";
import CategoryProducts from "@/pages/CategoryProducts";
import SubcategoryProducts from "@/pages/SubcategoryProducts";
import GetVerified from "@/pages/GetVerified";
import Chat from "@/pages/Chat";
import BuyerDashboard from "@/pages/buyer/BuyerDashboard";
import BuyerInquiries from "@/pages/buyer/BuyerInquiries";
import InquiryDetail from "@/pages/buyer/InquiryDetail";
import BuyerQuotations from "@/pages/buyer/BuyerQuotations";
import QuotationDetail from "@/pages/QuotationDetail";
import BuyerRFQs from "@/pages/buyer/BuyerRFQs";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminProductDetail from "@/pages/admin/AdminProductDetail";
import AdminProductManagement from "@/pages/admin/AdminProductManagement";
import AdminBulkUpload from "@/pages/admin/AdminBulkUpload";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminOrderManagement from "@/pages/admin/AdminOrderManagement";
import BuyerOrderManagement from "@/pages/buyer/BuyerOrderManagement";
import OrderDetail from "@/pages/buyer/OrderDetail";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminUserDetails from "@/pages/admin/AdminUserDetails";
import AdminUserImportExport from "@/pages/admin/AdminUserImportExport";
import AdminContentModeration from "@/pages/admin/AdminContentModeration";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReports from "@/pages/admin/AdminReports";
import AdminChat from "@/pages/admin/AdminChat";
import AdminNotificationPage from "@/pages/admin/AdminNotificationPage";
import AdminActivityLogPage from "@/pages/admin/AdminActivityLogPage";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminSuppliersPending from "@/pages/admin/AdminSuppliersPending";
import AdminCommissionManagement from "@/pages/admin/AdminCommissionManagement";
import AdminPayoutManagement from "@/pages/admin/AdminPayoutManagement";
import AdminMonitoringDashboard from "@/pages/admin/AdminMonitoringDashboard";
import AdminVerification from "@/pages/admin/AdminVerification";
import AdminAccessManagement from "@/pages/admin/AdminAccessManagement";
import AdminCompliance from "@/pages/admin/AdminCompliance";
import AdminDisputes from "@/pages/admin/AdminDisputes";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminAPIDocumentation from "@/pages/admin/AdminAPIDocumentation";
import GlobalChatButton from "@/components/GlobalChatButton";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import NotificationPage from "@/pages/buyer/NotificationPage";
import ProfilePage from "@/pages/buyer/ProfilePage";
import NotFound from "@/pages/not-found";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/documentation">
        <ProtectedRoute requiredRole="admin">
          <AdminAPIDocumentation />
        </ProtectedRoute>
      </Route>
      <Route exact path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute requiredRole="admin">
          <AdminProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products/:productId">
        <ProtectedRoute requiredRole="admin">
          <AdminProductDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products/:productId/manage">
        <ProtectedRoute requiredRole="admin">
          <AdminProductManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/bulk-upload">
        <ProtectedRoute requiredRole="admin">
          <AdminBulkUpload />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/categories">
        <ProtectedRoute requiredRole="admin">
          <AdminCategories />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/order-management">
        <ProtectedRoute requiredRole="admin">
          <AdminOrderManagement userRole="admin" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute requiredRole="admin">
          <AdminOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/customers">
        <ProtectedRoute requiredRole="admin">
          <AdminCustomers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users/:userId">
        <ProtectedRoute requiredRole="admin">
          <AdminUserDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users/import-export">
        <ProtectedRoute requiredRole="admin">
          <AdminUserImportExport />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/content-moderation">
        <ProtectedRoute requiredRole="admin">
          <AdminContentModeration />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute requiredRole="admin">
          <AdminSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute requiredRole="admin">
          <AdminReports />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/chat">
        <ProtectedRoute requiredRole="admin">
          <AdminChat />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute requiredRole="admin">
          <AdminNotificationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/activity-log">
        <ProtectedRoute requiredRole="admin">
          <AdminActivityLogPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/suppliers">
        <ProtectedRoute requiredRole="admin">
          <AdminSuppliers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/suppliers/pending">
        <ProtectedRoute requiredRole="admin">
          <AdminSuppliersPending />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/commission">
        <ProtectedRoute requiredRole="admin">
          <AdminCommissionManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payouts">
        <ProtectedRoute requiredRole="admin">
          <AdminPayoutManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/monitoring">
        <ProtectedRoute requiredRole="admin">
          <AdminMonitoringDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/verification">
        <ProtectedRoute requiredRole="admin">
          <AdminVerification />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/access-management">
        <ProtectedRoute requiredRole="admin">
          <AdminAccessManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/compliance">
        <ProtectedRoute requiredRole="admin">
          <AdminCompliance />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/disputes">
        <ProtectedRoute requiredRole="admin">
          <AdminDisputes />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/buyer/products" component={ProductDiscovery} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/categories" component={Categories} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/ready-to-ship" component={ReadyToShip} />
      <Route path="/trade-shows" component={TradeShows} />
      <Route path="/rfq/browse" component={RFQBrowse} />
      <Route path="/rfq/create" component={RFQCreate} />
      <Route path="/rfq/:id" component={RFQDetail} />
      <Route path="/inquiry-cart" component={Cart} />
      <Route path="/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/buyer">
        <ProtectedRoute requiredRole="buyer">
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/dashboard">
        <ProtectedRoute requiredRole="buyer">
          <BuyerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/inquiries">
        <ProtectedRoute requiredRole="buyer">
          <BuyerInquiries />
        </ProtectedRoute>
      </Route>
      <Route path="/inquiry/:id">
        <ProtectedRoute requiredRole="buyer">
          <InquiryDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/quotations">
        <ProtectedRoute requiredRole="buyer">
          <BuyerQuotations />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/orders">
        <ProtectedRoute requiredRole="buyer">
          <BuyerOrderManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/order/:id">
        <ProtectedRoute requiredRole="buyer">
          <OrderDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/quotation/:id">
        <ProtectedRoute requiredRole="buyer">
          <QuotationDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer/rfqs">
        <ProtectedRoute requiredRole="buyer">
          <BuyerRFQs />
        </ProtectedRoute>
      </Route>
      <Route path="/buyer-protection" component={BuyerProtection} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={Help} />
      <Route path="/chat" component={Chat} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/supplier/signup" component={SupplierSignup} />
      <Route path="/supplier/dashboard">
        <ProtectedRoute requiredRole="supplier">
          <SupplierDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/stores/:slug" component={StorePage} />
      <Route path="/suppliers" component={SupplierDirectory} />
      <Route path="/my-orders">
        <ProtectedRoute requiredRole="buyer">
          <MyOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/my-rfqs">
        <ProtectedRoute requiredRole="buyer">
          <MyRFQs />
        </ProtectedRoute>
      </Route>
      <Route path="/favorites">
        <ProtectedRoute>
          <Favorites />
        </ProtectedRoute>
      </Route>
      <Route path="/cart">
        <ProtectedRoute>
          <Cart />
        </ProtectedRoute>
      </Route>
      <Route path="/start-order/:productId">
        <ProtectedRoute requiredRole="buyer">
          <StartOrder />
        </ProtectedRoute>
      </Route>
      <Route path="/order-confirmation/:orderId">
        <ProtectedRoute requiredRole="buyer">
          <OrderConfirmation />
        </ProtectedRoute>
      </Route>
      <Route path="/track-order/:orderId">
        <ProtectedRoute requiredRole="buyer">
          <OrderTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/track-order">
        <ProtectedRoute requiredRole="buyer">
          <OrderTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/category/:slug" component={CategoryProducts} />
      <Route path="/subcategory/:slug" component={SubcategoryProducts} />
      <Route path="/get-verified" component={GetVerified} />
      <Route path="/notifications">
        <ProtectedRoute>
          <NotificationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
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
          isAdmin={true}
        />
        <ScrollToTop />
        <FloatingActionButtons chatType="general" />
        <ToastContainer position="top-right" />
        <HotToaster position="top-right" />
      </>
    );
  }
  
  return (
    <>
      <ScrollToTop />
      <PublicRouter />
      <EnhancedB2BAssistant />
      <FloatingActionButtons chatType="general" />
      <FullScreenLoader 
        isLoading={isLoading}
        message={loadingMessage}
        showProgress={showProgress}
        progress={progress}
      />
      <ToastContainer position="top-right" />
      <HotToaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <AuthProvider>
          <SearchProvider>
            <FavoriteProvider>
              <CartProvider>
                <ProductProvider>
                  <UnseenCountsProvider>
                    <TooltipProvider>
                      <Toaster />
                      <AppContent />
                    </TooltipProvider>
                  </UnseenCountsProvider>
                </ProductProvider>
              </CartProvider>
            </FavoriteProvider>
          </SearchProvider>
        </AuthProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
