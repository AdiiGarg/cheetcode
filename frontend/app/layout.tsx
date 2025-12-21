// import './globals.css';
// import Navbar from "./components/Navbar";
// import Providers from "./providers";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body>
//         <Providers>
//           <Navbar />
//           {children}
//         </Providers>
//       </body>
//     </html>
//   );
// }

import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from "./components/Navbar";
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'CheetCode',
  description: 'AI-powered LeetCode problem analysis',
  icons: {
    icon: '/logo.png', // 🔥 browser tab icon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen overflow-hidden bg-zinc-950`}>
        <Providers>
           <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
