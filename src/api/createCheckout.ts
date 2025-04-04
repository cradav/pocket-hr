// This file handles creating Stripe checkout sessions
import { createCheckoutSession } from "@/services/stripeService";
import { supabase } from "@/lib/supabase";

/**
 * Create a Stripe checkout session
 * @param request The incoming request
 * @returns A response with the session ID
 */
export const createCheckout = async (request: Request) => {
  try {
    // Parse the request body
    const { userId, priceId, customerEmail } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user data for the checkout
    let userEmail = customerEmail;
    if (!userEmail && supabase) {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        userEmail = data.user?.email || null;
      } catch (err) {
        console.log("Could not fetch user email from Supabase", err);
        // Continue without email if we can't get it
      }
    }

    // Create a checkout session
    const { sessionId, error } = await createCheckoutSession(
      userId,
      priceId,
      userEmail,
    );

    if (error || !sessionId) {
      return new Response(
        JSON.stringify({ error: error || "Failed to create checkout session" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Log the successful creation of checkout session
    console.log(
      `Checkout session created successfully: ${sessionId} for user: ${userId}`,
    );

    // Return the session ID
    return new Response(JSON.stringify({ sessionId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
