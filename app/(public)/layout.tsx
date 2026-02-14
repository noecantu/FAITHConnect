interface LayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
