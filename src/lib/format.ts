export const formatRupiah = (n: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat("id-ID").format(n);

export const formatPct = (n: number, decimals = 1): string =>
  `${n.toFixed(decimals)}%`;

export const getRunwayStatus = (months: number): "merah" | "kuning" | "hijau" =>
  months < 3 ? "merah" : months < 6 ? "kuning" : "hijau";

export const getProgressColor = (pct: number): "danger" | "warning" | "success" =>
  pct < 30 ? "danger" : pct < 70 ? "warning" : "success";

export const formatRunway = (months: number): string => {
  if (months >= 12) return `${Math.floor(months / 12)}t ${months % 12}b`;
  return `${months} bulan`;
};

export const formatRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};
