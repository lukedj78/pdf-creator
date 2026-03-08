"use client";

import { useRef } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { motion, useInView } from "framer-motion";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const Testimonials = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section>
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-16">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col items-center justify-center gap-4 max-w-lg mx-auto"
            >
              <Badge variant={"outline"} className="px-3 py-1 h-auto text-sm">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-semibold text-center tracking-[-1px]">
                Trusted by development teams worldwide
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                Trusted by 500+ teams delivering production-grade documents
              </p>
            </motion.div>

            <div ref={ref} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Large quote card -- col-span-8 */}
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                  duration: 0.8,
                  delay: 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="md:col-span-8 rounded-2xl bg-card border border-border p-8 md:p-10 flex flex-col justify-between gap-8 min-h-[260px] transition-transform duration-300 hover:scale-[1.01]"
              >
                <blockquote className="text-lg md:text-xl font-normal leading-relaxed">
                  &ldquo;Pdf Creator cut our invoice processing from hours to
                  seconds. The API is incredibly well-designed and the
                  documentation makes onboarding new developers
                  effortless.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    AC
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Alex Chen</p>
                    <p className="text-sm text-muted-foreground">
                      CTO at Streamline
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Stats card -- col-span-4 */}
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="md:col-span-4 rounded-2xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-center gap-3 min-h-[260px] transition-transform duration-300 hover:scale-[1.01]"
              >
                <span className="text-5xl md:text-6xl font-bold tracking-tight">
                  99.9%
                </span>
                <p className="text-base font-normal opacity-90">Uptime</p>
                <p className="text-sm opacity-70 leading-relaxed">
                  API availability across all regions
                </p>
              </motion.div>

              {/* Small quote card -- col-span-4 */}
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="md:col-span-4 rounded-2xl bg-card border border-border p-8 md:p-10 flex flex-col justify-between gap-8 min-h-[260px] transition-transform duration-300 hover:scale-[1.01]"
              >
                <blockquote className="text-base font-normal leading-relaxed">
                  &ldquo;The TypeScript SDK made integration effortless. We were
                  exporting specs in production within a day.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    MR
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Maria Rossi</p>
                    <p className="text-sm text-muted-foreground">
                      Lead Developer at Nexus
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Large accent card -- col-span-8 */}
              <motion.div
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="md:col-span-8 rounded-2xl bg-card border border-border p-8 md:p-10 flex flex-col justify-between gap-8 min-h-[260px] transition-transform duration-300 hover:scale-[1.01]"
              >
                <blockquote className="text-lg md:text-xl font-normal leading-relaxed">
                  &ldquo;The visual editor is a game-changer. Our design team
                  can build templates without writing a single line of code,
                  while developers focus on integration.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-background border border-border text-sm font-semibold">
                    JW
                  </div>
                  <div>
                    <p className="text-sm font-semibold">James Walker</p>
                    <p className="text-sm text-muted-foreground">
                      VP of Engineering at Forge Labs
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Testimonials };
export default Testimonials;
