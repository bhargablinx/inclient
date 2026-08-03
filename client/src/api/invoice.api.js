import api from "@/lib/axios";

export const createInvoice = (organizationId, data) =>
    api.post(`/organizations/${organizationId}/invoices`, data);

export const getInvoices = (organizationId, params = {}) =>
    api.get(`/organizations/${organizationId}/invoices`, { params });

export const getInvoice = (organizationId, invoiceId) =>
    api.get(`/organizations/${organizationId}/invoices/${invoiceId}`);

export const updateInvoice = (organizationId, invoiceId, data) =>
    api.patch(`/organizations/${organizationId}/invoices/${invoiceId}`, data);

export const deleteInvoice = (organizationId, invoiceId) =>
    api.delete(`/organizations/${organizationId}/invoices/${invoiceId}`);

export const updateInvoiceStatus = (organizationId, invoiceId, data) =>
    api.patch(
        `/organizations/${organizationId}/invoices/${invoiceId}/status`,
        data,
    );

export const generateInvoicePdf = (organizationId, invoiceId) =>
    api.get(`/organizations/${organizationId}/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
    });

export const downloadInvoicePdf = (organizationId, invoiceId) =>
    api.get(`/organizations/${organizationId}/invoices/${invoiceId}/download`, {
        responseType: "blob",
    });

export const sendInvoice = (organizationId, invoiceId, data) =>
    api.post(`/organizations/${organizationId}/invoices/${invoiceId}/send`, data);

export const duplicateInvoice = (organizationId, invoiceId) =>
    api.post(`/organizations/${organizationId}/invoices/${invoiceId}/duplicate`);
