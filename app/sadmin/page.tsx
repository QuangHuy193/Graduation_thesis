import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SuperAdminPage from "@/components/SuperAdmin/SuperAdminPage/SuperAdminPage";

export default async function SuperAdmim() {
  const session = await getServerSession(authOptions);

  // chưa login -> redirect login (với callback)
  if (!session) {
    redirect(`/login?callbackUrl=/admin`);
  }

  // có session nhưng không phải admin -> 403
  const role = (session as any).user?.role ?? null;
  if (role !== "superadmin") {
    redirect("/404");
  }

  return (
    <div>
      <SuperAdminPage />
    </div>
  );
}
