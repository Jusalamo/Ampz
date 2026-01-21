import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ampzButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ampz-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-ampz-active active:scale-[0.98] active:bg-ampz-active shadow-ampz-button",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "gradient-primary text-white hover:opacity-90 active:scale-[0.98] shadow-ampz-glow",
      },
      size: {
        default: "h-11 px-5 py-2 text-sm rounded-ampz-md",
        sm: "h-9 px-3 text-xs rounded-ampz-sm",
        lg: "h-12 px-8 text-base rounded-ampz-md",
        icon: "h-10 w-10 rounded-ampz-md",
        iconSm: "h-8 w-8 rounded-ampz-sm",
        iconLg: "h-12 w-12 rounded-ampz-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface AmpzButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ampzButtonVariants> {
  asChild?: boolean;
}

const AmpzButton = React.forwardRef<HTMLButtonElement, AmpzButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(ampzButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
AmpzButton.displayName = "AmpzButton";

export { AmpzButton, ampzButtonVariants };
