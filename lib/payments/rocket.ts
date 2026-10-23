/* ------------------------------------------------------------------ */
/*  Rocket (DBBL Nexus) integration — currently NOT implementable.     */
/*                                                                     */
/*  Rocket has no public self-serve merchant checkout API like bKash   */
/*  or Nagad. Online Rocket acceptance normally goes through:         */
/*    - a DBBL-issued merchant account + their enterprise API, or     */
/*    - a payment aggregator (e.g. SSLCommerz, ShurjoPay, DSSL) that   */
/*      supports Rocket as a payment channel.                          */
/*                                                                     */
/*  Until one of those is contracted, this provider only records the   */
/*  customer's intent (order created, payment pending) and throws      */
/*  NotConfiguredError. Set ROCKET_MODE=aggregator and ROCKET_* vars   */
/*  per your aggregator's docs when it becomes available.              */
/* ------------------------------------------------------------------ */

import {
  NotConfiguredError,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type ExecutePaymentInput,
  type ExecutePaymentResult,
  type PaymentProvider,
} from "./types";

class RocketProvider implements PaymentProvider {
  readonly id = "rocket" as const;

  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new NotConfiguredError("Rocket", [
      "ROCKET_MODE",
      "ROCKET_MERCHANT_ID",
      "ROCKET_API_KEY",
    ]);
  }

  async executePayment(_input: ExecutePaymentInput): Promise<ExecutePaymentResult> {
    throw new NotConfiguredError("Rocket", [
      "ROCKET_MODE",
      "ROCKET_MERCHANT_ID",
      "ROCKET_API_KEY",
    ]);
  }
}

export const rocketProvider: PaymentProvider = new RocketProvider();
