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
    <aside className="w-64 bg-[#009966] text-white h-screen flex flex-col fixed left-0 top-0 border-r border-[#009966] shadow-lg z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-emerald-800/60 bg-emerald-950/20">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
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
                    ? 'bg-white/15 text-white shadow-md shadow-black/5'
                    : 'text-emerald-100/85 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div className="flex items-center min-w-0">
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isSubActive ? 'text-white' : 'text-emerald-300 group-hover:text-white'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-emerald-250" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-emerald-250" />
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
                            ? 'bg-white/10 text-white'
                            : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <ListTodo className="w-4 h-4 mr-2" />
                          <span>Order Records</span>
                        </button>
                        <button
                          onClick={() => setActivePage('billing')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'billing'
                            ? 'bg-white/10 text-white'
                            : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          <span>New Billing</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setActivePage('products')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'products'
                            ? 'bg-white/10 text-white'
                            : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <ListTodo className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Products</span>
                        </button>
                        <button
                          onClick={() => setActivePage('categories')}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activePage === 'categories'
                            ? 'bg-white/10 text-white'
                            : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <PlusCircle className="w-4 h-4 mr-2 flex-shrink-0" />
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
                ? 'bg-white/15 text-white shadow-md shadow-black/5'
                : 'text-emerald-100/85 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-emerald-300 group-hover:text-white'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info / Bottom Section */}
      <div className="p-4 border-t border-emerald-850 bg-emerald-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-emerald-200/80 font-medium mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
