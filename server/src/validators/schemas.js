import { z } from "zod";

/**
 * Reusable password strength validation schema.
 */
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
    .regex(/\d/, "Password must contain at least one number (0-9)")
    .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
    );

// --- Auth Schemas ---
export const signupSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address format"),
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: z.string().trim().email("Invalid email address format"),
    password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email("Invalid email address format"),
});

export const resetPasswordSchema = z.object({
    newPassword: passwordSchema,
});

// --- Organization Schemas ---
export const createOrganizationSchema = z.object({
    name: z.string().trim().min(2, "Organization name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
});

// --- Client Schemas ---
export const createClientSchema = z.object({
    name: z.string().trim().min(2, "Client name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    address: z.string().trim().optional(),
    taxId: z.string().trim().optional(),
});

// --- Invoice Schemas ---
export const invoiceItemSchema = z.object({
    description: z.string().trim().min(1, "Item description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price cannot be negative"),
    taxRate: z.number().min(0).max(100).optional().default(0),
    discountAmount: z.number().min(0).optional().default(0),
});

export const createInvoiceSchema = z.object({
    clientId: z.string().trim().min(1, "Client ID is required"),
    dueDate: z.string().or(z.date()),
    currency: z.enum(["INR", "USD", "EUR"]).optional().default("INR"),
    items: z.array(invoiceItemSchema).min(1, "Invoice must contain at least one line item"),
});

// --- Payment Schemas ---
export const createPaymentSchema = z.object({
    amount: z.number().positive("Payment amount must be greater than 0"),
    paymentDate: z.string().or(z.date()).optional(),
    paymentMethod: z.enum([
        "cash",
        "bank_transfer",
        "upi",
        "credit_card",
        "debit_card",
        "cheque",
        "other",
    ], {
        errorMap: () => ({ message: "Invalid payment method" }),
    }),
    referenceNumber: z.string().trim().optional(),
});
