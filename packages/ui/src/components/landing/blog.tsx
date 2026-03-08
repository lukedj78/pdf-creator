"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@workspace/ui/components/badge";

export interface BlogPost {
  title: string;
  date: string;
  href: string;
}

const cardBgs = [
  "bg-neutral-900 dark:bg-neutral-800",
  "bg-neutral-800 dark:bg-neutral-700",
  "bg-neutral-900 dark:bg-neutral-800",
  "bg-neutral-800 dark:bg-neutral-700",
] as const;

const Blog = ({
  posts,
  badge = "Blog",
  heading = "Latest articles",
  description = "Stay up to date with the latest news, tips, and insights from our team.",
}: {
  posts: BlogPost[];
  badge?: string;
  heading?: string;
  description?: string;
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section ref={sectionRef}>
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-16">
            {/* Header row — left: badge + heading, right: description */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: -10, opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
              <div className="flex flex-col gap-4">
                <Badge
                  variant="outline"
                  className="px-3 py-1 h-auto text-sm w-fit"
                >
                  {badge}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-1px]">
                  {heading}
                </h2>
              </div>
              <p className="text-base text-muted-foreground max-w-md md:text-right">
                {description}
              </p>
            </motion.div>

            {/* Posts grid — 4 cols on lg, first post spans 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.map((post, index) => (
                <motion.a
                  key={index}
                  href={post.href}
                  initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                  animate={
                    isInView
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : { opacity: 0, y: 30, filter: "blur(4px)" }
                  }
                  transition={{
                    duration: 0.8,
                    delay: 0.15 + index * 0.1,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className={`group flex flex-col gap-4 ${
                    index === 0 ? "sm:col-span-2" : ""
                  }`}
                >
                  {/* Image placeholder */}
                  <div className="overflow-hidden rounded-xl border">
                    <div
                      className={`${cardBgs[index % cardBgs.length]} w-full aspect-video transition-transform duration-500 group-hover:scale-110`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">
                      {post.date}
                    </span>
                    <h3 className="text-2xl font-semibold tracking-tight group-hover:underline underline-offset-4">
                      {post.title}
                    </h3>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Blog };
export default Blog;
