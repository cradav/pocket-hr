import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type PlanFeature = {
  text: string;
  included: boolean;
};

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
};

const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "monthly",
  );

  const plans: PricingPlan[] = [
    {
      name: "Free",
      price: "$0",
      description: "Basic HR assistance for individuals",
      buttonText: "Get Started",
      features: [
        { text: "Access to Live Experts", included: true },
        { text: "1,000 AI-Generated Words per Month", included: true },
        { text: "Pocket.HR AI Assistants", included: true },
        { text: "AI-Driven Correspondence", included: true },
        { text: "Document Management and Analysis", included: true },
        { text: "AI Support", included: false },
        { text: "Real-time Employment News Alerts", included: false },
        { text: "Live HR Expert Consultation", included: false },
        { text: "Live Legal Consultation", included: false },
        { text: "Interactive Learning and Resource Center", included: false },
      ],
    },
    {
      name: "Pro Monthly",
      price: "$14.99",
      description: "Enhanced HR support for professionals",
      buttonText: "Subscribe",
      features: [
        { text: "Access to Live HR Experts", included: true },
        { text: "10,000 AI-Generated Words per Month", included: true },
        { text: "Pocket.HR AI Assistants", included: true },
        { text: "AI-Driven Correspondence", included: true },
        { text: "Document Management and Analysis", included: true },
        { text: "AI Support", included: true },
        { text: "Real-time Employment News Alerts", included: true },
        { text: "Live HR Expert Consultation", included: false },
        { text: "Live Legal Consultation", included: false },
        { text: "Interactive Learning and Resource Center", included: false },
      ],
    },
    {
      name: "Premium Monthly",
      price: "$39.99",
      description: "Comprehensive HR solutions with expert support",
      buttonText: "Subscribe",
      popular: true,
      features: [
        { text: "Priority Access to Live HR Experts", included: true },
        { text: "50,000 AI-Generated Words per Month", included: true },
        { text: "Pocket.HR AI Assistants", included: true },
        { text: "AI-Driven Correspondence", included: true },
        { text: "Document Management and Analysis", included: true },
        { text: "AI and Live Support", included: true },
        { text: "Real-time Employment News Alerts", included: true },
        {
          text: "One 30-Minute Live HR Expert Consultation per month ($49 Value)",
          included: true,
        },
        { text: "Live Legal Consultation", included: false },
        {
          text: "Coming soon: Interactive Learning and Resource Center",
          included: false,
        },
      ],
    },
    {
      name: "Pro Annual",
      price: "$143.90",
      description: "Save 20% with annual billing",
      buttonText: "Subscribe",
      features: [
        { text: "Access to Live HR Experts", included: true },
        { text: "10,000 AI-Generated Words per Month", included: true },
        { text: "Pocket.HR AI Assistants", included: true },
        { text: "AI-Driven Correspondence", included: true },
        { text: "Document Management and Analysis", included: true },
        { text: "AI Support", included: true },
        { text: "Real-time Employment News Alerts", included: true },
        {
          text: "One 30-Minute Live HR Expert Consultation per month ($49 Value)",
          included: true,
        },
        {
          text: "One 30-Minute Live Legal Consultation per month (when applicable)",
          included: true,
        },
        {
          text: "Coming soon: Interactive Learning and Resource Center",
          included: true,
        },
      ],
    },
    {
      name: "Premium Annual",
      price: "$383.90",
      description: "Save 20% with our most comprehensive plan",
      buttonText: "Subscribe",
      features: [
        { text: "Priority Access to Live HR Experts", included: true },
        { text: "50,000 AI-Generated Words per Month", included: true },
        { text: "Pocket.HR AI Assistants", included: true },
        { text: "AI-Driven Correspondence", included: true },
        { text: "Document Management and Analysis", included: true },
        { text: "Live Support", included: true },
        { text: "Real-time Employment News Alerts", included: true },
        {
          text: "One 1-Hour HR Expert Consultation per month ($99 Value)",
          included: true,
        },
        {
          text: "One 1-Hour Live Legal Consultation per month (when applicable)",
          included: true,
        },
        {
          text: "Coming soon: Interactive Learning and Resource Center",
          included: true,
        },
      ],
    },
  ];

  // Filter plans based on billing interval
  const filteredPlans = plans.filter((plan) => {
    if (billingInterval === "monthly") {
      return plan.name === "Free" || plan.name.includes("Monthly");
    } else {
      return plan.name === "Free" || plan.name.includes("Annual");
    }
  });

  return (
    <div className="bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that's right for you and your career journey
          </p>

          <div className="flex items-center justify-center mt-6 space-x-4">
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium ${billingInterval === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingInterval === "annual"}
              onCheckedChange={(checked) =>
                setBillingInterval(checked ? "annual" : "monthly")
              }
            />
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium ${billingInterval === "annual" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annual <span className="text-primary font-medium">Save 20%</span>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col h-full ${plan.popular ? "border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.name.includes("Monthly") && (
                    <span className="text-muted-foreground ml-2">/month</span>
                  )}
                  {plan.name.includes("Annual") && (
                    <span className="text-muted-foreground ml-2">/year</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className={`flex items-start ${!feature.included ? "text-muted-foreground" : ""}`}
                    >
                      <span className="mr-2 mt-1">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="h-4 w-4 block"></span>
                        )}
                      </span>
                      <span className="text-sm">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${plan.popular ? "bg-primary" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All plans include access to the Pocket.HR platform and basic AI
            assistance.
            <br />
            Need a custom solution for your organization?{" "}
            <a href="#" className="text-primary font-medium hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
