"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";


export type User = {
    user_id?: number | string;
    name?: string;
    email?: string;
    role?: string;
};

type AuthContextValue = {
    user: User | null;
    setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth phải được dùng trong AuthProvider");
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Khởi tạo từ token lưu ở local/session storage (nếu bạn dùng lưu token client-side)
    useEffect(() => {
        try {
            const token =
                typeof window !== "undefined" &&
                (localStorage.getItem("token") || sessionStorage.getItem("token"));
            if (token) {
                // giả sử token là JWT chứa thông tin user
                const payload = jwtDecode<any>(token);
                // map payload sang shape User
                const u: User = {
                    user_id: payload?.user_id ?? payload?.sub,
                    name: payload?.name,
                    email: payload?.email,
                    role: payload?.role,
                };
                setUser(u);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.warn("AuthProvider: không thể decode token:", err);
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}
