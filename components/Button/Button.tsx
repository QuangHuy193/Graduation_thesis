"use client";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";
import cn from "clsx";

type ButtonProps = {
  text?: React.ReactNode;
  children?: React.ReactNode;
  icon?: IconDefinition;
  wfull?: boolean;
  text_color?: string;
  bg_color?: string; // hex hoặc var(...) hoặc --var-name
  hover_text_color?: string;
  hover_bg_color?: string;
  p_l_r?: string;
  link?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function normalizeColor(input: string) {
  if (!input) return "";
  const v = input.trim();
  // nếu đã là var(...)
  if (v.startsWith("var(")) return v;
  // nếu chỉ truyền --my-var => biến CSS
  if (v.startsWith("--")) return `var(${v})`;
  // nếu truyền var name không có var() và không bắt đầu bằng -- nhưng chứa -- (ví dụ "--color")
  if (v.includes("--") && !v.startsWith("#")) return `var(${v})`;
  // ngược lại coi là mã màu (hex, rgba, keyword)
  return v;
}

export default function Button({
  text,
  children,
  icon,
  wfull = false,
  text_color = "var(--color-blue-black)",
  bg_color = "var(--color-yellow)",
  hover_text_color = "var(--color-white)",
  hover_bg_color = "var(--color-purple)",
  p_l_r = "20px",
  link = "",
  type = "button",
  disabled = false,
  className,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const textColor = normalizeColor(text_color);
  const bgColor = normalizeColor(bg_color);
  const hoverTextColor = normalizeColor(hover_text_color);
  const hoverBgColor = normalizeColor(hover_bg_color);

  // shared inline style (sử dụng CSS custom properties)
  const baseStyle = {
    // kiểu cast để Typescript chấp nhận CSS variable keys
    ["--bg" as any]: bgColor,
    ["--bg-hover" as any]: hoverBgColor,
    color: textColor,
    backgroundColor: "var(--bg)",
    backgroundImage: "none",
    backgroundSize: "200% 100%",
    backgroundPosition: "0% 0%",
    paddingLeft: p_l_r,
    paddingRight: p_l_r,
  } as React.CSSProperties;

  const baseClass =
    "relative overflow-hidden font-bold rounded-sm py-2 text-xs cursor-pointer inline-flex items-center justify-center";

  const fullClass = wfull ? "w-full" : "";
  const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md";

  // handlers để vẫn cho phép caller override onMouseEnter/onMouseLeave
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.color = hoverTextColor;
    el.style.backgroundImage = `linear-gradient(90deg, var(--bg), var(--bg-hover))`;
    el.style.backgroundPosition = "100% 0%";
    el.style.transition = "background 0.6s ease-in-out, color 0.3s ease";
    if (onMouseEnter) onMouseEnter(e as any);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.color = textColor;
    el.style.backgroundImage = `none`;
    el.style.backgroundColor = "var(--bg)";
    el.style.backgroundPosition = "0% 0%";
    if (onMouseLeave) onMouseLeave(e as any);
  };

  // Nếu có link -> render Link (a) styled as button (không render <button> bên trong <a>)
  if (link && link.trim() !== "") {
    return (
      <Link href={link} legacyBehavior>
        <a
          role="button"
          aria-disabled={disabled}
          className={cn(baseClass, fullClass, disabledClass, className)}
          style={baseStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          // nếu disabled, ngăn chặn nhấp chuột
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          {...(rest as any)}
        >
          {icon && <FontAwesomeIcon icon={icon} className="mr-2 relative z-10" />}
          <span className="relative z-10">{text ?? children}</span>
        </a>
      </Link>
    );
  }

  // bình thường render button
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(baseClass, fullClass, disabledClass, className)}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {icon && <FontAwesomeIcon icon={icon} className="mr-2 relative z-10" />}
      <span className="relative z-10">{text ?? children}</span>
    </button>
  );
}
