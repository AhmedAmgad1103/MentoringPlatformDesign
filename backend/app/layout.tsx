import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MedMentor Local API",
  description: "Local backend for MedMentor testing",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
