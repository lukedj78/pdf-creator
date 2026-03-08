"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

type Features = {
  icon: IconSvgElement;
  title: string;
  content: string;
}[];

const Feature = ({
  featureData,
  badge = "Features",
  heading = "Everything you need to create specs",
}: {
  featureData: Features;
  badge?: string;
  heading?: string;
}) => {
  const displayedFeatures = featureData.slice(0, 4);

  return (
    <section>
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-16">
            {/* Top section: Badge + heading on left, Button on right */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
            >
              <div className="flex flex-col items-start gap-4 max-w-lg">
                <Badge
                  variant={"outline"}
                  className="px-3 py-1 h-auto text-sm"
                >
                  {badge}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-1px]">
                  {heading}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  A complete platform for designing and exporting JSON specs
                  at scale — with a visual editor, powerful API,
                  and AI assistance.
                </p>
              </div>
              <div className="shrink-0">
                <Button variant="outline" size="lg" className="gap-2">
                  Explore all features
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Button>
              </div>
            </motion.div>

            {/* Bottom section: 2-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              {/* Left: Large testimonial card */}
              <motion.div
                initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="p-6 sm:p-16 rounded-2xl border border-border flex items-center"
              >
                <Card className="border-none shadow-none ring-0 bg-transparent">
                  <CardContent className="flex flex-col gap-8 px-0">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      SK
                    </div>
                    <h3 className="text-xl md:text-2xl font-normal leading-relaxed tracking-[-0.5px]">
                      &ldquo;Before Pdf Creator, we spent hours building
                      custom document solutions. Now we ship production-ready specs in
                      minutes with the visual editor and API.&rdquo;
                    </h3>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-0.5 px-0">
                    <p className="text-sm font-semibold">Sarah Kim</p>
                    <span className="text-sm text-muted-foreground">
                      Engineering Lead at Velocity
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Right: 2x2 feature grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                {displayedFeatures.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <Card className="py-8 ring-0 border border-border h-full">
                      <CardContent className="px-8 flex flex-col items-start gap-12 justify-between h-full">
                        <HugeiconsIcon
                          icon={value.icon}
                          size={28}
                          className="text-primary"
                        />
                        <div className="flex flex-col gap-2">
                          <h6 className="text-sm font-semibold">
                            {value.title}
                          </h6>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {value.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Feature };
export default Feature;
