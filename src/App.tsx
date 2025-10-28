import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { Logo } from "@/components/ui/logo";
import { RoleBadge } from "@/components/team/role-badge";
import { PermissionRoute } from "@/components/auth/permission-route";
import { useRole } from "@/hooks/use-role";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import InvoiceView from "./pages/InvoiceView";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import Contacts from "./pages/Contacts";
import Settings from "./pages/Settings";
import Balance from "./pages/Balance";
import ResetPassword from "./pages/auth/ResetPassword";
import CompanySettings from "./pages/CompanySettings";
import PersonalSettings from "./pages/PersonalSettings";
import CompanyManagement from "./pages/CompanyManagement";
import EditInvoice from "./pages/EditInvoice";
import Auth from './pages/auth/Auth';
import ConfirmEmailPage from './pages/auth/ConfirmEmail';
import InvoicePublicView from './pages/InvoicePublicView';

const queryClient = new QueryClient();

function Header() {
  const { role } = useRole();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between border-b bg-secondary px-4">
      <div className="flex items-center space-x-4">
        <Logo size="md" />
        {role && <RoleBadge role={role} />}
      </div>
      <SidebarTrigger className="lg:hidden" />
    </header>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/invoice/:invoiceId/:token" element={<InvoicePublicView />} />

            <Route path="/*" element={
              <SidebarProvider>
                <div className="min-h-screen flex flex-col w-full">
                  <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between border-b bg-secondary px-4">
                    <Logo size="md" />
                    <SidebarTrigger className="lg:hidden" />
                  </header>
                  <div className="flex flex-1 pt-16">
                    <AppSidebar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                        <Route path="/invoices/new" element={<PermissionRoute permission="manageInvoices"><NewInvoice /></PermissionRoute>} />
                        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
                        <Route path="/invoices/edit/:id" element={<PermissionRoute permission="manageInvoices"><EditInvoice /></PermissionRoute>} />
                        <Route path="/team" element={<PermissionRoute permission="manageTeam"><Team /></PermissionRoute>} />
                        <Route path="/contacts" element={<PermissionRoute permission="manageContacts"><Contacts /></PermissionRoute>} />
                        <Route path="/balance" element={<ProtectedRoute><Balance /></ProtectedRoute>} />
                        <Route path="/settings" element={<PermissionRoute permission="manageSettings"><Settings /></PermissionRoute>} />
                        <Route path="/companies" element={<ProtectedRoute><CompanyManagement /></ProtectedRoute>} />
                        <Route path="/settings/company/:id" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
                        <Route path="/settings/personal" element={<ProtectedRoute><PersonalSettings /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
