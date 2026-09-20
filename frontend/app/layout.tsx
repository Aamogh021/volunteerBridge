import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VolunteerBridge — AI-Powered Volunteer Coordination",
  description:
    "VolunteerBridge uses Google Gemini AI to intelligently match volunteers to community needs during crisis situations. Built for NGOs to deploy the right volunteer to the right place at the right time.",
  keywords: [
    "volunteer coordination",
    "NGO",
    "crisis management",
    "AI matching",
    "Google Gemini",
  ],
  authors: [{ name: "VolunteerBridge Team" }],
  openGraph: {
    title: "VolunteerBridge — AI-Powered Volunteer Coordination",
    description:
      "Intelligently match volunteers to community needs during crisis situations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
