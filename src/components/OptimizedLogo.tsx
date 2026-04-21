import { memo } from "react";

import logoPng from "@/assets/logo.png";
import logoWebp from "@/assets/logo.webp";

type OptimizedLogoProps = {
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
};

const LOGO_SIZE = 500;

const OptimizedLogo = memo(function OptimizedLogo({
  alt = "RecruitKr",
  className,
  imgClassName,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  sizes = "(max-width: 768px) 136px, 186px",
}: OptimizedLogoProps) {
  return (
    <picture className={className}>
      <source srcSet={logoWebp} type="image/webp" />
      <img
        src={logoPng}
        alt={alt}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        sizes={sizes}
        className={imgClassName}
      />
    </picture>
  );
});

export default OptimizedLogo;
