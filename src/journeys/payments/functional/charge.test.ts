import { describe, expect, it } from 'vitest';

import { validAuthUser } from '../../authentication/fixtures/auth-users.fixture';
import { authenticateUser } from '../../helpers/auth-session.helper';
import { approvedPaymentRequest, declinedPaymentRequest } from '../fixtures/payment-data.fixture';
import { listPayments, submitPayment } from '../helpers/payment-gateway.helper';

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

  it('lists payments when reusing JWT from authentication response', async () => {
    const { jwt } = await authenticateUser(validAuthUser);
    const paymentsResponse = await listPayments(`Bearer ${jwt}`);

    expect(paymentsResponse.statusCode).toBe(200);
    expect(paymentsResponse.body).toMatchObject({
      payments: [
        { id: 'pay_001', amountInCents: 1999, currency: 'USD', status: 'SETTLED' },
        { id: 'pay_002', amountInCents: 499, currency: 'USD', status: 'PENDING' }
      ]
    });
  });
});
