import * as React from "react";
import { cn } from "@/lib/utils";

export type ProjectCardProps = {
  projectName: string;
  client: string;
  projectType: string;
  disabled?: boolean;
  variant?: "dark" | "light";
  fillColor?: "primary" | "secondary" | "yellow" | "dark" | "light" | "default";
  className?: string;
  onClick?: () => void;
};

export const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    {
      projectName,
      client,
      projectType,
      disabled = false,
      variant = "dark",
      fillColor = "default",
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDark = variant === "dark";
    const isLight = variant === "light";
    
    // Determine accent style (dark or light) based on fillColor
    const accentStyle: "dark" | "light" =
      fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
        ? "dark"
        : fillColor === "yellow" || fillColor === "light"
        ? "light"
        : isDark
        ? "dark"
        : "light";
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = React.useState({ rotateX: 0, rotateY: 0 });
    const [isHovered, setIsHovered] = React.useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => cardRef.current as HTMLDivElement);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate mouse position relative to card center
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate tilt angles (max 8 degrees for subtle effect)
        const maxTilt = 8;
        const rotateY = (mouseX / (rect.width / 2)) * maxTilt;
        const rotateX = -(mouseY / (rect.height / 2)) * maxTilt;

        setTilt({ rotateX, rotateY });
        setIsHovered(true);
      },
      [disabled]
    );

    const handleMouseLeave = React.useCallback(() => {
      setTilt({ rotateX: 0, rotateY: 0 });
      setIsHovered(false);
    }, []);

    // Build transform string
    const transform = isHovered && !disabled
      ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.02) translateY(-4px)`
      : undefined;

    return (
      <div
        ref={cardRef}
        className={cn(
          "relative rounded-3xl p-8 md:p-10 lg:p-12",
          "min-h-[280px] md:min-h-[320px]",
          "flex flex-col",
          "transition-all duration-300 ease-out",
          "cursor-pointer",
          // Background variants - only apply default if fillColor is "default"
          fillColor === "default" && isDark && "bg-neutral-900 text-[color:var(--neutral-50)]",
          fillColor === "default" && isLight && "bg-neutral-100 text-neutral-900",
          fillColor === "dark" && "bg-neutral-900 text-[color:var(--neutral-50)]",
          fillColor === "light" && "bg-neutral-100 text-neutral-900",
          // Add border based on accent style
          "border",
          // Default state: subtle shadow and elevation
          !disabled && "shadow-lg",
          // Hover state: enhanced shadow (transform handled inline)
          !disabled && isHovered && "shadow-2xl shadow-black/30",
          // Focus state for accessibility
          !disabled && [
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-neutral-400",
            "focus-visible:ring-offset-2",
            "focus-visible:ring-offset-neutral-900",
          ],
          // Disabled state
          disabled && [
            "opacity-40",
            "cursor-not-allowed",
            "pointer-events-none",
          ],
          className
        )}
        style={{
          transform,
          transformStyle: "preserve-3d",
          borderColor:
            accentStyle === "dark"
              ? "rgba(253, 249, 244, 0.2)" // light border for dark accent
              : "rgba(38, 41, 29, 0.2)", // dark border for light accent
          // Fill color background
          backgroundColor:
            fillColor === "primary"
              ? "rgb(231, 111, 81)" // accent-primary
              : fillColor === "secondary"
              ? "rgb(158, 200, 210)" // accent-secondary
              : fillColor === "yellow"
              ? "rgb(255, 248, 167)" // accent-yellow
              : fillColor === "dark"
              ? "rgb(38, 41, 29)" // dark
              : fillColor === "light"
              ? "rgb(253, 249, 244)" // light
              : undefined, // "default" uses className
          // Text color adjustments for colored fills
          color:
            fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
              ? "rgb(253, 249, 244)" // white text for dark/colored backgrounds
              : fillColor === "yellow" || fillColor === "light"
              ? "rgb(38, 41, 29)" // dark text for light/colored backgrounds
              : undefined, // "default" uses className
        }}
        onClick={disabled ? undefined : onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-disabled={disabled}
        role={onClick ? "button" : undefined}
        tabIndex={disabled ? -1 : onClick ? 0 : undefined}
        onKeyDown={
          onClick && !disabled
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        {...props}
      >
        {/* Gradient overlay based on accent style - only show when fillColor is default */}
        {fillColor === "default" && accentStyle === "dark" && (
          <>
            {/* Base dark gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 pointer-events-none" />
            {/* Light accent gradient overlay */}
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br via-transparent to-transparent pointer-events-none"
              style={{
                background: "linear-gradient(to bottom right, rgba(253, 249, 244, 0.1), transparent, transparent)",
              }}
            />
          </>
        )}
        {fillColor === "default" && accentStyle === "light" && (
          <>
            {/* Dark accent gradient overlay for light variant */}
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br via-transparent to-transparent pointer-events-none"
              style={{
                background: "linear-gradient(to bottom right, rgba(38, 41, 29, 0.05), transparent, transparent)",
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-[14.875rem] pb-16 md:pb-20 lg:pb-24">
          {/* Top content */}
          <div>
            {/* Project Name - main title */}
            <h3
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2",
                // Text color handled by inline style when fillColor is set
                fillColor === "default" && isDark && "text-[color:var(--neutral-50)]",
                fillColor === "default" && isLight && "text-neutral-900"
              )}
              style={
                fillColor !== "default"
                  ? {
                      color:
                        fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
                          ? "rgb(253, 249, 244)" // white text
                          : "rgb(38, 41, 29)", // dark text
                    }
                  : undefined
              }
            >
              {projectName}
            </h3>

            {/* Client - secondary label */}
            <p
              className={cn(
                "text-sm md:text-base font-medium",
                // Text color handled by inline style when fillColor is set
                fillColor === "default" && isDark && "text-neutral-400",
                fillColor === "default" && isLight && "text-neutral-600"
              )}
              style={
                fillColor !== "default"
                  ? {
                      color:
                        fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
                          ? "rgba(253, 249, 244, 0.7)" // white text with opacity
                          : "rgba(38, 41, 29, 0.7)", // dark text with opacity
                    }
                  : undefined
              }
            >
              {client}
            </p>
          </div>

          {/* Project Type - meta label at bottom left with accent color - fixed position */}
          <div className="absolute bottom-0 left-0">
            <p
              className={cn(
                "text-xs md:text-sm uppercase tracking-wider font-medium"
              )}
              style={{
                color:
                  // Use accent style to determine project type color
                  accentStyle === "dark"
                    ? fillColor === "default" && isDark
                      ? "rgba(253, 249, 244, 0.8)" // light text with opacity for dark default
                      : "rgba(253, 249, 244, 0.9)" // light text for dark accent
                    : fillColor === "default" && isLight
                    ? "rgba(38, 41, 29, 0.8)" // dark text with opacity for light default
                    : "rgba(38, 41, 29, 0.9)", // dark text for light accent
              }}
            >
              {projectType}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

