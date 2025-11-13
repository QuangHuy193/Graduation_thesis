import React from "react";


export type AlertType = "error" | "success" | "info";


interface AlertMessageProps {
    type?: AlertType;
    text: string;
    dismissible?: boolean;
    onClose?: () => void;
    className?: string;
}


export default function AlertMessage({
    type = "error",
    text,
    dismissible = false,
    onClose,
    className = "",
}: AlertMessageProps) {
    const base = "mb-4 px-3 py-2 rounded text-sm flex items-start gap-3";


    const variants: Record<AlertType, string> = {
        error: "bg-red-100 text-red-800 border border-red-200",
        success: "bg-green-100 text-green-800 border border-green-200",
        info: "bg-blue-50 text-blue-800 border border-blue-100",
    };


    return (
        <div
            role="alert"
            aria-live={type === "error" ? "assertive" : "polite"}
            className={`${base} ${variants[type]} ${className}`}
        >
            <div className="flex-1 leading-tight">{text}</div>


            {dismissible && (
                <button
                    type="button"
                    aria-label="Đóng thông báo"
                    onClick={onClose}
                    className="text-sm opacity-70 hover:opacity-100"
                >
                    ✕
                </button>
            )}
        </div>
    );
}