"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  SmartPhone01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";

const Contact = () => {
  return (
    <section className="bg-background py-10 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-0 items-start">
          {/* Left side - Info */}
          <div className="lg:col-span-6 flex flex-col gap-8 animate-in fade-in slide-in-from-left-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  We can help
                </span>
              </div>
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium leading-tight">
                Let&apos;s discuss your document creation needs
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                    <HugeiconsIcon
                      icon={SmartPhone01Icon}
                      size={20}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      Phone
                    </span>
                    <a
                      href="tel:+1234567890"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      size={20}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      Email
                    </span>
                    <a
                      href="mailto:support@pdfgenerator.dev"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      support@pdfgenerator.dev
                    </a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={20}
                    className="text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    Location
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Remote-first, worldwide
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Trusted by developers
              </span>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Right side - Form Card */}
          <div className="lg:col-span-5 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200 ease-in-out fill-mode-both">
            <Card className="rounded-2xl border border-border p-0">
              <CardHeader className="px-6 pt-6 pb-0 sm:px-8 sm:pt-8">
                <CardTitle className="text-xl font-medium text-foreground">
                  Start your project
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
                <form
                  className="flex flex-col gap-5"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* First Name */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="contact-first-name">First Name</Label>
                      <Input
                        id="contact-first-name"
                        name="firstName"
                        placeholder="John"
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="contact-last-name">Last Name</Label>
                      <Input
                        id="contact-last-name"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  {/* How did you hear about us */}
                  <div className="flex flex-col gap-2">
                    <Label>How did you hear about us?</Label>
                    <Select name="source">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      required
                      placeholder="Tell us about your project and requirements..."
                      className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 resize-none"
                    />
                  </div>

                  {/* Terms checkbox */}
                  <div className="flex items-start gap-2">
                    <Checkbox id="contact-terms" className="mt-0.5" />
                    <Label
                      htmlFor="contact-terms"
                      className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
                    >
                      I agree to the{" "}
                      <a
                        href="/terms"
                        className="text-foreground underline hover:no-underline"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy"
                        className="text-foreground underline hover:no-underline"
                      >
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 cursor-pointer mt-1"
                  >
                    Submit Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact };
export default Contact;
