export interface PaymentRequest {
  amountInCents: number;
  currency: string;
  source: 'card' | 'bank';
}

export const approvedPaymentRequest: PaymentRequest = {
  amountInCents: 1_999,
  currency: 'USD',
  source: 'card'
};

export const declinedPaymentRequest: PaymentRequest = {
  amountInCents: 0,
  currency: 'USD',
  source: 'card'
};

export const paymentProcessingDurationsMs: readonly number[] = [65, 68, 67, 66];
