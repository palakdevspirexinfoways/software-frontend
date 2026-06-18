import React from 'react';
import { Bell, Search, Settings, Calendar, User } from 'lucide-react';

export const Header = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
      {/* Search Bar / Left Side */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search everything..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* Date Display */}
        <div className="hidden md:flex items-center space-x-2 text-slate-500 text-xs font-semibold">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-slate-450 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

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