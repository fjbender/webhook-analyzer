import { createMollieClient, Payment, Order, Refund, Subscription, Mandate } from "@mollie/api-client";

export type MollieResource = Payment | Order | Refund | Subscription | Mandate | any;

export class MollieClient {
  private apiKey: string;
  private client: ReturnType<typeof createMollieClient>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = createMollieClient({ apiKey });
  }

  /**
   * Fetch a resource by ID. Automatically determines the resource type from the ID prefix.
   */
  async fetchResource(resourceId: string): Promise<MollieResource> {
    // Mollie resource IDs have prefixes that indicate their type
    // tr_ = payment, ord_ = order, re_ = refund, sub_ = subscription, mdt_ = mandate, cst_ = customer
    
    if (resourceId.startsWith("tr_")) {
      return await this.client.payments.get(resourceId);
    } else if (resourceId.startsWith("ord_")) {
      return await this.client.orders.get(resourceId);
    } else if (resourceId.startsWith("re_")) {
      // Refunds need parent payment ID, extract from resource or error
      throw new Error("Refund ID requires parent payment ID. Use fetchRefund() method instead.");
    } else if (resourceId.startsWith("sub_")) {
      // Subscriptions need customer ID
      throw new Error("Subscription ID requires customer ID. Use fetchSubscription() method instead.");
    } else if (resourceId.startsWith("mdt_")) {
      // Mandates need customer ID
      throw new Error("Mandate ID requires customer ID. Use fetchMandate() method instead.");
    } else if (resourceId.startsWith("cst_")) {
      return await this.client.customers.get(resourceId);
    } else {
      throw new Error(`Unknown resource type for ID: ${resourceId}`);
    }
  }

  /**
   * Fetch a payment by ID
   */
  async fetchPayment(paymentId: string): Promise<Payment> {
    return await this.client.payments.get(paymentId);
  }

  /**
   * Fetch an order by ID
   */
  async fetchOrder(orderId: string): Promise<Order> {
    return await this.client.orders.get(orderId);
  }

  /**
   * Fetch a refund by payment ID and refund ID
   */
  async fetchRefund(paymentId: string, refundId: string): Promise<Refund> {
    return await this.client.paymentRefunds.get(refundId, { paymentId });
  }

  /**
   * Fetch a subscription by customer ID and subscription ID
   */
  async fetchSubscription(customerId: string, subscriptionId: string): Promise<Subscription> {
    return await this.client.customerSubscriptions.get(subscriptionId, { customerId });
  }

  /**
   * Fetch a mandate by customer ID and mandate ID
   */
  async fetchMandate(customerId: string, mandateId: string): Promise<Mandate> {
    return await this.client.customerMandates.get(mandateId, { customerId });
  }

  /**
   * Test the API key by listing payment methods
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.methods.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Helper to determine resource type from ID prefix
 */
export function getResourceType(resourceId: string): string {
  if (resourceId.startsWith("tr_")) return "payment";
  if (resourceId.startsWith("ord_")) return "order";
  if (resourceId.startsWith("re_")) return "refund";
  if (resourceId.startsWith("sub_")) return "subscription";
  if (resourceId.startsWith("mdt_")) return "mandate";
  if (resourceId.startsWith("cst_")) return "customer";
  return "unknown";
}
