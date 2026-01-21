import * as React from "react";
import { cn } from "@/lib/utils";

interface AmpzCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "surface";
  interactive?: boolean;
}

const AmpzCard = React.forwardRef<HTMLDivElement, AmpzCardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => {
    const variants = {
      default: "bg-card border border-border/20 rounded-ampz-lg shadow-ampz-card",
      glass: "glass-card",
      surface: "ampz-surface",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          interactive && "ampz-interactive cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);
AmpzCard.displayName = "AmpzCard";

const AmpzCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
AmpzCardHeader.displayName = "AmpzCardHeader";

const AmpzCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
AmpzCardTitle.displayName = "AmpzCardTitle";

const AmpzCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AmpzCardDescription.displayName = "AmpzCardDescription";

const AmpzCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
AmpzCardContent.displayName = "AmpzCardContent";

const AmpzCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
AmpzCardFooter.displayName = "AmpzCardFooter";

export {
  AmpzCard,
  AmpzCardHeader,
  AmpzCardFooter,
  AmpzCardTitle,
  AmpzCardDescription,
  AmpzCardContent,
};
