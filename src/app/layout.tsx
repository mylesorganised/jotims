import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PG Scouts · JOTA-JOTI Badges",
    template: "%s · PG Scouts JOTA-JOTI",
  },
  description: "Work through your JOTA-JOTI badges step by step, and keep track of what you've done.",
};

export const viewport: Viewport = {
  themeColor: "#7413dc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
