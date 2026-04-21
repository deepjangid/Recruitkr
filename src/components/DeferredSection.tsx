import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredSectionProps = {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  rootMargin?: string;
};

const DeferredSection = ({
  children,
  className,
  fallback = <div className="min-h-[320px]" aria-hidden="true" />,
  rootMargin = "300px 0px",
}: DeferredSectionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

export default DeferredSection;
