import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./lib/function";
import { getServerSession } from "next-auth";
import { authOptions } from "./app/api/auth/[...nextauth]/route";
export async function proxy(req: NextRequest) {
  // const { pathname } = req.nextUrl;
  // if (pathname.startsWith("/api/admin")) {
  //     // Lấy role từ cookie
  //     // const role = req.cookies.get("role")?.value;
  //     const session = await getServerSession(authOptions);
  //     // ❌ Không có role
  //     if (!session) {
  //         return NextResponse.json(
  //             { success: false, message: "Chưa đăng nhập" },
  //             { status: 401 }
  //         );
  //     }
  //     // ❌ Không phải admin
  //     const role = (session as any).user?.role ?? null;
  //     if (role !== "admin" && role !== "superadmin") {
  //         return NextResponse.json(
  //             { success: false, message: "Không có quyền truy cập" },
  //             { status: 403 }
  //         );
  //     }
  // }
  // if (pathname.startsWith("/api/sadmin")) {
  //     // Lấy role từ cookie
  //     // const role = req.cookies.get("role")?.value;
  //     const session = await getServerSession(authOptions);
  //     // ❌ Không có role
  //     if (!session) {
  //         return errorResponse("Chưa đăng nhập", 401);
  //     }
  //     // ❌ Không phải sadmin
  //     const role = (session as any).user?.role ?? null;
  //     if (role !== "superadmin") {
  //         return errorResponse("Không có quyền truy cập", 403);
  //     }
  // }
}
