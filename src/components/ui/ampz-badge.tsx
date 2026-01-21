import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ampzBadgeVariants = cva(
  "inline-flex items-center justify-center font-medium ampz-transition",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground bg-transparent",
        muted: "bg-muted text-muted-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-brand-green text-white",
        warning: "bg-brand-yellow text-black",
        // Pro/Max subscription badges
        pro: "gradient-pro text-white",
        max: "gradient-max text-black",
        // Featured star badge - yellow with black text (never recolor)
        featured: "bg-brand-yellow text-black",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs rounded-ampz-sm",
        sm: "px-2 py-0.5 text-[10px] rounded-ampz-sm",
        lg: "px-3 py-1 text-sm rounded-ampz-md",
        pill: "px-3 py-1 text-xs rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface AmpzBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ampzBadgeVariants> {}

const AmpzBadge = React.forwardRef<HTMLDivElement, AmpzBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(ampzBadgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
AmpzBadge.displayName = "AmpzBadge";

export { AmpzBadge, ampzBadgeVariants };
