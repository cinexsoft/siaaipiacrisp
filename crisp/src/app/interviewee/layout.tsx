import WelcomeBack from "@/app/WelcomeBack";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeBack />
      {children}
    </>
  );
}


