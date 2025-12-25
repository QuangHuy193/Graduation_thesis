// lib/interface/userInterface.ts
export type UserRole = "superadmin" | "admin" | "user";

export interface UserITF {
    user_id: number;
    name: string;
    phone_number: string;
    email: string;
    birthday: string; // YYYY-MM-DD
    age: number;
    vip: boolean;
    point: number;
    status: number; // 1: active, 0: locked
    role: UserRole;
    created_at: string;
    updated_at?: string | null;
}
