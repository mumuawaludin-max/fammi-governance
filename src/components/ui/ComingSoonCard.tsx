import { Construction } from "lucide-react";

interface ComingSoonCardProps {
  module: string;
  description?: string;
}

export function ComingSoonCard({ module, description }: ComingSoonCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-fammi-100">
        <Construction size={28} className="text-fammi" />
      </div>
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{module}</h1>
        <p className="text-text-secondary">
          {description ?? "Modul ini akan dibangun di Tahap 4."}
        </p>
      </div>
      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-fammi-100 text-fammi">
        Coming in Tahap 4
      </span>
    </div>
  );
}
