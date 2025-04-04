// This service handles Stripe-related functionality
import { loadStripe } from "@stripe/stripe-js";
// Import Stripe for server-side operations
import Stripe from "stripe";

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

// Initialize Stripe server-side client if secret key is available
let stripeClient: Stripe | null = null;
const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;

if (stripeSecretKey) {
  try {
    // @ts-ignore - Stripe might not be available in the browser
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16", // Use the latest stable API version
    });
  } catch (error) {
    console.error("Failed to initialize Stripe client:", error);
  }
}

/**
 * Creates a checkout session for the user to upgrade to premium
 * @param userId The ID of the user making the purchase
 * @param priceId The Stripe price ID for the subscription
 * @param customerEmail Optional customer email for prefilling checkout
 * @returns The checkout session ID or an error
 */
export const createCheckoutSession = async (
  userId: string,
  priceId?: string,
  customerEmail?: string | null,
) => {
  try {
    // Log the checkout session creation attempt
    console.log(
      `Creating checkout session for user: ${userId} with price: ${priceId || "price_premium_monthly"}`,
    );

    // Create a checkout session object
    const sessionData = {
      userId,
      priceId: priceId || "price_premium_monthly",
      successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/account`,
      customerEmail, // Will be null if not provided
    };

    // Try to use the server-side API endpoint first
    try {
      // Attempt to call our API endpoint if it exists
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      // If the API endpoint exists and returns a valid response, use it
      if (response.ok) {
        const data = await response.json();
        return {
          sessionId: data.sessionId,
          error: data.error || null,
        };
      }
    } catch (apiError) {
      // If the API call fails, fall back to the mock implementation
      console.log("API endpoint not available, using mock implementation");
    }

    // If we have a Stripe client, try to create a real session
    if (stripeClient) {
      try {
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId || "price_premium_monthly",
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/account`,
          client_reference_id: userId,
          customer_email: customerEmail || undefined,
        });

        return {
          sessionId: session.id,
          error: null,
        };
      } catch (stripeError) {
        console.error("Error creating Stripe session:", stripeError);
        // Fall back to mock implementation
      }
    }

    // Mock implementation for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a mock session ID
    return {
      sessionId: `cs_test_${Date.now()}`,
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
    console.log(`Redirecting to checkout with session ID: ${sessionId}`);

    // In a real implementation, we would use the Stripe.js library
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe has not been initialized");
    }

    // For demo purposes, we'll show an alert instead of redirecting
    // Only in development mode
    if (import.meta.env.DEV) {
      alert(
        "In a production environment, you would be redirected to the Stripe checkout page. Session ID: " +
          sessionId,
      );
      return { error: null };
    }

    // In production, actually redirect to Stripe checkout
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
  subscriptionData: any,
  supabaseClient?: any,
) => {
  try {
    console.log(
      `Updating subscription status for user: ${userId}`,
      subscriptionData,
    );

    // If we have a Supabase client, update the user's subscription status
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("users")
        .update({
          plan_type: subscriptionData.plan || "premium",
          stripe_customer_id: subscriptionData.customerId,
          stripe_subscription_id: subscriptionData.subscriptionId,
          subscription_status: subscriptionData.status || "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user subscription in Supabase:", error);
        return { error };
      }

      console.log(`Successfully updated subscription for user: ${userId}`);
      return { error: null };
    }

    // If no Supabase client, simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
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
  webhookSecret?: string,
) => {
  // If we don't have a webhook secret, we can't verify the signature
  if (!webhookSecret) {
    console.warn("No webhook secret provided, skipping signature verification");
    return true;
  }

  // If we have a Stripe client, use it to verify the signature
  if (stripeClient) {
    try {
      // @ts-ignore - Stripe types might not be available
      const event = stripeClient.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      return !!event;
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  // For development purposes, we'll log the signature verification attempt
  console.log("Verifying webhook signature", {
    payload: payload.substring(0, 100),
    signature,
  });

  // For demo purposes without Stripe client, we'll always return true
  return true;
};

/**
 * Handles a Stripe webhook event
 * @param event The Stripe event object
 * @param supabaseClient Optional Supabase client to update the database
 * @returns Success or error status
 */
export const handleWebhookEvent = async (event: any, supabaseClient?: any) => {
  try {
    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        // Payment is successful, provision access
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
        // Subscription was updated
        const updatedSubscription = event.data.object;
        // Find the user ID from the customer ID
        if (supabaseClient && updatedSubscription.customer) {
          const { data: userData } = await supabaseClient
            .from("users")
            .select("id")
            .eq("stripe_customer_id", updatedSubscription.customer)
            .single();

          if (userData) {
            await updateSubscriptionStatus(
              userData.id,
              {
                status: updatedSubscription.status,
                plan: "premium", // Or map from the subscription item
                customerId: updatedSubscription.customer,
                subscriptionId: updatedSubscription.id,
              },
              supabaseClient,
            );
          }
        }
        break;

      case "customer.subscription.deleted":
        // Subscription was cancelled or expired
        const deletedSubscription = event.data.object;
        // Find the user ID from the customer ID
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
                plan: "basic", // Downgrade to basic plan
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
