import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "3 Shot Poker Simulator",
  description: "Simulator for the 3 Shot Poker casino game",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
