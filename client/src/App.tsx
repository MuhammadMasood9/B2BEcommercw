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
import { SupplierSidebar } from "@/components/SupplierSidebar";
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
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import 'react-toastify/dist/ReactToastify.css';
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import ProductComparison from "@/pages/ProductComparison";
import RFQBrowse from "@/pages/RFQBrowse";
import RFQCreate from "@/pages/RFQCreate";
import RFQDetail from "@/pages/RFQDetail";
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
import AdminInquiries from "@/pages/admin/AdminInquiries";
import AdminQuotations from "@/pages/admin/AdminQuotations";
import AdminQuotationDetail from "@/pages/admin/AdminQuotationDetail";
import AdminRFQs from "@/pages/admin/AdminRFQs";
import AdminRFQDetail from "@/pages/admin/AdminRFQDetail";
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
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReports from "@/pages/admin/AdminReports";
import AdminChat from "@/pages/admin/AdminChat";
import AdminNotificationPage from "@/pages/admin/AdminNotificationPage";
import AdminActivityLogPage from "@/pages/admin/AdminActivityLogPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminProductApproval from "@/pages/admin/AdminProductApproval";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import NotificationPage from "@/pages/buyer/NotificationPage";
import ProfilePage from "@/pages/buyer/ProfilePage";
import SupplierDashboard from "@/pages/supplier/SupplierDashboard";
import SupplierDirectory from "@/pages/SupplierDirectory";
import SupplierStore from "@/pages/SupplierStore";
import TestSupplierStore from "@/pages/TestSupplierStore";
import BuyerSupplierDemo from "@/pages/BuyerSupplierDemo";
import BuyerSupplierStorePage from "@/pages/BuyerSupplierStorePage";
import SupplierStoreDemo from "@/pages/SupplierStoreDemo";
import SupplierLogin from "@/pages/supplier/SupplierLogin";
import SupplierRegister from "@/pages/supplier/SupplierRegister";
import SupplierMessages from "@/pages/supplier/SupplierMessages";
import SupplierCommissions from "@/pages/supplier/SupplierCommissions";
import SupplierPayouts from "@/pages/supplier/SupplierPayouts";
import SupplierProducts from "@/pages/supplier/SupplierProducts";
import SupplierInquiries from "@/pages/supplier/SupplierInquiries";
import SupplierRFQs from "@/pages/supplier/SupplierRFQs";
import SupplierQuotations from "@/pages/supplier/SupplierQuotations";
import SupplierOrders from "@/pages/supplier/SupplierOrders";
import SupplierAnalytics from "@/pages/supplier/SupplierAnalytics";
import SupplierStoreManagement from "@/pages/supplier/SupplierStore";
import SupplierProfile from "@/pages/supplier/SupplierProfile";
import NotFound from "@/pages/not-found";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/suppliers">
        <ProtectedRoute requiredRole="admin">
          <AdminSuppliers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/product-approval">
        <ProtectedRoute requiredRole="admin">
          <AdminProductApproval />
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
      <Route path="/admin/inquiries">
        <ProtectedRoute requiredRole="admin">
          <AdminInquiries />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/order-management">
        <ProtectedRoute requiredRole="admin">
          <AdminOrderManagement userRole="admin" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/quotations">
        <ProtectedRoute requiredRole="admin">
          <AdminQuotations />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/quotations/:id">
        <ProtectedRoute requiredRole="admin">
          <AdminQuotationDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/rfqs">
        <ProtectedRoute requiredRole="admin">
          <AdminRFQs />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/rfqs/:id">
        <ProtectedRoute requiredRole="admin">
          <AdminRFQDetail />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function SupplierRouter() {
  return (
    <Switch>
      <Route path="/supplier/login" component={SupplierLogin} />
      <Route path="/supplier/register" component={SupplierRegister} />
      <Route path="/supplier/dashboard">
        <ProtectedRoute requiredRole="supplier">
          <SupplierDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/products">
        <ProtectedRoute requiredRole="supplier">
          <SupplierProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/inquiries">
        <ProtectedRoute requiredRole="supplier">
          <SupplierInquiries />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/rfqs">
        <ProtectedRoute requiredRole="supplier">
          <SupplierRFQs />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/quotations">
        <ProtectedRoute requiredRole="supplier">
          <SupplierQuotations />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/orders">
        <ProtectedRoute requiredRole="supplier">
          <SupplierOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/messages">
        <ProtectedRoute requiredRole="supplier">
          <SupplierMessages />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/commissions">
        <ProtectedRoute requiredRole="supplier">
          <SupplierCommissions />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/payouts">
        <ProtectedRoute requiredRole="supplier">
          <SupplierPayouts />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/analytics">
        <ProtectedRoute requiredRole="supplier">
          <SupplierAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/store">
        <ProtectedRoute requiredRole="supplier">
          <SupplierStoreManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/supplier/profile">
        <ProtectedRoute requiredRole="supplier">
          <SupplierProfile />
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
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/products/compare" component={ProductComparison} />
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
      <Route path="/test-supplier-store" component={TestSupplierStore} />
      <Route path="/buyer-supplier-demo" component={BuyerSupplierDemo} />
      <Route path="/supplier-store-demo" component={SupplierStoreDemo} />
      <Route path="/store/:slug" component={BuyerSupplierStorePage} />
      <Route path="/suppliers" component={SupplierDirectory} />
      <Route path="/suppliers/:slug" component={SupplierStore} />
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
  const isSupplierRoute = location.startsWith('/supplier') && location !== '/suppliers';
  
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
  
  if (isSupplierRoute) {
    const style = {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
    };
    
    return (
      <>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <SupplierSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h2 className="text-lg font-semibold">Supplier Portal</h2>
              </header>
              <main className="flex-1 overflow-auto">
                <SupplierRouter />
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
          <WebSocketProvider>
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
          </WebSocketProvider>
        </AuthProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
