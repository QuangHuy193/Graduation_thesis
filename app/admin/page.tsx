
// app/admin/page.tsx  (SERVER)
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic"; // đảm bảo server-side

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    // chưa login -> redirect login (với callback)
    if (!session) {
        redirect(`/login?callbackUrl=/admin`);
    }

    // có session nhưng không phải admin -> 403
    const role = (session as any).user?.role ?? null;
    if (role !== "admin") {
        redirect("/403");
    }

    return <AdminClient />;
}
