import type { Transition, Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Spring presets
// ---------------------------------------------------------------------------

export const spring = {
  /** General-purpose spring (modals, cards, panels). */
  default: { type: "spring", stiffness: 300, damping: 30 } as const,

  /** Subtle motion (tooltips, reveals, overlays). */
  gentle: { type: "spring", stiffness: 200, damping: 24 } as const,

  /** Playful motion (buttons, micro-interactions, toggles). */
  bouncy: { type: "spring", stiffness: 400, damping: 25 } as const,

  /** Reactive feedback (input glow, typing speed, progress). */
  snappy: { type: "spring", stiffness: 420, damping: 32 } as const,

  /** Micro-interactions — low damping for perceptible bounce. */
  micro: { type: "spring", stiffness: 400, damping: 17 } as const,

  /** Instant toggle — high stiffness for switches and binary state changes. */
  toggle: { type: "spring", stiffness: 700, damping: 30 } as const,

  /** Layout transitions (layoutId, tabs indicator). */
  layout: { type: "spring", duration: 0.4, bounce: 0.15 } as const,
} satisfies Record<string, Transition>;

// ---------------------------------------------------------------------------
// Transition presets
// ---------------------------------------------------------------------------

export const transition = {
  /** Fast ease-out for simple fades and slides. */
  fast: { duration: 0.2, ease: "easeOut" } as const,

  /** Standard ease-out for content transitions. */
  normal: { duration: 0.35, ease: "easeOut" } as const,

  /** Slower ease-out for section entrances and hero reveals. */
  slow: { duration: 0.5, ease: "easeOut" } as const,

  /** Stagger container — wraps children with configurable delay. */
  stagger: (delay = 0.08) =>
    ({ staggerChildren: delay, delayChildren: 0.05 }) as const,
} satisfies Record<string, Transition | ((...args: never[]) => unknown)>;

// ---------------------------------------------------------------------------
// Variants — composable building blocks for motion.div usage.
// Every pair uses "hidden" -> "visible" keys.
// ---------------------------------------------------------------------------

/** Fade + slide-up — use with `whileInView` for scroll reveal. */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring.default },
  },
};

/** Stagger container — pair with any item variant as children. */
export function staggerContainer(staggerDelay = 0.08): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
    },
  };
}

/** Stagger child — fade + slide-up (small offset for list items). */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle },
  },
};

/** Scale-in from center — for modals, dialogs, popovers. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...spring.default },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/** Slide from a direction — use for sheets, panels, drawers. */
export function slideIn(
  direction: "left" | "right" | "up" | "down" = "right",
  distance = 24,
): Variants {
  const isHorizontal = direction === "left" || direction === "right";
  const sign = direction === "right" || direction === "down" ? 1 : -1;
  const offset = distance * sign;

  if (isHorizontal) {
    return {
      hidden: { opacity: 0, x: offset },
      visible: { opacity: 1, x: 0, transition: { ...spring.default } },
      exit: {
        opacity: 0,
        x: offset,
        transition: { duration: 0.15, ease: "easeIn" as const },
      },
    };
  }

  return {
    hidden: { opacity: 0, y: offset },
    visible: { opacity: 1, y: 0, transition: { ...spring.default } },
    exit: {
      opacity: 0,
      y: offset,
      transition: { duration: 0.15, ease: "easeIn" as const },
    },
  };
}

/** Simple fade — for overlays, backdrops, empty states. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Hover / Tap presets
// ---------------------------------------------------------------------------

export const hover = {
  /** Subtle lift for cards and list items. */
  lift: { y: -2, transition: spring.gentle },

  /** Gentle scale for clickable cards. */
  scale: { scale: 1.02, transition: spring.micro },

  /** Combined lift + shadow hint for interactive cards. */
  card: { y: -4, scale: 1.01, transition: spring.gentle },
} as const;

export const tap = {
  /** Press-down for buttons and clickable elements. */
  press: { scale: 0.97 },

  /** Deeper press for primary actions. */
  deep: { scale: 0.95 },
} as const;

export const scale = {
  subtle: {
    hover: { scale: 1.02, transition: spring.micro },
    tap: { scale: 0.98 },
  },
  standard: {
    hover: { scale: 1.05, transition: spring.micro },
    tap: { scale: 0.95 },
  },
  dramatic: {
    hover: { scale: 1.1, transition: spring.micro },
    tap: { scale: 0.9 },
  },
} as const;

// ---------------------------------------------------------------------------
// Keyframe patterns
// ---------------------------------------------------------------------------

export const keyframes = {
  pulse: { scale: [1, 1.3, 1] },
  shake: { x: [0, -3, 3, -3, 3, 0] },
  ring: { rotate: [0, -15, 15, -10, 10, -5, 5, 0] },
} as const;

export const timing = {
  pulse: { duration: 0.3, ease: "easeInOut" } as const,
  shake: { duration: 0.4, ease: "easeInOut" } as const,
  ring: { duration: 0.6, ease: "easeInOut" } as const,
} as const;

// ---------------------------------------------------------------------------
// Viewport config — reusable `viewport` prop for whileInView.
// ---------------------------------------------------------------------------

export const viewport = {
  once: { once: true, amount: 0.2 as const },
  onceAny: { once: true, amount: 0 as const },
  always: { once: false, amount: 0.3 as const },
} as const;

// ---------------------------------------------------------------------------
// Stagger delay helper
// ---------------------------------------------------------------------------

export function staggerDelay(index: number, base = 0.08): number {
  return index * base;
}

// ---------------------------------------------------------------------------
// Page-level variants
// ---------------------------------------------------------------------------

/** Container entrance: fade + scale-up with staggered children. */
export const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...spring.gentle,
      staggerChildren: 0.1,
    },
  },
};

/** Content swap: fade + slide from right. */
export const contentVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { ...spring.default },
  },
};

/** List/grid item: fade + slide-up. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle },
  },
};