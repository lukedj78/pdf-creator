"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons";

const CTA = () => {
  return (
    <section>
      <div className="sm:py-20 py-8">
        <div className="max-w-7xl mx-auto sm:px-16 px-4">
          <div className="relative overflow-hidden min-h-96 flex items-center justify-center px-6 border border-border rounded-3xl">
            <motion.div
              initial={{ y: "5%", opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-col gap-6 items-center mx-auto"
            >
              <div className="flex flex-col gap-3 items-center text-center">
                <h2 className="text-3xl md:text-5xl font-medium">
                  Ready to generate your first PDF?
                </h2>
                <p className="max-w-2xl mx-auto text-muted-foreground">
                  Start building with our free tier. 100 generations per month,
                  full API access, no credit card required.
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex items-center gap-3 flex-wrap justify-center"
              >
                <Button
                  className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden hover:bg-primary/80 cursor-pointer"
                  nativeButton={false}
                  render={<a href="/register" />}
                >
                  <span className="relative z-10 transition-all duration-500">
                    Get Started Free
                  </span>
                  <div className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-12 px-6 gap-2 cursor-pointer"
                  nativeButton={false}
                  render={<a href="/docs" />}
                >
                  <HugeiconsIcon icon={BookOpen01Icon} size={16} />
                  View Documentation
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { CTA };
export default CTA;
