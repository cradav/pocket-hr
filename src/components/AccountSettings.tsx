import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useProfile } from "@/hooks/useSupabase";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  User,
  Bell,
  Shield,
  CreditCard,
  Save,
  AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { careerStages } from "./AIAssistant/data";
import {
  createCheckoutSession,
  redirectToCheckout,
  getCustomerPaymentMethods,
  getCustomerBillingHistory,
  cancelSubscription,
} from "@/services/stripeService";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Instead of creating a payment method directly, we'll use Stripe Checkout
      // First, create a checkout session
      const { sessionId, error: sessionError } = await createCheckoutSession(
        user?.id || "anonymous",
        "price_premium_monthly", // This would be a real price ID in production
      );

      if (sessionError || !sessionId) {
        setError(sessionError || "Failed to create checkout session");
        setProcessing(false);
        return;
      }

      // Redirect to the Stripe Checkout page
      const { error: redirectError } = await redirectToCheckout(sessionId);

      if (redirectError) {
        setError(redirectError);
        setProcessing(false);
        return;
      }

      // If we get here in a real implementation, the user would be redirected to Stripe
      // For demo purposes, we'll just simulate success
      setSucceeded(true);
      setProcessing(false);
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred");
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div className="p-3 border rounded-md">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing || succeeded}
        className="w-full"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Processing...
          </span>
        ) : succeeded ? (
          <span className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Payment Successful!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pay Now
          </span>
        )}
      </Button>
    </form>
  );
};

const AccountSettings = () => {
  const { user } = useAuth();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    privacySettings,
    updatePrivacySettings,
  } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [consultationReminders, setConsultationReminders] = useState(true);

  // AI category visibility preferences
  const [visibleCategories, setVisibleCategories] = useState<
    Record<string, boolean>
  >({});
  const [aiCategorySaveSuccess, setAiCategorySaveSuccess] = useState(false);

  useEffect(() => {
    if (user && profile) {
      setFormData({
        name: profile.full_name || user.user_metadata?.name || "",
        email: user.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
        jobTitle: profile.job_title || "",
      });

      // In a real app, these would come from the user's saved preferences
      setEmailNotifications(profile.email_notifications !== false);
      setPushNotifications(profile.push_notifications !== false);
      setWeeklyDigest(profile.weekly_digest === true);
      setConsultationReminders(profile.consultation_reminders !== false);
    }
  }, [user, profile]);

  // Load AI category visibility preferences from localStorage
  useEffect(() => {
    const storedPreferences = localStorage.getItem("aiCategoryVisibility");
    if (storedPreferences) {
      try {
        const parsedPreferences = JSON.parse(storedPreferences);
        setVisibleCategories(parsedPreferences);
      } catch (e) {
        console.error("Error parsing stored AI category preferences", e);
        // If there's an error, initialize with all categories visible
        const defaultVisibility: Record<string, boolean> = {};
        careerStages.forEach((stage) => {
          defaultVisibility[stage.id] = true;
          stage.assistants.forEach((assistant) => {
            defaultVisibility[assistant.id] = true;
          });
        });
        setVisibleCategories(defaultVisibility);
      }
    } else {
      // If no preferences are stored, initialize with all categories visible
      const defaultVisibility: Record<string, boolean> = {};
      careerStages.forEach((stage) => {
        defaultVisibility[stage.id] = true;
        stage.assistants.forEach((assistant) => {
          defaultVisibility[assistant.id] = true;
        });
      });
      setVisibleCategories(defaultVisibility);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Create a properly formatted update object
      const updateData = {
        full_name: formData.name,
        phone: formData.phone,
        company: formData.company,
        job_title: formData.jobTitle,
        // In a real app, you might update email through auth service instead
      };

      console.log("Saving profile with data:", updateData);
      const result = await updateProfile(updateData);

      if (result.error) {
        console.error("Error updating profile:", result.error);
      } else {
        console.log("Profile saved successfully:", result.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error in handleSaveProfile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Create a properly formatted update object
      const updateData = {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        weekly_digest: weeklyDigest,
        consultation_reminders: consultationReminders,
      };

      console.log("Saving notification preferences:", updateData);
      const result = await updateProfile(updateData);

      if (result.error) {
        console.error("Error updating notification preferences:", result.error);
      } else {
        console.log(
          "Notification preferences saved successfully:",
          result.data,
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error in handleSaveNotifications:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle visibility of a category
  const toggleCategoryVisibility = (categoryId: string) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Save AI category preferences
  const saveAICategoryPreferences = () => {
    try {
      localStorage.setItem(
        "aiCategoryVisibility",
        JSON.stringify(visibleCategories),
      );
      console.log(
        "AI category preferences saved to localStorage:",
        visibleCategories,
      );
      setAiCategorySaveSuccess(true);
      setTimeout(() => setAiCategorySaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving AI category preferences:", error);
    }
  };

  const isPremium = profile?.plan_type === "premium";

  return (
    <div className="w-full h-full bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          {isPremium && (
            <Badge
              variant="outline"
              className="bg-primary/10 px-4 py-2 flex items-center gap-2"
            >
              <Crown className="h-4 w-4 text-amber-500" />
              <span>Premium Account</span>
            </Badge>
          )}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="ai-categories">AI Categories</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "default"}`}
                      />
                      <AvatarFallback>
                        {formData.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={true} // Email changes require auth verification
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSaveProfile}
                  disabled={!isEditing || isSaving}
                  className={saveSuccess ? "bg-green-600" : ""}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : saveSuccess ? (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Saved!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Weekly Digest</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your activity
                      </p>
                    </div>
                    <Switch
                      checked={weeklyDigest}
                      onCheckedChange={setWeeklyDigest}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Consultation Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders about upcoming consultations
                      </p>
                    </div>
                    <Switch
                      checked={consultationReminders}
                      onCheckedChange={setConsultationReminders}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className={saveSuccess ? "bg-green-600" : ""}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : saveSuccess ? (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Saved!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Preferences
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="ai-categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  AI Assistant Categories
                </CardTitle>
                <CardDescription>
                  Choose which AI assistant categories to show in the sidebar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {careerStages.map((stage) => (
                  <div
                    key={stage.id}
                    className="border rounded-md p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-base">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          AI assistance for {stage.name.toLowerCase()} stage
                        </p>
                      </div>
                      <Switch
                        checked={visibleCategories[stage.id] !== false}
                        onCheckedChange={() =>
                          toggleCategoryVisibility(stage.id)
                        }
                      />
                    </div>

                    <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                      {stage.assistants.map((assistant) => (
                        <div
                          key={assistant.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <h5 className="font-medium">{assistant.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {assistant.description}
                            </p>
                          </div>
                          <Switch
                            checked={visibleCategories[assistant.id] !== false}
                            onCheckedChange={() =>
                              toggleCategoryVisibility(assistant.id)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveAICategoryPreferences}
                  className={aiCategorySaveSuccess ? "bg-green-600" : ""}
                >
                  {aiCategorySaveSuccess ? (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Saved!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Category Preferences
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter your new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account by enabling
                    two-factor authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your active sessions and sign out from other devices.
                  </p>
                  <Button variant="outline">Manage Sessions</Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Security Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Data Settings
                </CardTitle>
                <CardDescription>
                  Control how your data is used and shared within the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Data Sharing</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow AI assistants to access your profile data to
                        personalize responses
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataSharing}
                      onCheckedChange={(checked) => {
                        updatePrivacySettings({ dataSharing: checked });
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Profile Visibility</h4>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to other users in the platform
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.profileVisibility}
                      onCheckedChange={(checked) => {
                        updatePrivacySettings({ profileVisibility: checked });
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Document Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow AI assistants to access your uploaded documents
                        for analysis
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.documentAccess}
                      onCheckedChange={(checked) => {
                        updatePrivacySettings({ documentAccess: checked });
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Analytics Consent</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow us to collect anonymous usage data to improve our
                        services
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.analyticsConsent}
                      onCheckedChange={(checked) => {
                        updatePrivacySettings({ analyticsConsent: checked });
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Communications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotional
                        offers
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.marketingConsent}
                      onCheckedChange={(checked) => {
                        updatePrivacySettings({ marketingConsent: checked });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => {
                    // This is handled automatically by the individual switches
                    // but we could add a bulk save function here if needed
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  }}
                  className={saveSuccess ? "bg-green-600" : ""}
                >
                  {saveSuccess ? (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Saved!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Privacy Settings
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {isPremium ? "Premium Plan" : "Basic Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium
                          ? "All features included with premium support"
                          : "Limited features with basic support"}
                      </p>
                    </div>
                    {isPremium ? (
                      <Badge className="bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={async () => {
                          try {
                            const { sessionId, error } =
                              await createCheckoutSession(
                                user?.id || "anonymous",
                                "price_premium_monthly",
                              );
                            if (error || !sessionId) {
                              console.error(
                                "Error creating checkout session:",
                                error,
                              );
                              return;
                            }
                            await redirectToCheckout(sessionId);
                          } catch (err) {
                            console.error("Error upgrading to premium:", err);
                          }
                        }}
                      >
                        Upgrade to Premium - $29.99/month
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Methods</h3>
                  {isPremium ? (
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted h-10 w-16 rounded flex items-center justify-center">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-xs text-muted-foreground">
                            Expires 12/2025
                          </p>
                        </div>
                      </div>
                      <Badge>Default</Badge>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Add a payment method</h4>
                      <Elements stripe={stripePromise}>
                        <PaymentForm />
                      </Elements>
                    </div>
                  )}
                  {isPremium && (
                    <Button variant="outline" size="sm">
                      Add Payment Method
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing History</h3>
                  <div className="border rounded-lg divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Premium Plan - Monthly</p>
                        <p className="text-xs text-muted-foreground">
                          May 1, 2023
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          View Receipt
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Premium Plan - Monthly</p>
                        <p className="text-xs text-muted-foreground">
                          Apr 1, 2023
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isPremium && user) {
                      // In a real app, you would have the subscription ID stored
                      const subscriptionId = "sub_123456";
                      cancelSubscription(subscriptionId).then(({ error }) => {
                        if (error) {
                          console.error(
                            "Error cancelling subscription:",
                            error,
                          );
                        } else {
                          // In a real app, you would update the UI to reflect the cancelled subscription
                          console.log("Subscription cancelled successfully");
                          // You might want to refresh the profile data here
                        }
                      });
                    }
                  }}
                >
                  Cancel Subscription
                </Button>
                <Button
                  onClick={() => {
                    // In a real app, this would redirect to a subscription management page
                    console.log("Manage subscription clicked");
                  }}
                >
                  Manage Subscription
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettings;
