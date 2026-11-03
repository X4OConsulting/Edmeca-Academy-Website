import { useState } from "react";
import { useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { contactService } from "@/lib/services";
import { AUDIENCES, OFFERINGS, type AudienceValue } from "@/data/offerings";
import { Mail, MapPin, Calendar, Loader2, CheckCircle2 } from "lucide-react";

const NO_OFFERING = "none";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  audienceType: z.enum(AUDIENCES.map((a) => a.value) as [AudienceValue, ...AudienceValue[]], {
    errorMap: () => ({ message: "Please choose the option that fits best" }),
  }),
  offering: z.string(),
  message: z.string().min(10, "Please provide more details about your inquiry"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Presets from links elsewhere on the site: ?offering=<slug> and ?subject=<text> (Login, /signup).
  const params = new URLSearchParams(useSearch());
  const presetOffering = OFFERINGS.find((o) => o.slug === params.get("offering"))?.slug ?? NO_OFFERING;
  const presetSubject = params.get("subject")?.slice(0, 80);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      audienceType: undefined,
      offering: presetOffering,
      message: presetSubject ? `${presetSubject}: ` : "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      // Saved to the database and emailed to the team by /api/contact.
      return contactService.submitContactForm({
        name: data.name,
        email: data.email,
        company: data.company || null,
        audienceType: data.audienceType,
        offering: data.offering === NO_OFFERING ? null : data.offering,
        message: data.message,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Message sent",
        description: "We will reply within one business day.",
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or email info@edmeca.co.za.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    mutation.mutate(data);
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Let's talk about your programme.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Tell us who you are and what you need. We reply within one business day, and a proposal follows within
            five working days of a discovery call.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-brand-green-deep" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Thank you</h2>
                  <p className="mt-2 text-muted-foreground">
                    Your message has been received. We will reply within one business day.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-2xl font-bold mb-6 tracking-tight">Send us a message</h2>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} data-testid="input-name" />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organisation (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company, programme or institution" {...field} data-testid="input-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="audienceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am...</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                                className="grid sm:grid-cols-2 gap-3"
                              >
                                {AUDIENCES.map((audience) => (
                                  <div key={audience.value} className="flex items-start space-x-2">
                                    <RadioGroupItem
                                      value={audience.value}
                                      id={`audience-${audience.value}`}
                                      className="mt-0.5"
                                      data-testid={`radio-${audience.value}`}
                                    />
                                    <Label htmlFor={`audience-${audience.value}`} className="font-normal leading-snug">
                                      {audience.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offering"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offering of interest (optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-offering">
                                  <SelectValue placeholder="Choose an offering" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={NO_OFFERING}>Not sure yet</SelectItem>
                                {OFFERINGS.map((offering) => (
                                  <SelectItem key={offering.slug} value={offering.slug}>
                                    {offering.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How can we help?</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your programme, your participants and what you need."
                                className="min-h-32 resize-none"
                                {...field}
                                data-testid="input-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        variant="cta"
                        size="lg"
                        className="w-full sm:w-auto"
                        disabled={mutation.isPending}
                        data-testid="button-submit"
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send message"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary text-primary">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href="mailto:info@edmeca.co.za" className="text-sm text-primary mt-1 inline-block hover:underline">
                      info@edmeca.co.za
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary text-primary">
                    <Calendar className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Book a discovery call</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask for a discovery call in your message and we will reply with times that suit you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary text-primary">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Where we work</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      South Africa based, working with partners across Africa and Europe.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-secondary border border-border rounded-xl">
              <h3 className="font-semibold mb-2">Response time</h3>
              <p className="text-sm text-muted-foreground">
                We reply within one business day. A proposal follows within five working days of a discovery call.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
