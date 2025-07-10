export enum PaymentMethod {
    CASH = "cash",
    CREDIT_CARD = "credit_card",
    BANK_TRANSFER = "bank_transfer",
    STRIPE = "stripe",
}

export interface IPayment {
    payment_id: string;
    invoice_id: string;
    payment_date: Date;
    amount: number;
    payment_method: PaymentMethod;
    description?: string;
    reference?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreatePaymentRequest {
    payment_date: Date;
    amount: number;
    payment_method: PaymentMethod;
    description?: string;
    reference?: string;
}
