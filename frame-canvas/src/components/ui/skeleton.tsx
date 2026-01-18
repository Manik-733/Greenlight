import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "poster";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "h-4 w-full",
    card: "h-64 w-full rounded-lg",
    text: "h-4 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    poster: "aspect-[2/3] w-full rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-muted",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
