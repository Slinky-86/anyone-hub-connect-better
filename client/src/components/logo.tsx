import { cn } from "@/lib/utils";
import logoSvg from "@/assets/logo.svg";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={logoSvg} 
        alt="anyone-connect logo" 
        className={cn("mr-2", sizeClasses[size])}
      />
      {showText && (
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
          anyone-connect
        </span>
      )}
    </div>
  );
}