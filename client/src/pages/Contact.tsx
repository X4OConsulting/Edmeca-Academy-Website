import { useState } from "react";
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
import { Mail, Phone, MapPin, Calendar, Loader2, CheckCircle2 } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  audienceType: z.enum(["entrepreneur", "programme", "other"]),
  message: z.string().min(10, "Please provide more details about your inquiry"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      audienceType: "entrepreneur",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      // Submit to Netlify Forms
      const formData = new FormData();
      formData.append('form-name', 'contact');
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('company', data.company || '');
      formData.append('audienceType', data.audienceType);
      formData.append('message', data.message);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us directly.",
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Let's Talk
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Whether you're an entrepreneur ready to accelerate your journey or a programme 
              seeking scalable solutions, we'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Thank You!</h2>
                  <p className="mt-2 text-muted-foreground">
                    Your message has been received. We'll get back to you within 24 hours.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-serif text-2xl font-bold mb-6">Send Us a Message</h2>
                  
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
                            <FormLabel>Company / Organization (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company or organization" {...field} data-testid="input-company" />
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
                                defaultValue={field.value}
                                className="flex flex-wrap gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="entrepreneur" id="entrepreneur" data-testid="radio-entrepreneur" />
                                  <Label htmlFor="entrepreneur" className="font-normal">An Entrepreneur</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="programme" id="programme" data-testid="radio-programme" />
                                  <Label htmlFor="programme" className="font-normal">A Programme / Incubator</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="other" id="other" data-testid="radio-other" />
                                  <Label htmlFor="other" className="font-normal">Other</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
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
                                placeholder="Tell us about your needs, goals, or questions..."
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
                          "Send Message"
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
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Info@edmeca.co.za
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Book a Call</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Schedule a 30-minute discovery call with our team.
                    </p>
                    <Button variant="outline" size="sm" data-testid="button-book-call">
                      Schedule Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Global Reach</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We work with entrepreneurs and programmes across Africa, 
                      Europe, and beyond.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours on business days. 
                For urgent matters, please indicate so in your message.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
