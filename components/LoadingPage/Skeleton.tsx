interface SkeletonProps {
  width?: string;
  height?: string;
  type?: "rect" | "circle" | "text" | "line";
  className?: string;
}

export default function Skeleton({
  width = "100%",
  height = "16px",
  type = "rect",
  className = "",
}: SkeletonProps) {
  const base =
    "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]";

  const styles =
    type === "circle"
      ? "rounded-full"
      : type === "text"
      ? "rounded-md h-4"
      : type === "line"
      ? "rounded-md h-3"
      : "rounded-md";

  return (
    <div
      className={`${base} ${styles} ${className}`}
      style={{ width, height }}
    ></div>
  );
}
