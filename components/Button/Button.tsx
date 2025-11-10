"use client";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ButtonProps = {
  text: string;
  icon?: IconDefinition;
  wfull?: boolean;
  text_color?: string;
  bg_color?: string; // hex hoặc var(--color-name)
  hover_text_color?: string;
  hover_bg_color?: string;
  p_l_r?: string;
};

function Button({
  text,
  icon,
  wfull = false,
  text_color = "var(--color-blue-black)",
  bg_color = "var(--color-yellow)",
  hover_text_color = "var(--color-white)",
  hover_bg_color = "var(--color-purple)",
  p_l_r = "20px",
}: ButtonProps) {
  // Helper để nhận dạng xem giá trị là biến CSS hay mã màu hex
  const normalizeColor = (color: string) =>
    color.startsWith("--") ? `var(${color})` : color;

  // Xử lý các màu
  const textColor = normalizeColor(text_color);
  const bgColor = normalizeColor(bg_color);
  const hoverTextColor = normalizeColor(hover_text_color);
  const hoverBgColor = normalizeColor(hover_bg_color);

  return (
    <button
      className={`${wfull && "w-full"}
        relative overflow-hidden
        font-bold rounded-sm py-2 text-xs cursor-pointer`}
      style={
        {
          "--bg": bgColor,
          "--bg-hover": hoverBgColor,
          color: textColor,
          backgroundColor: "var(--bg)",
          backgroundImage: "none",
          backgroundSize: "200% 100%",
          backgroundPosition: "0% 0%",
          paddingLeft: p_l_r,
          paddingRight: p_l_r,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.color = hoverTextColor;
        el.style.backgroundImage = `linear-gradient(90deg, var(--bg), var(--bg-hover))`;
        el.style.backgroundPosition = "100% 0%";
        el.style.transition = "background 0.6s ease-in-out, color 0.3s ease";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.color = textColor;
        el.style.backgroundImage = `none`;
        el.style.backgroundColor = "var(--bg)";
        el.style.backgroundPosition = "0% 0%";
      }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="mr-2 relative z-10" />}
      <span className="relative z-10">{text}</span>
    </button>
  );
}

export default Button;
