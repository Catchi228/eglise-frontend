import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { RouteShell } from "@/components/RouteShell";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Convention Baptiste du Togo (CBT)",
    template: "%s · CBT Togo",
  },
  description:
    "Portail de la Convention Baptiste du Togo (CBT) — Lomé. Annonces, cours Ecodim, Bible et espace membre.",
  metadataBase: new URL("https://conventionbaptistetogo.org"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "normal",
  themeColor: "#f5f0e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `(function(){try{var k="eglise_theme",t=localStorage.getItem(k),r=document.documentElement;if(t==="dark")r.classList.add("dark");else r.classList.remove("dark");}catch(e){document.documentElement.classList.remove("dark");}})();`;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="flex min-h-full flex-col bg-transparent dark:bg-slate-950">
        <ThemeProvider>
          <SessionProvider>
            <RouteShell>{children}</RouteShell>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
