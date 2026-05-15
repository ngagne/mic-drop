import { describe, expect, it } from 'vitest';

import { approvedPaymentRequest, declinedPaymentRequest } from '../fixtures/payment-data.fixture';
import { submitPayment } from '../helpers/payment-gateway.helper';

describe('payments functional', () => {
  it('approves a valid payment request', async () => {
    const response = await submitPayment(approvedPaymentRequest);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      approved: true,
      transactionId: 'txn-1999-usd'
    });
  });

  it('rejects invalid payment amount', async () => {
    const response = await submitPayment(declinedPaymentRequest);

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      approved: false,
      reason: 'INVALID_AMOUNT'
    });
  });
});
