"use client";

import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

// Premium easing (typed as tuple for framer-motion)
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: "lift" | "scale" | "glow" | "none";
  delay?: number;
  onClick?: () => void;
}

/**
 * Premium animated card with smooth hover effects
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverEffect = "lift", delay = 0, onClick }, ref) => {
    const hoverVariants = {
      lift: {
        y: -4,
        boxShadow:
          "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
      },
      scale: {
        scale: 1.02,
        boxShadow:
          "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
      },
      glow: {
        boxShadow:
          "0 0 30px -5px hsl(var(--primary) / 0.3), 0 10px 20px -10px rgba(0, 0, 0, 0.2)",
      },
      none: {},
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay,
          ease: easeOutExpo,
        }}
        whileHover={hoverVariants[hoverEffect]}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "rounded-xl border bg-card p-6 shadow-sm transition-colors",
          "will-change-transform cursor-pointer",
          className
        )}
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

/**
 * Animated stat card with counter
 */
interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  className?: string;
}

export function AnimatedStatCard({
  title,
  value,
  icon,
  trend,
  delay = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: easeOutExpo,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2, ease: easeOutExpo },
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6",
        "shadow-sm hover:shadow-lg transition-shadow duration-300",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          {icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              {icon}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.2, ease: easeOutExpo }}
          className="text-3xl font-bold tracking-tight"
        >
          {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
        </motion.div>

        {trend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
            className={cn(
              "mt-2 text-sm font-medium flex items-center gap-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground ml-1">geçen aya göre</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Animated list item
 */
interface AnimatedListItemProps {
  children: ReactNode;
  index?: number;
  className?: string;
  onClick?: () => void;
}

export function AnimatedListItem({
  children,
  index = 0,
  className,
  onClick,
}: AnimatedListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: easeOutExpo,
      }}
      whileHover={{
        x: 4,
        backgroundColor: "hsl(var(--muted) / 0.5)",
        transition: { duration: 0.15 },
      }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated button with ripple effect
 */
interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "primary" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  variant = "default",
  onClick,
  disabled,
}: AnimatedButtonProps) {
  const variants = {
    default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.15, ease: easeOutExpo }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden px-4 py-2 rounded-lg font-medium",
        "transition-colors duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export default AnimatedCard;

