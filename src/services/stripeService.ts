// This service handles Stripe-related functionality
import { loadStripe } from "@stripe/stripe-js";
// Import Stripe for server-side operations
import Stripe from "stripe";

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Initialize Stripe server-side client
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Price IDs for different plans
export const STRIPE_PRICES = {
  PRO_MONTHLY: "price_monthly", // You'll need to replace these with your actual Stripe price IDs
  PRO_ANNUAL: "price_annual",
  PREMIUM_MONTHLY: "price_premium_monthly",
  PREMIUM_ANNUAL: "price_premium_annual"
};

/**
 * Creates a checkout session for the user to upgrade to premium
 * @param userId The ID of the user making the purchase
 * @param priceId The Stripe price ID for the subscription
 * @param customerEmail Optional customer email for prefilling checkout
 * @returns The checkout session ID or an error
 */
export const createCheckoutSession = async (
  userId: string,
  priceId: string = STRIPE_PRICES.PRO_MONTHLY,
  customerEmail?: string | null,
) => {
  try {
    console.log(`Creating checkout session for user: ${userId} with price: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${import.meta.env.VITE_APP_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.VITE_APP_URL}/pricing`,
      client_reference_id: userId,
      customer_email: customerEmail || undefined,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      metadata: {
        userId: userId,
      },
    });

    return {
      sessionId: session.id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      sessionId: null,
      error: "Failed to create checkout session",
    };
  }
};

/**
 * Redirects the user to the Stripe Checkout page
 * @param sessionId The ID of the checkout session
 */
export const redirectToCheckout = async (sessionId: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe has not been initialized");
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    return { error: "Failed to redirect to checkout" };
  }
};

/**
 * Updates the user's subscription status after a successful payment
 * @param userId The ID of the user
 * @param subscriptionData The subscription data from Stripe
 * @param supabaseClient Optional Supabase client to update the database
 */
export const updateSubscriptionStatus = async (
  userId: string,
  subscriptionData: {
    status: string;
    plan: string;
    customerId: string;
    subscriptionId: string;
  },
  supabaseClient?: any,
) => {
  try {
    if (!supabaseClient) {
      console.error("Supabase client is required to update subscription status");
      return { error: "Supabase client is required" };
    }

    const { error } = await supabaseClient
      .from("users")
      .update({
        stripe_customer_id: subscriptionData.customerId,
        stripe_subscription_id: subscriptionData.subscriptionId,
        subscription_status: subscriptionData.status,
        plan_type: subscriptionData.plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user subscription:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return { error: "Failed to update subscription status" };
  }
};

/**
 * Verifies a Stripe webhook signature
 * @param payload The raw request payload
 * @param signature The Stripe signature from the request headers
 * @param webhookSecret The Stripe webhook secret
 * @returns Whether the signature is valid
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  webhookSecret: string,
) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
    return { event, error: null };
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return { event: null, error };
  }
};

/**
 * Cancels a user's subscription
 * @param subscriptionId The ID of the subscription to cancel
 * @returns Success or error status
 */
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    console.log(`Cancelling subscription: ${subscriptionId}`);

    // If we have a Stripe client, try to cancel the subscription
    if (stripeClient) {
      try {
        const subscription = await stripeClient.subscriptions.update(
          subscriptionId,
          { cancel_at_period_end: true },
        );

        return {
          subscription,
          error: null,
        };
      } catch (stripeError) {
        console.error("Error cancelling Stripe subscription:", stripeError);
        // Fall back to mock implementation
      }
    }

    // Mock implementation for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { error: null };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return { error: "Failed to cancel subscription" };
  }
};

/**
 * Gets customer payment methods
 * @param customerId The Stripe customer ID
 * @returns List of payment methods or an error
 */
export const getCustomerPaymentMethods = async (customerId: string) => {
  try {
    console.log(`Getting payment methods for customer: ${customerId}`);

    // If we have a Stripe client, try to get the payment methods
    if (stripeClient) {
      try {
        const paymentMethods = await stripeClient.paymentMethods.list({
          customer: customerId,
          type: "card",
        });

        return {
          paymentMethods: paymentMethods.data,
          error: null,
        };
      } catch (stripeError) {
        console.error("Error getting payment methods:", stripeError);
        // Fall back to mock implementation
      }
    }

    // Mock implementation for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock payment methods
    return {
      paymentMethods: [
        {
          id: "pm_mock_1",
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2025,
          },
        },
      ],
      error: null,
    };
  } catch (error) {
    console.error("Error getting payment methods:", error);
    return {
      paymentMethods: [],
      error: "Failed to get payment methods",
    };
  }
};

/**
 * Gets customer billing history
 * @param customerId The Stripe customer ID
 * @returns List of invoices or an error
 */
export const getCustomerBillingHistory = async (customerId: string) => {
  try {
    console.log(`Getting billing history for customer: ${customerId}`);

    // If we have a Stripe client, try to get the invoices
    if (stripeClient) {
      try {
        const invoices = await stripeClient.invoices.list({
          customer: customerId,
          limit: 10,
        });

        return {
          invoices: invoices.data,
          error: null,
        };
      } catch (stripeError) {
        console.error("Error getting invoices:", stripeError);
        // Fall back to mock implementation
      }
    }

    // Mock implementation for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock invoices
    const mockInvoices = [
      {
        id: "in_mock_1",
        amount_paid: 2999,
        status: "paid",
        created: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        lines: {
          data: [
            {
              description: "Premium Plan - Monthly",
            },
          ],
        },
        hosted_invoice_url: "#",
      },
      {
        id: "in_mock_2",
        amount_paid: 2999,
        status: "paid",
        created: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        lines: {
          data: [
            {
              description: "Premium Plan - Monthly",
            },
          ],
        },
        hosted_invoice_url: "#",
      },
    ];

    return {
      invoices: mockInvoices,
      error: null,
    };
  } catch (error) {
    console.error("Error getting billing history:", error);
    return {
      invoices: [],
      error: "Failed to get billing history",
    };
  }
};

/**
 * Handles a Stripe webhook event
 * @param event The Stripe event object
 * @param supabaseClient Optional Supabase client to update the database
 * @returns Success or error status
 */
export const handleWebhookEvent = async (event: any, supabaseClient?: any) => {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await updateSubscriptionStatus(
          session.client_reference_id,
          {
            status: "active",
            plan: "premium",
            customerId: session.customer,
            subscriptionId: session.subscription,
          },
          supabaseClient,
        );
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object;
        if (supabaseClient && subscription.customer) {
          const { data: userData } = await supabaseClient
            .from("users")
            .select("id")
            .eq("stripe_customer_id", subscription.customer)
            .single();

          if (userData) {
            await updateSubscriptionStatus(
              userData.id,
              {
                status: subscription.status,
                plan: "premium",
                customerId: subscription.customer,
                subscriptionId: subscription.id,
              },
              supabaseClient,
            );
          }
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        if (supabaseClient && deletedSubscription.customer) {
          const { data: userData } = await supabaseClient
            .from("users")
            .select("id")
            .eq("stripe_customer_id", deletedSubscription.customer)
            .single();

          if (userData) {
            await updateSubscriptionStatus(
              userData.id,
              {
                status: "canceled",
                plan: "basic",
                customerId: deletedSubscription.customer,
                subscriptionId: deletedSubscription.id,
              },
              supabaseClient,
            );
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { error: null };
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return { error: "Failed to process webhook event" };
  }
};
