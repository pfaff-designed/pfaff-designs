import * as React from "react";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/atoms/Heading";

export type ProjectCardProps = {
  projectName: string;
  client: string;
  role?: string;
  projectType: string;
  oneLiner?: string;
  disabled?: boolean;
  variant?: "dark" | "light";
  fillColor?: "primary" | "secondary" | "yellow" | "dark" | "light" | "default";
  backgroundImage?: string;
  className?: string;
  onClick?: () => void;
};

export const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    {
      projectName,
      client,
      role,
      projectType,
      oneLiner,
      disabled = false,
      variant = "dark",
      fillColor = "default",
      backgroundImage,
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

        // Calculate tilt angles (max 1.5 degrees for very subtle book-like effect)
        const maxTilt = 1.5;
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

    // Build transform string - very subtle book-like lift effect
    const transform = isHovered && !disabled
      ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.002) translateY(-1px)`
      : undefined;

    return (
      <div
        ref={cardRef}
        className={cn(
          "relative p-4",
          "w-full",
          "h-[400px] md:h-[480px]",
          "flex flex-col",
          "transition-all duration-500 ease-out",
          "cursor-pointer",
          // Background variants - only apply default if fillColor is "default"
          fillColor === "default" && isDark && "bg-neutral-900 text-[color:var(--neutral-50)]",
          fillColor === "default" && isLight && "bg-neutral-100 text-neutral-900",
          fillColor === "dark" && "bg-neutral-900 text-[color:var(--neutral-50)]",
          fillColor === "light" && "bg-neutral-100 text-neutral-900",
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
            "cursor-not-allowed",
            "pointer-events-none",
          ],
          className
        )}
        style={{
          transform,
          transformStyle: "preserve-3d",
          // Fill color background
          backgroundColor:
            fillColor === "primary"
              ? "var(--accent-primary)"
              : fillColor === "secondary"
              ? "var(--accent-secondary)"
              : fillColor === "yellow"
              ? "var(--accent-tertiary)"
              : fillColor === "dark"
              ? "var(--neutral-900)"
              : fillColor === "light"
              ? "var(--neutral-50)"
              : undefined, // "default" uses className
          // Text color adjustments for colored fills
          color:
            fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
              ? "var(--neutral-50)" // white text for dark/colored backgrounds
              : fillColor === "yellow" || fillColor === "light"
              ? "var(--neutral-900)" // dark text for light/colored backgrounds
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
        {/* Background image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        
        {/* Dark overlay for text readability when background image is present */}
        {backgroundImage && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b pointer-events-none",
            disabled 
              ? "from-black/50 via-black/45 to-black/55"
              : "from-neutral-900/25 via-neutral-900/20 to-neutral-900/30"
          )} />
        )}

        {/* Gradient overlay based on accent style - only show when fillColor is default and no background image */}
        {!backgroundImage && fillColor === "default" && accentStyle === "dark" && (
          <>
            {/* Base dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 pointer-events-none" />
            {/* Light accent gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-br via-transparent to-transparent pointer-events-none"
              style={{
                background: "linear-gradient(to bottom right, rgba(253, 249, 244, 0.1), transparent, transparent)",
              }}
            />
          </>
        )}
        {!backgroundImage && fillColor === "default" && accentStyle === "light" && (
          <>
            {/* Dark accent gradient overlay for light variant */}
            <div 
              className="absolute inset-0 bg-gradient-to-br via-transparent to-transparent pointer-events-none"
              style={{
                background: "linear-gradient(to bottom right, rgba(28, 31, 23, 0.05), transparent, transparent)",
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Top content */}
          <div>
            {/* Project Name - main title */}
            <Heading
              text={projectName}
              variant="subheading"
              level={3}
              className={cn(
                "mb-2",
                // Text color handled by inline style when fillColor is set (only if not disabled)
                !disabled && fillColor === "default" && isDark && "text-[color:var(--neutral-50)]",
                !disabled && fillColor === "default" && isLight && "text-neutral-900"
              )}
              style={
                disabled
                  ? {
                      color: "color-mix(in srgb, var(--neutral-50) 80%, transparent)",
                    }
                  : fillColor !== "default"
                  ? {
                      color:
                        fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
                          ? "var(--neutral-50)" // white text
                          : "var(--neutral-900)", // dark text
                    }
                  : undefined
              }
            />

            {/* Role - secondary label */}
            {role && (
              <p
                className={cn(
                  "text-sm md:text-base font-medium",
                  // Text color handled by inline style when fillColor is set (only if not disabled)
                  !disabled && fillColor === "default" && isDark && "text-neutral-400",
                  !disabled && fillColor === "default" && isLight && "text-neutral-600"
                )}
                style={
                  disabled
                    ? {
                        color: "color-mix(in srgb, var(--neutral-50) 80%, transparent)",
                      }
                    : fillColor !== "default"
                    ? {
                        color:
                          fillColor === "primary" || fillColor === "secondary" || fillColor === "dark"
                            ? "color-mix(in srgb, var(--neutral-50) 70%, transparent)" // white text with opacity
                            : "color-mix(in srgb, var(--neutral-900) 70%, transparent)", // dark text with opacity
                      }
                    : undefined
                }
              >
                {role}
              </p>
            )}
          </div>

        </div>

        {/* Project Type and One-liner - meta labels at bottom left with accent color - fixed position relative to card */}
        {(projectType || oneLiner) && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-20">
            {projectType && (
              <p
                className={cn(
                  "text-xs md:text-sm uppercase tracking-wider font-medium"
                )}
                style={
                  disabled
                    ? {
                        color: "color-mix(in srgb, var(--neutral-50) 80%, transparent)",
                      }
                    : {
                        color:
                          // Use accent style to determine project type color
                          accentStyle === "dark"
                            ? fillColor === "default" && isDark
                              ? "color-mix(in srgb, var(--neutral-50) 80%, transparent)" // light text with opacity for dark default
                              : "color-mix(in srgb, var(--neutral-50) 90%, transparent)" // light text for dark accent
                            : fillColor === "default" && isLight
                            ? "color-mix(in srgb, var(--neutral-900) 80%, transparent)" // dark text with opacity for light default
                            : "color-mix(in srgb, var(--neutral-900) 90%, transparent)", // dark text for light accent
                      }
                }
              >
                {projectType}
              </p>
            )}
            {oneLiner && (
              <p
                className={cn(
                  "text-xs md:text-sm leading-tight max-w-[80%]"
                )}
                style={
                  disabled
                    ? {
                        color: "color-mix(in srgb, var(--neutral-50) 80%, transparent)",
                      }
                    : {
                        color:
                          // Use accent style to determine one-liner color
                          accentStyle === "dark"
                            ? fillColor === "default" && isDark
                              ? "color-mix(in srgb, var(--neutral-50) 70%, transparent)" // light text with opacity for dark default
                              : "color-mix(in srgb, var(--neutral-50) 80%, transparent)" // light text for dark accent
                            : fillColor === "default" && isLight
                            ? "color-mix(in srgb, var(--neutral-900) 70%, transparent)" // dark text with opacity for light default
                            : "color-mix(in srgb, var(--neutral-900) 80%, transparent)", // dark text for light accent
                      }
                }
              >
                {oneLiner}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

