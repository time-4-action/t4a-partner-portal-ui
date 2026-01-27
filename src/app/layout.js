import { Orbitron, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Patrik Partner Portal",
  description: "Product overview for Patrik International.",
  icons: {
    icon: "https://www.patrikinternational.com/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${montserrat.variable}`}>
      <body>
        <div className="relative min-h-screen overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-[-10%] left-[5%] w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-[10%] right-[5%] w-80 h-80 bg-cyan-500/20 rounded-full filter blur-3xl animate-blob2"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-sky-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-blue-700/10 rounded-full filter blur-2xl animate-blob3 animation-delay-2000"></div>
          <div className="absolute bottom-[15%] right-[15%] w-64 h-64 bg-cyan-400/20 rounded-full filter blur-3xl animate-blob2 animation-delay-6000"></div>
          <div className="absolute bottom-[40%] left-[10%] w-56 h-56 bg-sky-400/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-[25%] left-[30%] w-48 h-48 bg-blue-400/10 rounded-full filter blur-2xl animate-blob3"></div>
          <div className="absolute bottom-[5%] right-[35%] w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

          {/* Content */}
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
