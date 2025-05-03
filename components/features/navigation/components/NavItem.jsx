// components/features/navigation/components/NavItem.jsx
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Style generation function (remains the same)
const generateNavItemClasses = ({
  isActive = false,
  isExpanded = false,
  isHovered = false,
  isFocusedVisible = false,
}) => {
  const base = `
        flex items-center justify-center relative cursor-pointer
        font-medium tracking-tight text-sm whitespace-nowrap
        px-3 py-1.5
        transition-colors duration-150 ease-out
        focus:outline-none
    `;
  const isEffectivelyActive = isActive || isExpanded;
  const showInteractiveState =
    !isEffectivelyActive && (isHovered || isFocusedVisible);
  const state = cn({
    "text-foreground": isEffectivelyActive,
    "text-muted-foreground": !isEffectivelyActive && !showInteractiveState,
    "text-foreground": showInteractiveState,
    "bg-accent": showInteractiveState,
    "bg-transparent": !showInteractiveState,
  });
  const focusRing = isFocusedVisible
    ? "ring-2 ring-ring ring-offset-1 ring-offset-background"
    : "";
  return cn(base, state, focusRing);
};

// The component using forwardRef
export const NavItem = React.forwardRef((props, ref) => {
  const {
    id,
    label,
    isActive = false,
    hasPopup = false,
    isExpanded = false,
    controlsId,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
    href = "#",
    role,
    className,
    ...restProps
  } = props;

  // State for interaction tracking
  const [isFocusedVisible, setIsFocusedVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const isPointerDown = React.useRef(false);

  // Event Handlers (remain the same)
  const handlePointerDown = React.useCallback(() => {
    isPointerDown.current = true;
  }, []);
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);
  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    isPointerDown.current = false;
    onMouseLeave?.();
  }, [onMouseLeave]);
  const handleFocus = React.useCallback(() => {
    if (!isPointerDown.current) setIsFocusedVisible(true);
    isPointerDown.current = false;
    onFocus?.();
  }, [onFocus]);
  const handleBlur = React.useCallback(() => {
    setIsFocusedVisible(false);
    isPointerDown.current = false;
    onBlur?.();
  }, [onBlur]);

  // Generate dynamic classes
  const combinedClasses = generateNavItemClasses({
    isActive,
    isExpanded,
    isHovered,
    isFocusedVisible,
  });

  // **MODIFICATION START:** Use motion.a and place Link logic inside if needed,
  // or wrap the content of the Link with motion.span if Link needs to be the outer element.
  // Let's keep Link as the outer element for routing and wrap content with motion.
  // We apply motion properties to the Link itself if possible, otherwise wrap the content.

  // Since Link passes props down, we can apply motion directly TO the Link component
  // by using motion(Link) - let's revert to that but ensure it's called correctly.
  // The previous error might have been unrelated to this pattern itself.

  // Re-attempting the cleaner pattern: Create the motion component first
  const MotionLink = motion(Link);

  return (
    <MotionLink
      ref={ref} // Apply ref here
      id={id}
      href={href}
      role={role}
      aria-haspopup={hasPopup ? "menu" : undefined}
      aria-expanded={hasPopup ? isExpanded : undefined}
      aria-controls={hasPopup ? controlsId : undefined}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      onPointerDown={handlePointerDown}
      className={cn(combinedClasses, className)}
      tabIndex={0} // Ensure tabbable
      transition={{ duration: 0.15, ease: "easeOut" }}
      prefetch={false}
      {...restProps}
    >
      {/* Content inside the Link */}
      <span>{label}</span>
      {hasPopup && (
        <ChevronDown
          className={cn(
            "relative top-px ml-1 h-3.5 w-3.5 transition-transform duration-200 ease-out",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
          aria-hidden="true"
        />
      )}
    </MotionLink>
  );
  // **MODIFICATION END**
});

NavItem.displayName = "NavItem";
export default NavItem; // Export as default
