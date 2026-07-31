import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/shared/ui/ThemeProvider";
import { Toaster } from "@/shared/ui/Toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Typo condensée signature de la DA Club — équivalent cross-platform
 *  de Futura Condensed ExtraBold. */
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LA NICHE",
  description:
    "La Niche — carnet olfactif intelligent. Wishlist, balades olfactives et mémoire de chaque essai de parfum.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "La Niche",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  // Thème unique : sombre. Pas de variante claire.
  themeColor: "#121214",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${anton.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router : le root layout couvre toutes les pages, la règle vise le Pages Router */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-[100dvh] bg-background text-on-background flex flex-col">
        <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
