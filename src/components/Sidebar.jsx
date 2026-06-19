import React, { useState } from 'react';
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
  ListTodo
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage, onLogout }) => {
  const [salesOpen, setSalesOpen] = useState(activePage === 'sales' || activePage === 'billing');
  const [productsOpen, setProductsOpen] = useState(activePage === 'products' || activePage === 'categories');

  // Safe parsing of user data
  let user = { name: 'Admin User', email: 'admin@gmail.com' };
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error('Error parsing user from localStorage');
  }

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', name: 'Sales & Order', icon: ShoppingCart, hasDropdown: true },
    { id: 'products', name: 'Product Management', icon: Package, hasDropdown: true },
    { id: 'inventory', name: 'Inventory', icon: Boxes },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-100 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            GreenAdmin
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.hasDropdown) {
            const isOpen = item.id === 'sales' ? salesOpen : productsOpen;
            const toggleOpen = item.id === 'sales'
              ? () => setSalesOpen(!salesOpen)
              : () => setProductsOpen(!productsOpen);

            const isSubActive = item.id === 'sales'
              ? (activePage === 'sales' || activePage === 'billing')
              : (activePage === 'products' || activePage === 'categories');

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={toggleOpen}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-250 cursor-pointer group ${isSubActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center min-w-0">
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className={`w-4 h-4 ${isSubActive ? 'text-white/80' : 'text-slate-400'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isSubActive ? 'text-white/80' : 'text-slate-400'}`} />
                  )}
                </button>

                {/* Sub Menu Items */}
                {isOpen && (
                  <div className="pl-6 space-y-1 py-1">
                    {item.id === 'sales' ? (
                      <>
                        <button
                          onClick={() => setActivePage('sales')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'sales'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                        >
                          <ListTodo className={`w-4 h-4 mr-2 ${activePage === 'sales' ? 'text-white' : 'text-slate-400'}`} />
                          <span>Order Records</span>
                        </button>
                        <button
                          onClick={() => setActivePage('billing')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'billing'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                        >
                          <PlusCircle className={`w-4 h-4 mr-2 ${activePage === 'billing' ? 'text-white' : 'text-slate-400'}`} />
                          <span>New Billing</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setActivePage('products')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'products'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                        >
                          <ListTodo className={`w-4 h-4 mr-2 flex-shrink-0 ${activePage === 'products' ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">Products</span>
                        </button>
                        <button
                          onClick={() => setActivePage('categories')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'categories'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                        >
                          <PlusCircle className={`w-4 h-4 mr-2 flex-shrink-0 ${activePage === 'categories' ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">Categories & Sub-Categories</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-250 cursor-pointer group ${isActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-700 hover:shadow-sm'
                }`}
            >
              <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info / Bottom Section */}
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
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
