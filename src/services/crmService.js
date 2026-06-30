import { api } from './api';

// ─── Customer CRUD ───────────────────────────────────────────
export const getCustomers = async () => {
  return await api.get('/customers');
};

export const getCustomerById = async (id) => {
  const customers = await getCustomers();
  return customers.find(c => c._id === id) || null;
};

export const checkDuplicate = async (mobile, email, gst, excludeId = null) => {
  // Can be done client-side by fetching all, or we let the server handle it
  // Since we already fetch all customers into context, let's keep it simple for now
  // For actual scale, this should be a server endpoint.
  return null; // Will rely on server 400 response for now
};

export const saveCustomer = async (data) => {
  if (data._id || data.id) {
    const id = data._id || data.id;
    return await api.put(`/customers/${id}`, data);
  }
  return await api.post('/customers', data);
};

export const updateCustomer = async (id, updates) => {
  return await api.put(`/customers/${id}`, updates);
};

export const deleteCustomer = async (id) => {
  return await api.delete(`/customers/${id}`);
};

// ─── Search ───────────────────────────────────────────────────
export const searchCustomers = (customers, query) => {
  if (!query?.trim() || !customers) return customers || [];
  const q = query.toLowerCase().trim();
  return customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.mobile?.includes(q) ||
    c.company?.toLowerCase().includes(q) ||
    c.gst?.toLowerCase().includes(q) ||
    c.code?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  );
};

// ─── Sync Customer from Invoice (Client Side helper) ──────────
export const syncCustomerFromInvoice = async (invoice, customers) => {
  if (!invoice?.phone) return null;

  let customer = customers.find(c => c.mobile === invoice.phone);

  if (!customer) {
    customer = await saveCustomer({
      name: invoice.client || '',
      company: invoice.company || '',
      mobile: invoice.phone || '',
      email: invoice.email || '',
      gst: invoice.gst || '',
      address: invoice.address || '',
      city: invoice.city || '',
      state: invoice.state || '',
      pincode: invoice.pincode || '',
      type: invoice.customerType || 'Retail',
      status: 'Active',
    });
  } else {
    // Fill in any missing fields
    const updates = {};
    if (!customer.company && invoice.company) updates.company = invoice.company;
    if (!customer.email && invoice.email) updates.email = invoice.email;
    if (!customer.gst && invoice.gst) updates.gst = invoice.gst;
    if (!customer.address && invoice.address) updates.address = invoice.address;
    if (!customer.city && invoice.city) updates.city = invoice.city;
    if (!customer.state && invoice.state) updates.state = invoice.state;
    if (Object.keys(updates).length) {
      customer = await saveCustomer({ ...customer, ...updates });
    }
  }

  return customer;
};

// ─── Customer Stats ───────────────────────────────────────────
export const computeCustomerStats = (customer, allInvoices) => {
  if (!customer) return null;

  const invs = (allInvoices || []).filter(inv =>
    inv.phone === customer.mobile && inv.payment !== 'Draft'
  );

  const totalBills = invs.length;
  const totalPurchase = invs.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalPaid = invs.reduce((s, i) => s + (i.amountReceived || 0), 0);
  const outstanding = Math.max(0, totalPurchase - totalPaid);
  const avgOrderValue = totalBills > 0 ? totalPurchase / totalBills : 0;
  const sorted = [...invs].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  const lastPurchaseDate = sorted[0]?.issueDate || null;

  return { totalBills, totalPurchase, totalPaid, outstanding, avgOrderValue, lastPurchaseDate, invoices: sorted };
};

// ─── Product Pricing ──────────────────────────────────────────
export const getCustomerPricing = async (customerId, productName) => {
  const pricing = await api.get(`/customers/${customerId}/pricing`);
  return pricing.find(p => p.productName === productName) || null;
};
