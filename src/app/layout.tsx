import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda CER4",
  description: "Sistema de agendamentos para clínica multidisciplinar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{ className: "font-sans" }}
        />
      </body>
    </html>
  );
}
