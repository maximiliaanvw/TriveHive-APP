import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100/80 to-blue-50/50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/5 via-transparent to-transparent" />
      
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-brand/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-accent-purple/8 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      
      {/* Auth container */}
      <div className="relative w-full max-w-md mx-4">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.svg"
            alt="TriveHive"
            width={48}
            height={48}
            priority
            className="mb-3"
          />
          <p className="text-sm text-muted-foreground tracking-wide">
            Automatización de Voz IA
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/95 backdrop-blur-sm rounded-xl border border-border/80 shadow-lg shadow-black/5 p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} TriveHive. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
