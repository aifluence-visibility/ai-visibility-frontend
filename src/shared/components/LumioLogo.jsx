import React from "react";

/**
 * Lumio brand logo — modern V-style gradient mark with wordmark.
 * Blue → Cyan → Green gradient, dark mode native.
 */

export function LumioMark({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="lumio-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="lumio-inner" x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lumio-grad)" />
      {/* Abstract "L" / light ray mark */}
      <path
        d="M10 8L10 20L14 20L14 24L24 14L20 14L20 8L10 8Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M12 10L12 18L16 18L16 22L22 14.5L18 14.5L18 10L12 10Z"
        fill="url(#lumio-inner)"
        fillOpacity="0.3"
      />
    </svg>
  );
}

export function LumioWordmark({ className = "" }) {
  return (
    <span className={`text-base font-bold tracking-tight text-white ${className}`}>
      Lumio
    </span>
  );
}

export function LumioLogoFull({ size = 32, className = "", gap = "gap-2.5" }) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <LumioMark size={size} />
      <LumioWordmark />
    </div>
  );
}

export default LumioLogoFull;
