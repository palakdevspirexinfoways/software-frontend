import React from 'react';
import { User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-100 flex items-center justify-end px-8 z-10 shadow-sm">
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