import {
  CalendarCheck,
  PhoneIncoming,
  Activity,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquareWarning,
  UserRound,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// KPI Data
const kpiData = [
  {
    title: "Citas Agendadas",
    value: "12",
    trend: "+15%",
    trendDirection: "up" as const,
    icon: CalendarCheck,
    iconColor: "text-brand",
    bgColor: "bg-brand/10",
  },
  {
    title: "Recuperadas",
    value: "8",
    trend: "Llamadas recuperadas",
    trendDirection: "neutral" as const,
    icon: PhoneIncoming,
    iconColor: "text-accent-purple",
    bgColor: "bg-accent-purple/10",
  },
  {
    title: "Total Llamadas",
    value: "145",
    trend: "Este mes",
    trendDirection: "neutral" as const,
    icon: Activity,
    iconColor: "text-brand",
    bgColor: "bg-brand/10",
  },
  {
    title: "Tasa de Éxito",
    value: "94%",
    trend: "+2.3%",
    trendDirection: "up" as const,
    icon: BarChart3,
    iconColor: "text-accent-purple",
    bgColor: "bg-accent-purple/10",
  },
];

// Recent Activity Data
const recentActivity = [
  {
    id: 1,
    status: "success",
    customerPhone: "+34 612 345 678",
    customerName: "María García",
    aiSummary: "Cita confirmada para el viernes 17 a las 10:00. Cliente interesada en tratamiento facial.",
    duration: "2:34",
    date: "Hace 12 min",
  },
  {
    id: 2,
    status: "success",
    customerPhone: "+34 698 765 432",
    customerName: "Carlos Rodríguez",
    aiSummary: "Reagendó cita para la próxima semana. Prefiere horario de tarde.",
    duration: "1:45",
    date: "Hace 28 min",
  },
  {
    id: 3,
    status: "pending",
    customerPhone: "+34 611 222 333",
    customerName: "Laura Martínez",
    aiSummary: "Solicitó información sobre precios. Se envió catálogo por WhatsApp.",
    duration: "3:12",
    date: "Hace 45 min",
  },
  {
    id: 4,
    status: "failed",
    customerPhone: "+34 655 444 111",
    customerName: "Pedro Sánchez",
    aiSummary: "Cliente no contestó. Tercer intento de contacto.",
    duration: "0:32",
    date: "Hace 1 hora",
  },
  {
    id: 5,
    status: "success",
    customerPhone: "+34 677 888 999",
    customerName: "Ana López",
    aiSummary: "Confirmación de cita existente. Cliente preguntó por ubicación del local.",
    duration: "1:18",
    date: "Hace 2 horas",
  },
];

// Attention Required Data
const attentionItems = [
  {
    id: 1,
    type: "complex",
    title: "Pregunta compleja",
    description: "Cliente preguntó por tratamientos no listados",
    customer: "Miguel Torres",
    icon: HelpCircle,
  },
  {
    id: 2,
    type: "human",
    title: "Solicitó hablar con humano",
    description: "Quiere confirmar detalles de pago",
    customer: "Elena Vidal",
    icon: UserRound,
  },
  {
    id: 3,
    type: "complaint",
    title: "Posible queja",
    description: "Tono negativo detectado en la conversación",
    customer: "Roberto Díaz",
    icon: MessageSquareWarning,
  },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Panel de Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitoriza el rendimiento de tu asistente de voz IA en tiempo real.
        </p>
      </div>

      {/* KPI Grid - 4 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="py-4">
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {kpi.value}
                    </span>
                    {kpi.trendDirection === "up" && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        {kpi.trend}
                      </span>
                    )}
                    {kpi.trendDirection === "neutral" && (
                      <span className="text-xs text-muted-foreground">
                        {kpi.trend}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`rounded-lg p-2.5 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section - Split View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side - Recent Activity Table (2/3 width) */}
        <Card className="lg:col-span-2 py-0">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-base">Última Actividad</CardTitle>
            <CardDescription>
              Llamadas recientes procesadas por el asistente IA
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider max-w-[200px]">
                      Resumen IA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentActivity.map((activity) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <StatusIcon status={activity.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {activity.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {activity.customerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.aiSummary}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground font-mono">
                          {activity.duration}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {activity.date}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Attention Required (1/3 width) */}
        <Card className="py-0">
          <CardHeader className="py-4 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Atención Requerida</CardTitle>
            </div>
            <CardDescription>
              Casos que necesitan revisión humana
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="space-y-4">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="rounded-full bg-amber-100 p-1.5">
                    <item.icon className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-brand font-medium mt-1">
                      {item.customer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Weekly Volume Chart Placeholder */}
      <Card className="py-0">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Volumen Semanal</CardTitle>
              <CardDescription>
                Llamadas procesadas en los últimos 7 días
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-brand" />
                <span className="text-muted-foreground">Entrantes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent-purple" />
                <span className="text-muted-foreground">Recuperadas</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Gráfico de volumen
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Se añadirá próximamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
