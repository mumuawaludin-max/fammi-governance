import { Rocket } from "lucide-react";

interface ComingSoonCardProps {
  module: string;
  description?: string;
}

export function ComingSoonCard({ module, description }: ComingSoonCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      {/* Illustration */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div className="absolute h-40 w-40 rounded-full bg-fammi-100/60 blur-xl" />
        {/* Middle ring */}
        <div className="absolute h-28 w-28 rounded-full border-2 border-dashed border-fammi-200 animate-spin [animation-duration:12s]" />
        {/* Icon container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-fammi-100 shadow-neon">
          <Rocket size={32} className="text-fammi" />
        </div>
      </div>

      {/* Text */}
      <div className="max-w-xs">
        <p className="text-xs font-semibold uppercase tracking-widest text-fammi mb-2">
          Rilis Pertama · Segera Hadir
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-3">{module}</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description ?? "Modul ini sedang dalam pengembangan dan akan hadir di rilis berikutnya."}
        </p>
      </div>

      {/* Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-fammi-50 border border-fammi-200">
        <span className="h-2 w-2 rounded-full bg-fammi animate-pulse" />
        <span className="text-xs font-semibold text-fammi">Coming Soon</span>
      </div>
    </div>
  );
}
