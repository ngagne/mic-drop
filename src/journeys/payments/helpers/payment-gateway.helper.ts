import type { PaymentRequest } from '../fixtures/payment-data.fixture';

export interface PaymentResponse {
  statusCode: number;
  body: {
    approved: boolean;
    transactionId?: string;
    reason?: string;
  };
}

export const submitPayment = (request: PaymentRequest): Promise<PaymentResponse> => {
  if (request.amountInCents > 0) {
    return Promise.resolve({
      statusCode: 201,
      body: {
        approved: true,
        transactionId: `txn-${request.amountInCents}-${request.currency.toLowerCase()}`
      }
    });
  }

  return Promise.resolve({
    statusCode: 422,
    body: {
      approved: false,
      reason: 'INVALID_AMOUNT'
    }
  });
};
