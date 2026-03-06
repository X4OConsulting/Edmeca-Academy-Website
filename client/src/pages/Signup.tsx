import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, ShieldCheck, Users, Lightbulb } from "lucide-react";

const signupFormSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("A valid email address is required"),
  phone: z.string().optional(),
  organisation: z.string().optional(),
  interestType: z.enum(["entrepreneur", "programme", "other"]),
  motivation: z
    .string()
    .min(20, "Please tell us a little more — at least 20 characters"),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function Signup() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      organisation: "",
      interestType: "entrepreneur",
      motivation: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const formData = new FormData();
      formData.append("form-name", "signup");
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone || "");
      formData.append("organisation", data.organisation || "");
      formData.append("interestType", data.interestType);
      formData.append("motivation", data.motivation);

      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (!response.ok) throw new Error("Submission failed");

      setSubmitted(true);
      toast({
        title: "Application received!",
        description:
          "We'll review your details and be in touch within 2–3 business days.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us at Info@edmeca.co.za.",
        variant: "destructive",
      });
    }
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Apply for Access
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              EdMeCa Academy is currently invite-only. Submit your application
              below and our team will review it. If approved, we'll send your
              login details directly to your email.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Application Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold">
                    Application Submitted!
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Thank you for applying. Our team will review your application
                    and send your login credentials to{" "}
                    <span className="font-medium text-foreground">
                      {form.getValues("email")}
                    </span>{" "}
                    if approved. Expect to hear from us within 2–3 business
                    days.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-serif text-2xl font-bold mb-2">
                    Access Application
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    All fields marked * are required.
                  </p>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      {/* Name + Email */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your full name"
                                  {...field}
                                  data-testid="input-signup-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="you@example.com"
                                  {...field}
                                  data-testid="input-signup-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Phone + Organisation */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+27 xx xxx xxxx"
                                  {...field}
                                  data-testid="input-signup-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="organisation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organisation (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Company or programme"
                                  {...field}
                                  data-testid="input-signup-organisation"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Interest Type */}
                      <FormField
                        control={form.control}
                        name="interestType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am applying as... *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="entrepreneur"
                                    id="signup-entrepreneur"
                                    data-testid="radio-signup-entrepreneur"
                                  />
                                  <Label
                                    htmlFor="signup-entrepreneur"
                                    className="font-normal"
                                  >
                                    An Entrepreneur
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="programme"
                                    id="signup-programme"
                                    data-testid="radio-signup-programme"
                                  />
                                  <Label
                                    htmlFor="signup-programme"
                                    className="font-normal"
                                  >
                                    A Programme / Incubator
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="other"
                                    id="signup-other"
                                    data-testid="radio-signup-other"
                                  />
                                  <Label
                                    htmlFor="signup-other"
                                    className="font-normal"
                                  >
                                    Other
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Motivation */}
                      <FormField
                        control={form.control}
                        name="motivation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Why do you want access to EdMeCa Academy? *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your goals, challenges, or what you hope to achieve with EdMeCa's tools and frameworks..."
                                className="min-h-32 resize-none"
                                {...field}
                                data-testid="input-signup-motivation"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full sm:w-auto"
                        disabled={form.formState.isSubmitting}
                        data-testid="button-signup-submit"
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Invite-Only Access</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      EdMeCa Academy is currently invite-only to ensure every
                      member gets the support they need. We review each
                      application personally.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Who Is This For?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Entrepreneurs building scalable ideas, and programmes or
                      incubators looking for structured frameworks to support
                      their cohorts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">What Happens Next?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Once approved, you'll receive an email with your login
                      credentials. You'll have immediate access to the full
                      EdMeCa portal — BMC tool, pitch builder, financial
                      analysis, and more.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
              <h3 className="font-semibold mb-2">Review Time</h3>
              <p className="text-sm text-muted-foreground">
                Applications are reviewed within 2–3 business days. If you have
                an urgent need, mention it in your motivation and we'll do our
                best to prioritise.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
