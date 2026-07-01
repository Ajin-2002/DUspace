import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition",
        variant === "primary" &&
          "bg-[#0f3b5c] text-white hover:bg-[#1a5a7a]",
        variant === "secondary" &&
          "bg-gray-200 text-black hover:bg-gray-300",
        className
      )}
      {...props}
    />
  );
}