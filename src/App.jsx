import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder';
import NewBilling from './pages/NewBilling';
import ProductManagement from './pages/ProductManagement';
import Categories from './pages/Categories';
import Collections from './pages/Collections';
import Variants from './pages/Variants';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Drafts from './pages/Drafts';
import Login from './pages/Login';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import { Users } from './pages/Users';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };
  
  return (
    <Layout onLogout={handleLogout}>
      {children}
    </Layout>
  );
};

// Route wrapper components to pass navigation hooks instead of state callbacks
const DashboardWrapper = () => {
  const navigate = useNavigate();
  return (
    <Dashboard 
      onManageOrders={() => navigate('/sales')}
      onViewCustomers={() => navigate('/customers')}
    />
  );
};

const SalesOrderWrapper = () => {
  const navigate = useNavigate();
  return (
    <SalesOrder 
      onCreateInvoice={() => navigate('/billing')}
      onViewDrafts={() => navigate('/drafts')}
    />
  );
};

const DraftsWrapper = () => {
  const navigate = useNavigate();
  // Instead of passing a complex object, we can use state through navigation
  // For simplicity, we navigate to billing. If they need state, we use navigate('/billing', { state: { draftData: draft } })
  const handleEditDraft = (draft) => {
    navigate('/billing', { state: { draftData: draft } });
  };
  return (
    <Drafts 
      onEditDraft={handleEditDraft}
      onBack={() => navigate('/sales')}
    />
  );
};

const CustomersWrapper = () => {
  const navigate = useNavigate();
  return (
    <Customers 
      onViewProfile={(id) => navigate(`/customers/${id}`)}
      onCreateInvoice={(customer) => navigate('/billing', { state: { prefillCustomer: customer } })}
    />
  );
};

import { useParams, useLocation } from 'react-router-dom';

const CustomerProfileWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <CustomerProfile 
      customerId={id}
      onBack={() => navigate('/customers')}
      onCreateInvoice={(customer) => navigate('/billing', { state: { prefillCustomer: customer } })}
    />
  );
};

const NewBillingWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const draftData = location.state?.draftData || null;
  const prefillCustomer = location.state?.prefillCustomer || null;
  
  return (
    <NewBilling 
      onBack={() => navigate('/sales')}
      draftData={draftData}
      prefillCustomer={prefillCustomer}
    />
  );
};

const LoginWrapper = () => {
  const navigate = useNavigate();
  return <Login onLoginSuccess={() => navigate('/dashboard')} />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesOrderWrapper /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><NewBillingWrapper /></ProtectedRoute>} />
        <Route path="/drafts" element={<ProtectedRoute><DraftsWrapper /></ProtectedRoute>} />
        
        <Route path="/customers" element={<ProtectedRoute><CustomersWrapper /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerProfileWrapper /></ProtectedRoute>} />
        
        <Route path="/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
        <Route path="/variants" element={<ProtectedRoute><Variants /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;