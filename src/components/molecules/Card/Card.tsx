import * as React from "react";
import {
  Card as BaseCard,
  CardHeader as BaseCardHeader,
  CardContent as BaseCardContent,
  CardFooter as BaseCardFooter,
  CardTitle as BaseCardTitle,
  CardDescription as BaseCardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CardProps extends React.ComponentProps<typeof BaseCard> {
  variant?: "default" | "highlight";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <BaseCard
      ref={ref}
      className={cn(
        variant === "default"
          ? "border border-[rgba(38,41,29,0.08)] bg-default text-text-default rounded-md"
          : "border border-transparent bg-accent-yellow text-text-default rounded-md",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<React.ElementRef<typeof BaseCardHeader>, React.ComponentProps<typeof BaseCardHeader>>(
  ({ className, ...props }, ref) => (
    <BaseCardHeader ref={ref} className={cn("flex flex-col space-y-2 p-6 md:p-8", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<React.ElementRef<typeof BaseCardContent>, React.ComponentProps<typeof BaseCardContent>>(
  ({ className, ...props }, ref) => (
    <BaseCardContent ref={ref} className={cn("p-6 md:p-8 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<React.ElementRef<typeof BaseCardFooter>, React.ComponentProps<typeof BaseCardFooter>>(
  ({ className, ...props }, ref) => (
    <BaseCardFooter ref={ref} className={cn("flex items-center p-6 md:p-8 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef<React.ElementRef<typeof BaseCardTitle>, React.ComponentProps<typeof BaseCardTitle>>(
  ({ className, ...props }, ref) => (
    <BaseCardTitle ref={ref} className={cn("text-xl font-medium leading-tight text-text-default", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  React.ElementRef<typeof BaseCardDescription>,
  React.ComponentProps<typeof BaseCardDescription>
>(({ className, ...props }, ref) => (
  <BaseCardDescription ref={ref} className={cn("text-sm text-text-muted", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };

