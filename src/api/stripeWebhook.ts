// This file handles Stripe webhook events
import {
  handleWebhookEvent,
  verifyWebhookSignature,
} from "@/services/stripeService";
import { supabase } from "@/lib/supabase";

/**
 * Process a Stripe webhook event
 * @param request The incoming webhook request
 * @returns A response object
 */
export const processWebhookEvent = async (request: Request) => {
  try {
    // Get the signature from the headers
    const signature = request.headers.get("stripe-signature") || "";

    // Get the raw body as text
    const payload = await request.text();

    // Get the webhook secret from environment variables
    const webhookSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn(
        "Stripe webhook secret is not set. Skipping signature verification.",
      );
    }

    // Verify the webhook signature if secret is available
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Parse the event
    const event = JSON.parse(payload);

    // Log the event type for debugging
    console.log(`Processing Stripe webhook event: ${event.type}`);

    // Handle the event
    const { error } = await handleWebhookEvent(event, supabase);
    if (error) {
      console.error("Error handling webhook event:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return a success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
