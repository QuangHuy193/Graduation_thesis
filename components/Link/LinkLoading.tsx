"use client";

import { useGlobalLoading } from "@/lib/hook/useGlobalLoading";
import { MouseEvent, ReactNode, AnchorHTMLAttributes } from "react";

interface LoadingLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export default function LoadingLink({
  href,
  children,
  ...props
}: LoadingLinkProps) {
  const { push } = useGlobalLoading();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    push(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      {...props} // đảm bảo nhận className, style, id,... từ ngoài
      style={{ cursor: "pointer", ...props.style }} // giữ style inline nếu có
    >
      {children}
    </a>
  );
}
