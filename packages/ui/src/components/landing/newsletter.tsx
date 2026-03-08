"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

const Newsletter = () => {
  return (
    <section>
      <div className="sm:py-20 py-8">
        <div className="max-w-7xl mx-auto sm:px-16 px-4">
          <div className="border border-border rounded-3xl py-24 overflow-hidden">
            <div className="flex flex-col items-center gap-6 max-w-xl mx-auto px-6 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="text-3xl md:text-5xl font-medium"
              >
                Stay in the loop
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="text-muted-foreground"
              >
                Get notified about product updates, new features, and tips to
                get the most out of your PDF workflows.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.2,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="text-sm text-muted-foreground/70 font-medium"
              >
                Join 10,000+ developers
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="w-full max-w-md"
              >
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center gap-2 bg-background rounded-full border p-1.5"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-4"
                  />
                  <Button
                    className="rounded-full h-10 w-10 shrink-0 cursor-pointer"
                    size="icon"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Newsletter };
export default Newsletter;
