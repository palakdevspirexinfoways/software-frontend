import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as crmService from '../services/crmService';
import { api } from '../services/api';

const CRMContext = createContext(null);

export const CRMProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);

  const refreshCustomers = useCallback(async () => {
    try {
      const data = await crmService.getCustomers();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error('CRM: Failed to fetch customers', e);
    } finally {
      setCustomersLoaded(true);
    }
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const data = await api.get('/invoices');
      if (Array.isArray(data)) setAllInvoices(data);
    } catch (e) {
      console.error('CRM: Failed to refresh invoices', e);
    } finally {
      setInvoicesLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshCustomers();
    refreshInvoices();
  }, [refreshCustomers, refreshInvoices]);

  const syncFromInvoice = useCallback(async (invoice) => {
    const customer = await crmService.syncCustomerFromInvoice(invoice, customers);
    await refreshCustomers();
    await refreshInvoices();
    return customer;
  }, [refreshCustomers, refreshInvoices, customers]);

  const getCustomerPricing = useCallback(async (customerId, productName) => {
    return await crmService.getCustomerPricing(customerId, productName);
  }, []);

  const getCustomerStats = useCallback((customer) => {
    return crmService.computeCustomerStats(customer, allInvoices);
  }, [allInvoices]);

  const value = {
    customers,
    allInvoices,
    invoicesLoaded,
    customersLoaded,
    refreshCustomers,
    refreshInvoices,
    syncFromInvoice,
    getCustomerPricing,
    getCustomerStats,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
};

export default CRMContext;
