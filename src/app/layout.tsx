import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/contexts/AuthContext";

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'] })

// Define metadata for the application
export const metadata = {
  title: 'HPT AI Insights',
  description: 'Human Performance Technology AI Insights Platform',
}

// Root layout component that wraps all pages
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
