const currentYear = new Date().getFullYear();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>{children}</main>
        <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 16px 24px", color: "#64748b", fontSize: 12 }}>
          GBC Analytics Dashboard · {currentYear}
        </footer>
      </body>
    </html>
  );
}
