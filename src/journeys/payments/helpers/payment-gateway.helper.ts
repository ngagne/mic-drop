import type { PaymentRequest } from '../fixtures/payment-data.fixture';

export interface PaymentResponse {
  statusCode: number;
  body: {
    approved: boolean;
    transactionId?: string;
    reason?: string;
  };
}

export interface PaymentsListResponse {
  statusCode: number;
  body: {
    payments?: {
      id: string;
      amountInCents: number;
      currency: string;
      status: 'SETTLED' | 'PENDING';
    }[];
    error?: string;
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

export const listPayments = (authorizationHeader: string): Promise<PaymentsListResponse> => {
  if (authorizationHeader === 'Bearer stub-access-token') {
    return Promise.resolve({
      statusCode: 200,
      body: {
        payments: [
          {
            id: 'pay_001',
            amountInCents: 1999,
            currency: 'USD',
            status: 'SETTLED'
          },
          {
            id: 'pay_002',
            amountInCents: 499,
            currency: 'USD',
            status: 'PENDING'
          }
        ]
      }
    });
  }

  return Promise.resolve({
    statusCode: 401,
    body: {
      error: 'UNAUTHORIZED'
    }
  });
};
