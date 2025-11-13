import { type ElementType, type ReactNode, type ComponentPropsWithoutRef } from "react";

type HeroBackgroundWrapperProps<E extends ElementType = "section"> = {
  as?: E;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "className" | "children">;

const baseWrapperClasses =
  "relative overflow-hidden bg-gradient-to-br from-brand-grey-900 via-brand-grey-800 to-brand-grey-700 text-white";

export function HeroBackgroundWrapper<E extends ElementType = "section">({
  as,
  className = "",
  contentClassName = "",
  children,
  ...rest
}: HeroBackgroundWrapperProps<E>) {
  const Component = (as ?? "section") as ElementType;

  return (
    <Component
      className={`${baseWrapperClasses} ${className}`.trim()}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] right-[-10%] h-96 w-96 rounded-full bg-gradient-to-r from-brand-orange-400/30 via-brand-orange-300/20 to-brand-orange-500/20 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-5%] h-[420px] w-[420px] rounded-full bg-gradient-to-r from-brand-orange-500/20 via-brand-orange-400/10 to-brand-orange-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-orange-500/15 via-white/5 to-brand-orange-400/15 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className={`relative ${contentClassName}`.trim()}>{children}</div>
    </Component>
  );
}

export default HeroBackgroundWrapper;

