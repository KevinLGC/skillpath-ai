import type { Metadata, Viewport } from "next";
import { currentLocale } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillPath AI — vocational career & family decision support",
  description:
    "Explainable vocational career guidance for students and families: assessment, transparent matching, skill gaps, roadmaps and grounded AI counselling.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <script
          // Applies the stored theme before paint so there is no light flash.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sp_theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
