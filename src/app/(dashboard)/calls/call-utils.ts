import type { CallStatus } from "./calls-table-client";

// Helper function to convert duration seconds to "Xm Ys" format
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return "0m 0s";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

// Helper function to format date to readable string
export function formatDate(dateString: string | null): string {
  if (!dateString) return "Fecha desconocida";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) {
    if (diffHours === 1) return "Hace 1 hora";
    return `Hace ${diffHours} horas`;
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  // For older dates, use locale date string
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Map Supabase call status to CallStatus type
export function mapStatus(status: string | null): CallStatus {
  if (!status) return "failed";
  const statusLower = status.toLowerCase();
  // 'ended' -> 'success' (displays as "Completada")
  if (statusLower === "ended" || statusLower === "completed") return "success";
  // 'ringing' -> 'failed' (displays as "Fallido" - could be extended to "Llamando" in future)
  if (statusLower === "ringing" || statusLower === "in-progress") return "failed";
  if (statusLower === "voicemail") return "voicemail";
  return "failed";
}
