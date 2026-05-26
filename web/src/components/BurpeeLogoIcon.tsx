import React from "react";
import Image from "next/image";

interface BurpeeLogoIconProps {
  size?: number;
  color?: string;
}

export default function BurpeeLogoIcon({
  size = 56,
  color, // Kept for prop compatibility, ignored in rendering
}: BurpeeLogoIconProps) {
  return (
    <Image
      src="/app-logo.png"
      alt="BurpeePacers Logo"
      width={size}
      height={size}
      priority
      style={{
        borderRadius: "24.4%",
        objectFit: "cover",
      }}
    />
  );
}
