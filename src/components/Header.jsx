import React from 'react';
import { User, Menu } from 'lucide-react';

export const Header = ({ setIsMobileMenuOpen }) => {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-slate-100 flex items-center justify-between lg:justify-end px-4 lg:px-8 z-10 shadow-sm">
      {/* Left: Hamburger menu for mobile */}
      <div className="lg:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* User Status / Quick Profile Info */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">Green Admin</span>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Super Admin</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 shadow-sm">
            <User className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;