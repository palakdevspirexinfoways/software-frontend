import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export const Layout = ({ children, activePage, setActivePage, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <Header />
      <main className="ml-64 pt-16 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
