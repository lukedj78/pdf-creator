"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, ZapIcon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

type PricingPlan = {
  plan_name: string;
  plan_descp: string;
  plan_price: string;
  plan_period: string;
  plan_feature: string[];
  plan_recommended: boolean;
  plan_cta: string;
  plan_href: string;
};

const pricingData: PricingPlan[] = [
  {
    plan_name: "Free",
    plan_descp:
      "For personal projects and testing. Full API access with generous limits.",
    plan_price: "$0",
    plan_period: "forever",
    plan_feature: [
      "100 spec exports / month",
      "3 templates",
      "REST API access",
      "TypeScript SDK",
      "Community support",
    ],
    plan_recommended: false,
    plan_cta: "Get Started",
    plan_href: "/register",
  },
  {
    plan_name: "Pro",
    plan_descp:
      "For teams and production workloads. Everything you need to scale.",
    plan_price: "$29",
    plan_period: "/ month",
    plan_feature: [
      "5,000 spec exports / month",
      "Unlimited templates",
      "AI template generation",
      "Webhook notifications",
      "Priority support",
      "Team management (5 members)",
      "Generation history & analytics",
    ],
    plan_recommended: true,
    plan_cta: "Start Free Trial",
    plan_href: "/register?plan=pro",
  },
  {
    plan_name: "Enterprise",
    plan_descp:
      "For large organizations with custom needs. Dedicated support and SLA.",
    plan_price: "Custom",
    plan_period: "",
    plan_feature: [
      "Unlimited spec exports",
      "Unlimited templates & team members",
      "Custom SLA & uptime guarantee",
      "Dedicated support engineer",
      "SSO / SAML integration",
      "On-premise deployment option",
      "Custom contracts & invoicing",
    ],
    plan_recommended: false,
    plan_cta: "Contact Sales",
    plan_href: "/contact",
  },
];

const Pricing = () => {
  const pricingCardVariants = {
    hidden: {
      opacity: 0,
      x: -60,
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.25,
        duration: 0.6,
        ease: "easeInOut" as const,
      },
    }),
  };

  return (
    <section className="bg-background py-10 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 items-center justify-center w-full">
          <div className="flex flex-col gap-4 justify-center items-center">
            <Badge
              variant={"outline"}
              className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7"
            >
              Pricing
            </Badge>
            <div className="max-w-3xs sm:max-w-md mx-auto text-center">
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                Simple, transparent pricing
              </h2>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full w-full">
            {pricingData.map((plan: PricingPlan, index: number) => {
              const isFeatured = plan.plan_recommended;

              return (
                <motion.div
                  key={index}
                  variants={pricingCardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                  className={cn(
                    "relative flex-1 flex flex-col w-full",
                    isFeatured && "z-10 scale-102"
                  )}
                >
                  {isFeatured && (
                    <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
                      <div className="absolute -inset-full blur-xs animate-spin [animation-duration:2s] bg-conic from-neutral-400 via-neutral-600 to-neutral-400" />
                      <div className="absolute inset-0.5 rounded-2xl bg-card" />
                    </div>
                  )}

                  <Card
                    className={cn(
                      "relative flex-1 flex flex-col rounded-2xl p-8 gap-8",
                      isFeatured
                        ? "border-0 ring-0"
                        : "border border-border"
                    )}
                  >
                    <CardHeader className="p-0">
                      <div className="flex flex-col gap-3 self-stretch">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl font-medium text-primary">
                            {plan.plan_name}
                          </CardTitle>
                          {isFeatured && (
                            <Badge className="py-1 px-3 text-sm font-medium leading-5 w-fit h-7 flex items-center gap-1.5 [&>svg]:size-4!">
                              <HugeiconsIcon icon={ZapIcon} size={16} />{" "}
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base font-normal max-w-2x">
                          {plan.plan_descp}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 gap-8 p-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-foreground text-4xl sm:text-5xl font-medium">
                          {plan.plan_price}
                        </span>
                        {plan.plan_period && (
                          <span className="text-muted-foreground text-base font-normal">
                            {plan.plan_period}
                          </span>
                        )}
                      </div>

                      <Separator orientation="horizontal" />

                      <ul className="flex flex-col gap-4 flex-1">
                        {plan.plan_feature.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-3 text-base font-normal text-muted-foreground"
                          >
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              size={16}
                              className="text-primary shrink-0"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full h-12 cursor-pointer"
                        variant={isFeatured ? "default" : "outline"}
                        nativeButton={false}
                        render={<a href={plan.plan_href} />}
                      >
                        {plan.plan_cta}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing };
export default Pricing;
