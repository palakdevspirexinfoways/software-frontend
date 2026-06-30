import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  ListTodo,
  Users2,
  UserPlus
} from 'lucide-react';

export const Sidebar = ({ onLogout, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.replace('/', '') || 'dashboard';
  const [salesOpen, setSalesOpen] = useState(activePage === 'sales' || activePage === 'billing');
  const [productsOpen, setProductsOpen] = useState(activePage === 'products' || activePage === 'categories');
  const [crmOpen, setCrmOpen] = useState(activePage === 'customers' || activePage === 'customer-profile');

  let user = { name: 'Admin User', email: 'admin@gmail.com' };
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) user = JSON.parse(storedUser);
  } catch (e) {}

  const isActive = (page) => activePage === page;
  const itemClass = (active) =>
    `w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-250 cursor-pointer group ${active
      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
      : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700 hover:shadow-sm'
    }`;
  const subItemClass = (active) =>
    `w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${active
      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
      : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700'
    }`;
  const iconClass = (active) => `w-5 h-5 mr-3 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`;
  const subIconClass = (active) => `w-4 h-4 mr-2 ${active ? 'text-white' : 'text-slate-400'}`;

  const isSalesSubActive = isActive('sales') || isActive('billing');
  const isProductsSubActive = isActive('products') || isActive('categories');
  const isCrmSubActive = isActive('customers') || isActive('customer-profile');

  const handleNavClick = (path) => {
    navigate(`/${path}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`w-64 bg-white text-slate-800 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-100 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white shadow-sm shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">GreenAdmin</span>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">

        {/* Dashboard */}
        <button onClick={() => handleNavClick('dashboard')} className={itemClass(isActive('dashboard'))}>
          <LayoutDashboard className={iconClass(isActive('dashboard'))} />
          <span className="truncate">Dashboard</span>
        </button>

        {/* CRM — Customers */}
        <div className="space-y-1">
          <button onClick={() => setCrmOpen(!crmOpen)}
            className={itemClass(isCrmSubActive)}>
            <div className="flex items-center min-w-0 flex-1">
              <Users2 className={iconClass(isCrmSubActive)} />
              <span className="truncate">CRM — Customers</span>
            </div>
            {crmOpen ? <ChevronDown className={`w-4 h-4 ${isCrmSubActive ? 'text-white/80' : 'text-slate-400'}`} /> : <ChevronRight className={`w-4 h-4 ${isCrmSubActive ? 'text-white/80' : 'text-slate-400'}`} />}
          </button>
          {crmOpen && (
            <div className="pl-6 space-y-1 py-1">
              <button onClick={() => handleNavClick('customers')} className={subItemClass(isActive('customers'))}>
                <ListTodo className={subIconClass(isActive('customers'))} />
                <span>Customer List</span>
              </button>
            </div>
          )}
        </div>

        {/* Sales & Orders */}
        <div className="space-y-1">
          <button onClick={() => setSalesOpen(!salesOpen)}
            className={itemClass(isSalesSubActive)}>
            <div className="flex items-center min-w-0 flex-1">
              <ShoppingCart className={iconClass(isSalesSubActive)} />
              <span className="truncate">Sales &amp; Order</span>
            </div>
            {salesOpen ? <ChevronDown className={`w-4 h-4 ${isSalesSubActive ? 'text-white/80' : 'text-slate-400'}`} /> : <ChevronRight className={`w-4 h-4 ${isSalesSubActive ? 'text-white/80' : 'text-slate-400'}`} />}
          </button>
          {salesOpen && (
            <div className="pl-6 space-y-1 py-1">
              <button onClick={() => handleNavClick('sales')} className={subItemClass(isActive('sales'))}>
                <ListTodo className={subIconClass(isActive('sales'))} /><span>Order Records</span>
              </button>
              <button onClick={() => handleNavClick('billing')} className={subItemClass(isActive('billing'))}>
                <PlusCircle className={subIconClass(isActive('billing'))} /><span>New Billing</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Management */}
        <div className="space-y-1">
          <button onClick={() => setProductsOpen(!productsOpen)}
            className={itemClass(isProductsSubActive)}>
            <div className="flex items-center min-w-0 flex-1">
              <Package className={iconClass(isProductsSubActive)} />
              <span className="truncate">Product Management</span>
            </div>
            {productsOpen ? <ChevronDown className={`w-4 h-4 ${isProductsSubActive ? 'text-white/80' : 'text-slate-400'}`} /> : <ChevronRight className={`w-4 h-4 ${isProductsSubActive ? 'text-white/80' : 'text-slate-400'}`} />}
          </button>
          {productsOpen && (
            <div className="pl-6 space-y-1 py-1">
              <button onClick={() => handleNavClick('products')} className={subItemClass(isActive('products'))}>
                <ListTodo className={subIconClass(isActive('products'))} /><span className="truncate">Products</span>
              </button>
              <button onClick={() => handleNavClick('categories')} className={subItemClass(isActive('categories'))}>
                <PlusCircle className={subIconClass(isActive('categories'))} /><span className="truncate">Categories &amp; Sub-Categories</span>
              </button>
            </div>
          )}
        </div>

        {/* Inventory */}
        <button onClick={() => handleNavClick('inventory')} className={itemClass(isActive('inventory'))}>
          <Boxes className={iconClass(isActive('inventory'))} />
          <span className="truncate">Inventory</span>
        </button>

        {/* Reports */}
        <button onClick={() => handleNavClick('reports')} className={itemClass(isActive('reports'))}>
          <BarChart3 className={iconClass(isActive('reports'))} />
          <span className="truncate">Reports</span>
        </button>

      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-emerald-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
