"use client";

import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useGlobalLoading() {
    const pathname = usePathname();
    const router = useRouter();
    const firstLoad = useRef(true);
    const currentPath = useRef(pathname);

    // Cấu hình NProgress
    useEffect(() => {
        NProgress.configure({
            showSpinner: false,
            speed: 300,
            trickleSpeed: 120,
        });
    }, []);

    // Khi route thay đổi → kết thúc progress
    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false;
            return;
        }

        const timer = setTimeout(() => {
            NProgress.done();
            currentPath.current = pathname; // cập nhật trang hiện tại
        }, 50);

        return () => clearTimeout(timer);
    }, [pathname]);

    // Hàm dùng để start progress khi click link
    const startLoading = (href: string) => {
        if (href !== currentPath.current) {
            NProgress.start();
            return true; // cho phép chuyển trang
        }
        return false; // đang ở trang hiện tại, không chạy
    };

    // Global intercept cho router.push / router.replace
    const push = (href: string) => {
        if (startLoading(href)) {
            router.push(href);
        }
    };

    const replace = (href: string) => {
        if (startLoading(href)) {
            router.replace(href);
        }
    };

    return { startLoading, push, replace };
}
