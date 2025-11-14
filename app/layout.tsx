import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import "./fontawesome.ts";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

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
        <Header />
        <div className="h-(--width-header)"></div>
        <main className="px-10 bg">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
