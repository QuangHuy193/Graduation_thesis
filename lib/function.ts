export function scrollToPosition(y?: number, smooth: boolean = true) {
  if (typeof window === "undefined") return; // tránh lỗi khi SSR

  window.scrollTo({
    top: y ?? 0,
    behavior: smooth ? "smooth" : "auto",
  });
}
