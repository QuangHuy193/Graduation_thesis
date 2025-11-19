// app/admin/layout.tsx
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    // middleware đã xử lý việc auth/role
    return <div className="admin-layout">{children}</div>;
}
