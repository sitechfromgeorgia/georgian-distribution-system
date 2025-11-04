// This is the root layout - it simply redirects to the locale-specific layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
