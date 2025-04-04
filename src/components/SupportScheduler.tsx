import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  Calendar as CalendarIcon,
  User,
  Briefcase,
  MessageSquare,
  CreditCard,
  CheckCircle,
  Crown,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useAuth, useProfile } from "@/hooks/useSupabase";
import { Badge } from "@/components/ui/badge";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  duration: 30 | 60; // Duration in minutes
}

interface Consultant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  specialization: string;
}

interface ConsultationPricing {
  duration: 30 | 60;
  price: number;
  isFree: boolean;
}

const SupportScheduler = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(
    null,
  );
  const [consultationType, setConsultationType] = useState("hr");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Get user authentication and profile information
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  // Check if user is premium and has free consultation available
  const isPremium = profile?.plan_type === "premium";
  const [freeConsultationAvailable, setFreeConsultationAvailable] =
    useState(false);
  const [freeConsultationsRemaining, setFreeConsultationsRemaining] =
    useState(0);

  // Fetch time slots from Supabase
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;

      try {
        setIsLoadingTimeSlots(true);

        // Format date for query
        const dateString = format(selectedDate, "yyyy-MM-dd");

        const { data, error } = await supabase
          .from("available_time_slots")
          .select("*")
          .eq("date", dateString)
          .order("time");

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform data to match TimeSlot interface
          const slots: TimeSlot[] = data.map((slot: any) => ({
            id: slot.id,
            time: format(new Date(`${dateString}T${slot.time}`), "h:mm a"),
            available: !slot.is_booked,
            duration: slot.duration,
          }));

          setTimeSlots(slots);
        } else {
          // If no slots found for the date, generate default slots
          generateDefaultTimeSlots(selectedDate);
        }
      } catch (err) {
        console.error("Error fetching time slots:", err);
        // Generate default slots if fetch fails
        generateDefaultTimeSlots(selectedDate);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    // Generate default time slots if no data in database
    const generateDefaultTimeSlots = (date: Date) => {
      const defaultSlots: TimeSlot[] = [
        { id: "1", time: "9:00 AM", available: true, duration: 60 },
        { id: "2", time: "9:30 AM", available: true, duration: 30 },
        { id: "3", time: "10:00 AM", available: true, duration: 60 },
        { id: "4", time: "10:30 AM", available: true, duration: 30 },
        { id: "5", time: "11:00 AM", available: false, duration: 60 },
        { id: "6", time: "11:30 AM", available: false, duration: 30 },
        { id: "7", time: "1:00 PM", available: true, duration: 60 },
        { id: "8", time: "1:30 PM", available: true, duration: 30 },
        { id: "9", time: "2:00 PM", available: true, duration: 60 },
        { id: "10", time: "2:30 PM", available: true, duration: 30 },
        { id: "11", time: "3:00 PM", available: false, duration: 60 },
        { id: "12", time: "3:30 PM", available: false, duration: 30 },
        { id: "13", time: "4:00 PM", available: true, duration: 60 },
        { id: "14", time: "4:30 PM", available: true, duration: 30 },
      ];

      // Make some slots unavailable on weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend
        defaultSlots.forEach((slot, index) => {
          if (index % 3 === 0) slot.available = false;
        });
      }

      setTimeSlots(defaultSlots);
    };

    fetchTimeSlots();
  }, [selectedDate]);

  // Fetch consultants from Supabase
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setIsLoadingConsultants(true);

        const { data, error } = await supabase
          .from("consultants")
          .select("*")
          .eq("role_type", consultationType)
          .eq("is_active", true);

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform data to match Consultant interface
          const consultantsList: Consultant[] = data.map((consultant: any) => ({
            id: consultant.id,
            name: consultant.name,
            role:
              consultationType === "hr" ? "HR Advocate" : "Legal Consultant",
            avatar:
              consultant.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${consultant.id}`,
            specialization: consultant.specialization,
          }));

          setConsultants(consultantsList);
        } else {
          // If no consultants found, use default data
          setDefaultConsultants();
        }
      } catch (err) {
        console.error("Error fetching consultants:", err);
        // Set default consultants if fetch fails
        setDefaultConsultants();
      } finally {
        setIsLoadingConsultants(false);
      }
    };

    // Set default consultants based on consultation type
    const setDefaultConsultants = () => {
      if (consultationType === "hr") {
        setConsultants([
          {
            id: "1",
            name: "Sarah Johnson",
            role: "HR Advocate",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
            specialization: "Employee Relations",
          },
          {
            id: "2",
            name: "Michael Chen",
            role: "HR Advocate",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
            specialization: "Benefits & Compensation",
          },
        ]);
      } else {
        setConsultants([
          {
            id: "3",
            name: "Jessica Martinez",
            role: "Legal Consultant",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
            specialization: "Employment Law",
          },
          {
            id: "4",
            name: "David Wilson",
            role: "Legal Consultant",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
            specialization: "Workplace Disputes",
          },
        ]);
      }
    };

    fetchConsultants();
  }, [consultationType]);

  // Check for free consultations
  useEffect(() => {
    // Check the database for remaining free consultations
    if (profile && isPremium) {
      const remaining = profile.free_consultations_remaining || 0;
      setFreeConsultationAvailable(remaining > 0);
      setFreeConsultationsRemaining(remaining);
    } else {
      setFreeConsultationAvailable(false);
      setFreeConsultationsRemaining(0);
    }
  }, [profile, isPremium]);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  // Consultation pricing options
  const consultationPricing: ConsultationPricing[] = [
    { duration: 60, price: 99, isFree: false },
    {
      duration: 30,
      price: 99 / 2,
      isFree: isPremium && freeConsultationAvailable,
    },
  ];

  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(false);

  const filteredConsultants = consultants.filter((consultant) =>
    consultationType === "hr"
      ? consultant.role === "HR Advocate"
      : consultant.role === "Legal Consultant",
  );

  const handleScheduleAppointment = () => {
    // Check if this is a free consultation or needs payment
    const selectedSlot = timeSlots.find((slot) => slot.id === selectedTimeSlot);
    const pricing = consultationPricing.find(
      (p) => p.duration === selectedSlot?.duration,
    );

    if (pricing?.isFree) {
      // Free consultation for premium members
      bookFreeConsultation();
    } else {
      // Paid consultation
      setPaymentDialogOpen(true);
    }
  };

  const bookFreeConsultation = async () => {
    // Update the database to reduce free consultations
    if (profile && isPremium && freeConsultationAvailable) {
      try {
        // Update the profile with one less free consultation
        const newRemaining = Math.max(0, freeConsultationsRemaining - 1);
        const result = await updateProfile({
          free_consultations_remaining: newRemaining,
        });

        if (result.error) {
          console.error("Error updating free consultations:", result.error);
          // Continue with booking anyway
        } else {
          // Update local state
          setFreeConsultationsRemaining(newRemaining);
          setFreeConsultationAvailable(newRemaining > 0);
        }
      } catch (error) {
        console.error("Error in bookFreeConsultation:", error);
        // Continue with booking anyway
      }
    }

    setConfirmationOpen(true);
  };

  const handlePayment = () => {
    // Simulate payment processing
    setPaymentProcessing(true);

    // Mock payment processing delay
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);

      // After successful payment, show confirmation
      setTimeout(() => {
        setPaymentDialogOpen(false);
        setPaymentSuccess(false);
        setConfirmationOpen(true);
      }, 1500);
    }, 2000);
  };

  const handleConfirmation = async () => {
    try {
      if (!user || !selectedDate || !selectedTimeSlot || !selectedConsultant) {
        throw new Error("Missing required booking information");
      }

      // Get the selected time slot
      const timeSlot = timeSlots.find((slot) => slot.id === selectedTimeSlot);
      if (!timeSlot) throw new Error("Invalid time slot");

      // Create the booking in Supabase
      const { error } = await supabase.from("support_sessions").insert({
        user_id: user.id,
        consultant_id: selectedConsultant,
        session_type: consultationType,
        duration: selectedDuration,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: timeSlot.time,
        is_free:
          selectedDuration === 30 && isPremium && freeConsultationAvailable,
        status: "confirmed",
        notes: document.getElementById("description")?.value || "",
      });

      if (error) throw error;

      // Mark the time slot as booked
      await supabase
        .from("available_time_slots")
        .update({ is_booked: true })
        .eq("id", selectedTimeSlot);

      // Reset selections
      setConfirmationOpen(false);
      setSelectedDate(new Date());
      setSelectedTimeSlot(null);
      setSelectedConsultant(null);
      setSelectedDuration(60);
    } catch (err) {
      console.error("Error finalizing booking:", err);
      // Continue with UI flow even if database update fails
      setConfirmationOpen(false);
      setSelectedDate(new Date());
      setSelectedTimeSlot(null);
      setSelectedConsultant(null);
      setSelectedDuration(60);
    }
  };

  return (
    <div className="w-full h-full bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Schedule Support Consultation</h1>
          {isPremium && (
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-md">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Premium Member</span>
              {freeConsultationAvailable ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-500"
                >
                  {freeConsultationsRemaining} Free Consultation
                  {freeConsultationsRemaining !== 1 ? "s" : ""} Available
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-500"
                >
                  No Free Consultations Left
                </Badge>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="hr" onValueChange={setConsultationType}>
          <TabsList className="mb-6">
            <TabsTrigger value="hr">HR Advocate</TabsTrigger>
            <TabsTrigger value="legal">Legal Support</TabsTrigger>
          </TabsList>

          <TabsContent value="hr" className="space-y-6">
            <p className="text-muted-foreground">
              Schedule a confidential consultation with an HR advocate who can
              provide guidance on workplace issues, policy interpretations, and
              career development strategies.
            </p>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <p className="text-muted-foreground">
              Connect with a legal consultant specializing in employment law to
              discuss workplace legal concerns, contract reviews, or potential
              disputes.
            </p>
          </TabsContent>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Calendar Section */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>
                  Choose your preferred consultation date and available time
                  slot
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date() || date > addDays(new Date(), 30)
                    }
                    className="rounded-md border"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Available Time Slots
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Label>Duration:</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={
                            selectedDuration === 30 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedDuration(30)}
                          className={
                            isPremium && freeConsultationAvailable
                              ? "border-green-500"
                              : ""
                          }
                        >
                          30 min
                          {isPremium && freeConsultationAvailable && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-green-100 text-green-800 border-green-500"
                            >
                              Free
                            </Badge>
                          )}
                        </Button>
                        <Button
                          variant={
                            selectedDuration === 60 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedDuration(60)}
                        >
                          60 min ($99)
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots
                        .filter((slot) => slot.duration === selectedDuration)
                        .map((slot) => (
                          <Button
                            key={slot.id}
                            variant={
                              selectedTimeSlot === slot.id
                                ? "default"
                                : "outline"
                            }
                            className="justify-start"
                            disabled={!slot.available}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                          >
                            {slot.time}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Select Consultant
                </CardTitle>
                <CardDescription>
                  Choose a{" "}
                  {consultationType === "hr"
                    ? "HR advocate"
                    : "legal consultant"}{" "}
                  for your session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredConsultants.map((consultant) => (
                  <div
                    key={consultant.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedConsultant === consultant.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
                    onClick={() => setSelectedConsultant(consultant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img
                          src={consultant.avatar}
                          alt={consultant.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{consultant.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {consultant.specialization}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Consultation Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Consultation Details
              </CardTitle>
              <CardDescription>
                Provide additional information about your consultation request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Consultation Topic</Label>
                <Select>
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workplace-issue">
                      Workplace Issue
                    </SelectItem>
                    <SelectItem value="policy-question">
                      Policy Question
                    </SelectItem>
                    <SelectItem value="career-development">
                      Career Development
                    </SelectItem>
                    <SelectItem value="contract-review">
                      Contract Review
                    </SelectItem>
                    <SelectItem value="dispute">Workplace Dispute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brief Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide a brief description of what you'd like to discuss..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Preferred Contact Method</Label>
                <Select>
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="chat">Secure Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleScheduleAppointment}
                disabled={
                  !selectedDate || !selectedTimeSlot || !selectedConsultant
                }
              >
                Schedule Appointment
              </Button>
            </CardFooter>
          </Card>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Your Booking</DialogTitle>
              <DialogDescription>
                Please complete payment to schedule your consultation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Consultation Type:</span>
                    <span>
                      {consultationType === "hr"
                        ? "HR Advocate"
                        : "Legal Consultant"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{selectedDuration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : ""}{" "}
                      at{" "}
                      {selectedTimeSlot
                        ? timeSlots.find((slot) => slot.id === selectedTimeSlot)
                            ?.time
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>${selectedDuration === 30 ? 49.5 : 99}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={paymentProcessing}>
                {paymentProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : paymentSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Payment Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay ${selectedDuration === 30 ? 49.5 : 99}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Confirmed</DialogTitle>
              <DialogDescription>
                Your consultation has been scheduled successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMMM d, yyyy")
                    : ""}{" "}
                  at{" "}
                  {selectedTimeSlot
                    ? timeSlots.find((slot) => slot.id === selectedTimeSlot)
                        ?.time
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: {selectedDuration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedConsultant
                    ? consultants.find((c) => c.id === selectedConsultant)?.name
                    : ""}{" "}
                  (
                  {consultationType === "hr"
                    ? "HR Advocate"
                    : "Legal Consultant"}
                  )
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>
                  You will receive a calendar invitation with connection details
                  shortly.
                </span>
              </div>
              {selectedDuration === 30 && isPremium && (
                <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">
                    {freeConsultationAvailable
                      ? `Your free consultation has been used. You have ${Math.max(0, freeConsultationsRemaining - 1)} remaining.`
                      : "You've used all your free consultations for this month."}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmation}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SupportScheduler;
