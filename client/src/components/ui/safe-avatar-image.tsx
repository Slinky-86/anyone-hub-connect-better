import { AvatarImage } from "@/components/ui/avatar";
import { ComponentPropsWithoutRef } from "react";

// This is a wrapper component for AvatarImage that safely handles null or undefined src values
export function SafeAvatarImage({ 
  src, 
  ...props 
}: Omit<ComponentPropsWithoutRef<typeof AvatarImage>, 'src'> & { 
  src: string | null | undefined 
}) {
  // Only pass src if it's a non-empty string
  return <AvatarImage src={src || undefined} {...props} />;
}