// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// matcher sẽ áp dụng cho /admin và các đường dẫn con
export const config = {
    matcher: ["/admin/:path*"],
};

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // chỉ áp dụng cho /admin (matcher đã giới hạn nhưng thêm check an toàn)
    if (pathname.startsWith("/admin")) {
        // getToken đọc cookie session do NextAuth set (HttpOnly)
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        // chưa login -> redirect tới login (kèm callbackUrl)
        if (!token) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("callbackUrl", req.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // nếu đã login nhưng không phải admin -> redirect 403
        if ((token as any).role !== "admin") {
            const url = req.nextUrl.clone();
            url.pathname = "/403";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}
