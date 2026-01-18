import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        // Status variants for credits
        verified: "border-status-verified/30 bg-status-verified/20 text-status-verified",
        pending: "border-status-pending/30 bg-status-pending/20 text-status-pending",
        unclaimed: "border-status-unclaimed/30 bg-status-unclaimed/20 text-status-unclaimed",
        rejected: "border-status-rejected/30 bg-status-rejected/20 text-status-rejected",
        disputed: "border-status-disputed/30 bg-status-disputed/20 text-status-disputed",
        // Genre/type badges
        genre: "border-border/50 bg-card text-cream-dim hover:bg-secondary",
        gold: "border-primary/30 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
