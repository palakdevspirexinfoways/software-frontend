import React, { useState } from 'react';
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


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [activePage, setActivePage] = useState('dashboard');
  const [editDraft, setEditDraft] = useState(null); // holds draft data when editing a draft

  const handleEditDraft = (draft) => {
    setEditDraft(draft);
    setActivePage('billing');
  };

  const handleBackFromBilling = () => {
    setEditDraft(null);
    setActivePage('sales');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onManageOrders={() => setActivePage('products')} />;
      case 'sales':
        return (
          <SalesOrder
            onCreateInvoice={() => setActivePage('billing')}
            onViewDrafts={() => setActivePage('drafts')}
          />
        );
      case 'billing':
        return (
          <NewBilling
            onBack={handleBackFromBilling}
            draftData={editDraft}
          />
        );
      case 'drafts':
        return (
          <Drafts
            onEditDraft={handleEditDraft}
            onBack={() => setActivePage('sales')}
          />
        );
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <Categories />;
      case 'collections':
        return <Collections />;
      case 'variants':
        return <Variants />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
};

export default App;