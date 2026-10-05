import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Propsguru Edge — Find your edge",
  description:
    "Explore player props, compare the model with the market, and understand the signal behind every opportunity.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
