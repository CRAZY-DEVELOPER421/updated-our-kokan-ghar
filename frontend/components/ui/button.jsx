import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  const base = "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

  const variants = {
    default: "bg-[#2D6A4F] text-white hover:bg-[#1B4332]",
    outline: "border-[#EDE0CC] bg-white hover:bg-[#FAF7F0] hover:text-[#1C1C1E]",
    secondary: "bg-[#FAF7F0] text-[#1C1C1E] hover:bg-[#EDE0CC]",
    ghost: "hover:bg-[#FAF7F0] hover:text-[#1C1C1E]",
    destructive: "bg-[#DC2626]/10 text-[#DC2626] hover:bg-[#DC2626]/20",
    link: "text-[#2D6A4F] underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-8 gap-1.5 px-2.5",
    xs: "h-6 gap-1 px-2 text-xs",
    sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
    lg: "h-9 gap-1.5 px-2.5",
    icon: "size-8",
    "icon-sm": "size-7",
    "icon-lg": "size-9",
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    />
  );
}

export { Button };
