import type { Metadata } from "next";
import "./globals.css";
import "./fontawesome.ts";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import GlobalLoading from "@/components/GlobalLoading/GlobalLoading";
import { AuthProvider } from "@/components/Header/AuthContext";

export const metadata: Metadata = {
  title: "CineGo",
  description: "Đặt vé xem phim nhanh chóng và tiện lợi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GlobalLoading />
        <AuthProvider>
          <Header />
          <div className="h-(--height-header) bg-(--color-blue-black)"></div>
          <main className="px-10 bg">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
