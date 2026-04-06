// 'use client';

// import { usePathname } from 'next/navigation';
// import Header from './components/layout/Header';
// import { AppFooter } from './components/layout/AppFooter';

// export function ConditionalLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();

//   const hideEverything =
//     pathname === '/' ||
//     pathname === '/login' ||
//     pathname.startsWith('/forgot-password') ||
//     pathname.includes('/check-in') ||
//     pathname.startsWith('/onboarding') ||
//     pathname.startsWith('/member-portal');

//   return (
//     <>
//       {!hideEverything && <Header />}

//       <main className="flex-1 w-full">
//         {children}
//       </main>

//       {!hideEverything && <AppFooter />}
//     </>
//   );
// }
