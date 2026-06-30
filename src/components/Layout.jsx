import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { CRMProvider } from '../context/CRMContext';

export const Layout = ({ children, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <CRMProvider>
      <div className="min-h-screen bg-slate-50 relative">
        <Sidebar 
          onLogout={onLogout} 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <Header 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
        <main className="lg:ml-64 px-4 pb-4 pt-20 md:px-8 md:pb-8 md:pt-24 min-h-screen">
          {children}
        </main>
      </div>
    </CRMProvider>
  );
};

export default Layout;
