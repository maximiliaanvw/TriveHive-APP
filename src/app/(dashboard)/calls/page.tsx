"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Voicemail,
  PhoneIncoming,
  PhoneOutgoing,
  Smile,
  Meh,
  Frown,
  Bot,
  User,
  Clock,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Types
type CallStatus = "success" | "failed" | "voicemail";
type CallType = "inbound" | "outbound";
type Sentiment = "happy" | "neutral" | "angry";

interface TranscriptMessage {
  role: "ai" | "user";
  text: string;
  timestamp: string;
}

interface CallRecord {
  id: string;
  status: CallStatus;
  customerName: string;
  customerPhone: string;
  type: CallType;
  duration: string;
  durationSeconds: number;
  date: string;
  dateRaw: string;
  summary: string;
  fullSummary: string;
  sentiment: Sentiment;
  wasSuccessful: boolean;
  recordingUrl: string;
  transcript: TranscriptMessage[];
}

// Dummy Data - 10 realistic call scenarios
const callsData: CallRecord[] = [
  // Scenario A: Appointment booked (Success)
  {
    id: "CALL-001",
    status: "success",
    customerName: "María García",
    customerPhone: "+34 612 345 678",
    type: "inbound",
    duration: "2m 34s",
    durationSeconds: 154,
    date: "Today, 10:43 AM",
    dateRaw: "2024-01-15T10:43:00",
    summary: "Cita agendada para tratamiento facial el viernes a las 10:00 AM.",
    fullSummary: "La cliente llamó para agendar una cita para un tratamiento de rejuvenecimiento facial. Después de discutir los horarios disponibles, seleccionó el viernes a las 10:00 AM. Mencionó tener piel sensible y preguntó sobre las preparaciones previas al tratamiento. La IA proporcionó toda la información necesaria y confirmó la reserva exitosamente.",
    sentiment: "happy",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-001.mp3",
    transcript: [
      { role: "ai", text: "Hola, bienvenida a TriveHive Spa. Soy el asistente virtual. ¿En qué puedo ayudarte hoy?", timestamp: "0:00" },
      { role: "user", text: "Hola, me gustaría reservar una cita para un tratamiento facial.", timestamp: "0:08" },
      { role: "ai", text: "Por supuesto. Tenemos disponibilidad esta semana. ¿Preferirías algún día en particular?", timestamp: "0:14" },
      { role: "user", text: "¿Tienen algo para el viernes por la mañana?", timestamp: "0:22" },
      { role: "ai", text: "Sí, tenemos un hueco a las 10:00 AM el viernes. ¿Te viene bien?", timestamp: "0:28" },
      { role: "user", text: "Perfecto, me viene genial. Tengo la piel sensible, ¿hay algo que deba hacer antes?", timestamp: "0:35" },
      { role: "ai", text: "Te recomendamos no usar exfoliantes 48 horas antes y llegar con la cara limpia. Te enviaré un recordatorio por WhatsApp.", timestamp: "0:45" },
      { role: "user", text: "Perfecto, muchas gracias.", timestamp: "0:58" },
      { role: "ai", text: "¡Gracias a ti, María! Tu cita queda confirmada para el viernes 17 a las 10:00. ¡Hasta pronto!", timestamp: "1:04" },
    ],
  },
  // Scenario B: User complained (Failed/Angry)
  {
    id: "CALL-002",
    status: "failed",
    customerName: "Roberto Díaz",
    customerPhone: "+34 655 444 111",
    type: "inbound",
    duration: "4m 12s",
    durationSeconds: 252,
    date: "Today, 9:15 AM",
    dateRaw: "2024-01-15T09:15:00",
    summary: "Cliente se quejó sobre la calidad del servicio anterior. Escalado a humano.",
    fullSummary: "El cliente expresó una insatisfacción significativa con un tratamiento reciente, afirmando que no cumplió con las expectativas y causó irritación en la piel. A pesar de los intentos de la IA para abordar las preocupaciones, el cliente se frustró cada vez más y exigió hablar con un gerente. La llamada fue escalada al soporte humano para su resolución.",
    sentiment: "angry",
    wasSuccessful: false,
    recordingUrl: "/recordings/call-002.mp3",
    transcript: [
      { role: "ai", text: "Hola, bienvenido a TriveHive Spa. ¿En qué puedo ayudarte?", timestamp: "0:00" },
      { role: "user", text: "Quiero poner una queja. El tratamiento que me hicieron fue un desastre.", timestamp: "0:06" },
      { role: "ai", text: "Lamento mucho escuchar eso. ¿Podrías contarme qué pasó para poder ayudarte?", timestamp: "0:14" },
      { role: "user", text: "Me hicieron un peeling y ahora tengo la cara irritada. Pagué mucho dinero para esto.", timestamp: "0:22" },
      { role: "ai", text: "Entiendo tu frustración. Una leve irritación puede ser normal en algunas pieles, pero si es severa, queremos ayudarte.", timestamp: "0:32" },
      { role: "user", text: "No me interesa lo que es normal. Quiero hablar con un responsable ahora mismo.", timestamp: "0:42" },
      { role: "ai", text: "Por supuesto, voy a transferir tu llamada a nuestro equipo de atención al cliente para que puedan asistirte personalmente.", timestamp: "0:50" },
      { role: "user", text: "Ya era hora.", timestamp: "1:00" },
      { role: "ai", text: "Te transfiero ahora. Gracias por tu paciencia.", timestamp: "1:04" },
    ],
  },
  // Scenario C: Voicemail detected
  {
    id: "CALL-003",
    status: "voicemail",
    customerName: "Pedro Sánchez",
    customerPhone: "+34 611 222 333",
    type: "outbound",
    duration: "0m 28s",
    durationSeconds: 28,
    date: "Today, 8:30 AM",
    dateRaw: "2024-01-15T08:30:00",
    summary: "Buzón de voz detectado. Mensaje dejado para recordatorio de cita.",
    fullSummary: "Llamada saliente para recordar al cliente sobre su próxima cita. Se detectó buzón de voz después de 4 timbres. Se dejó un breve mensaje de recordatorio pidiendo al cliente que confirme su cita para mañana a las 3:00 PM.",
    sentiment: "neutral",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-003.mp3",
    transcript: [
      { role: "ai", text: "Hola Pedro, te llamamos de TriveHive Spa para recordarte tu cita de mañana a las 15:00. Por favor, confirma respondiendo a este mensaje o llamándonos. ¡Gracias!", timestamp: "0:00" },
    ],
  },
  // Additional success scenarios
  {
    id: "CALL-004",
    status: "success",
    customerName: "Ana López",
    customerPhone: "+34 677 888 999",
    type: "inbound",
    duration: "1m 45s",
    durationSeconds: 105,
    date: "Yesterday, 4:30 PM",
    dateRaw: "2024-01-14T16:30:00",
    summary: "Cita reagendada del lunes al miércoles.",
    fullSummary: "La cliente llamó para reagendar su cita de masaje del lunes al miércoles debido a un conflicto laboral. La IA encontró exitosamente un horario disponible a la misma hora el miércoles y confirmó el cambio. La cliente estuvo muy agradecida por la asistencia rápida.",
    sentiment: "happy",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-004.mp3",
    transcript: [
      { role: "ai", text: "Hola, TriveHive Spa. ¿En qué puedo ayudarte?", timestamp: "0:00" },
      { role: "user", text: "Hola, tengo cita el lunes pero me ha surgido un viaje de trabajo. ¿Puedo cambiarla?", timestamp: "0:06" },
      { role: "ai", text: "Claro, Ana. Veo tu cita del lunes a las 11:00. ¿Qué día te vendría mejor?", timestamp: "0:16" },
      { role: "user", text: "¿Tenéis algo el miércoles a la misma hora?", timestamp: "0:24" },
      { role: "ai", text: "Sí, tenemos disponibilidad el miércoles a las 11:00. ¿Te confirmo?", timestamp: "0:30" },
      { role: "user", text: "Perfecto, sí por favor.", timestamp: "0:36" },
      { role: "ai", text: "Listo, tu cita está ahora para el miércoles a las 11:00. Te enviaré confirmación por SMS.", timestamp: "0:42" },
    ],
  },
  {
    id: "CALL-005",
    status: "success",
    customerName: "Carlos Rodríguez",
    customerPhone: "+34 698 765 432",
    type: "outbound",
    duration: "2m 08s",
    durationSeconds: 128,
    date: "Yesterday, 2:15 PM",
    dateRaw: "2024-01-14T14:15:00",
    summary: "Cita perdida recuperada exitosamente. Reagendada para la próxima semana.",
    fullSummary: "Llamada de recuperación saliente para cliente que faltó a su cita la semana pasada. El cliente se disculpó por la ausencia y estuvo feliz de reagendar. Nueva cita agendada para el próximo martes por la tarde. El cliente mencionó que tuvo una emergencia familiar.",
    sentiment: "neutral",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-005.mp3",
    transcript: [
      { role: "ai", text: "Hola Carlos, te llamo de TriveHive Spa. Queríamos saber si todo está bien, no pudimos verte en tu cita del martes.", timestamp: "0:00" },
      { role: "user", text: "Ah sí, lo siento mucho. Tuve una emergencia familiar y no pude avisar.", timestamp: "0:12" },
      { role: "ai", text: "Lo entendemos perfectamente, no te preocupes. ¿Te gustaría reagendar tu cita?", timestamp: "0:20" },
      { role: "user", text: "Sí, me vendría bien la semana que viene por la tarde.", timestamp: "0:28" },
      { role: "ai", text: "Tenemos disponibilidad el martes a las 17:00. ¿Te viene bien?", timestamp: "0:34" },
      { role: "user", text: "Perfecto, muchas gracias por llamar.", timestamp: "0:42" },
    ],
  },
  // Another failed scenario
  {
    id: "CALL-006",
    status: "failed",
    customerName: "Elena Vidal",
    customerPhone: "+34 633 555 777",
    type: "inbound",
    duration: "3m 22s",
    durationSeconds: 202,
    date: "Yesterday, 11:00 AM",
    dateRaw: "2024-01-14T11:00:00",
    summary: "Consulta compleja sobre precios. Cliente solicitó llamada de humano.",
    fullSummary: "El cliente llamó con preguntas detalladas sobre precios de paquetes y opciones de financiación. La IA proporcionó información general de precios, pero el cliente quería detalles específicos sobre paquetes personalizados y planes de pago que requerían consulta humana. Llamada transferida al equipo de ventas.",
    sentiment: "neutral",
    wasSuccessful: false,
    recordingUrl: "/recordings/call-006.mp3",
    transcript: [
      { role: "ai", text: "Hola, bienvenida a TriveHive Spa. ¿En qué puedo ayudarte?", timestamp: "0:00" },
      { role: "user", text: "Quiero información sobre vuestros paquetes de tratamientos. ¿Tenéis algo para novias?", timestamp: "0:08" },
      { role: "ai", text: "Sí, tenemos el Pack Novia que incluye facial, masaje y manicura. Está a 180€.", timestamp: "0:18" },
      { role: "user", text: "¿Y si quiero añadir más cosas? ¿Puedo pagar a plazos?", timestamp: "0:28" },
      { role: "ai", text: "Podemos personalizar el paquete. Para opciones de financiación, te recomiendo hablar con nuestro equipo de ventas.", timestamp: "0:38" },
      { role: "user", text: "Sí, prefiero hablar con alguien para que me explique todo bien.", timestamp: "0:48" },
      { role: "ai", text: "Perfecto, te paso con nuestro equipo de ventas. Ellos te llamarán en breve.", timestamp: "0:56" },
    ],
  },
  // More voicemail
  {
    id: "CALL-007",
    status: "voicemail",
    customerName: "Miguel Torres",
    customerPhone: "+34 644 333 222",
    type: "outbound",
    duration: "0m 32s",
    durationSeconds: 32,
    date: "Yesterday, 9:00 AM",
    dateRaw: "2024-01-14T09:00:00",
    summary: "Buzón de voz dejado para solicitud de encuesta de opinión.",
    fullSummary: "Llamada saliente para recopilar comentarios después de una visita reciente al spa. Buzón de voz detectado. Se dejó un mensaje invitando al cliente a completar una encuesta de satisfacción con un código de descuento del 10% como agradecimiento.",
    sentiment: "neutral",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-007.mp3",
    transcript: [
      { role: "ai", text: "Hola Miguel, te llamamos de TriveHive Spa para conocer tu opinión sobre tu última visita. Nos encantaría que completaras una breve encuesta. Como agradecimiento, te enviamos un código del 10% de descuento. ¡Gracias!", timestamp: "0:00" },
    ],
  },
  {
    id: "CALL-008",
    status: "success",
    customerName: "Laura Martínez",
    customerPhone: "+34 622 111 444",
    type: "inbound",
    duration: "1m 18s",
    durationSeconds: 78,
    date: "Jan 13, 3:45 PM",
    dateRaw: "2024-01-13T15:45:00",
    summary: "Cita existente confirmada. Información de estacionamiento proporcionada.",
    fullSummary: "La cliente llamó para confirmar su cita y preguntar sobre la disponibilidad de estacionamiento cerca del spa. La IA confirmó la cita para el día siguiente y proporcionó información detallada sobre estacionamiento, incluyendo el garaje público cercano.",
    sentiment: "happy",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-008.mp3",
    transcript: [
      { role: "ai", text: "Hola, TriveHive Spa. ¿En qué puedo ayudarte?", timestamp: "0:00" },
      { role: "user", text: "Hola, solo quería confirmar mi cita de mañana.", timestamp: "0:06" },
      { role: "ai", text: "Hola Laura, veo tu cita para mañana a las 16:00. ¿Te confirmo?", timestamp: "0:12" },
      { role: "user", text: "Sí, perfecto. ¿Hay parking cerca?", timestamp: "0:18" },
      { role: "ai", text: "Sí, hay un parking público a 50 metros en Calle Mayor. Cuesta 2€/hora.", timestamp: "0:24" },
      { role: "user", text: "Genial, gracias por la info.", timestamp: "0:32" },
    ],
  },
  {
    id: "CALL-009",
    status: "success",
    customerName: "Sofía Hernández",
    customerPhone: "+34 666 999 888",
    type: "inbound",
    duration: "3m 05s",
    durationSeconds: 185,
    date: "Jan 13, 11:20 AM",
    dateRaw: "2024-01-13T11:20:00",
    summary: "Nuevo cliente agendó primera consulta. Alergias anotadas.",
    fullSummary: "Cliente por primera vez llamó para agendar una consulta inicial. La IA recopiló información relevante sobre alergias (látex y aloe vera) y preferencias. Se agendó una consulta de 30 minutos con la terapeuta para discutir tratamientos adecuados.",
    sentiment: "happy",
    wasSuccessful: true,
    recordingUrl: "/recordings/call-009.mp3",
    transcript: [
      { role: "ai", text: "Hola, bienvenida a TriveHive Spa. ¿Es tu primera vez con nosotros?", timestamp: "0:00" },
      { role: "user", text: "Sí, me han recomendado mucho. Quiero saber qué tratamientos me vendrían bien.", timestamp: "0:08" },
      { role: "ai", text: "¡Genial! Podemos agendar una consulta inicial gratuita con nuestra terapeuta. ¿Tienes alguna alergia o condición que debamos saber?", timestamp: "0:18" },
      { role: "user", text: "Sí, soy alérgica al látex y al aloe vera.", timestamp: "0:28" },
      { role: "ai", text: "Anotado. Lo tendremos en cuenta para recomendarte tratamientos seguros. ¿Qué día te vendría bien?", timestamp: "0:36" },
      { role: "user", text: "¿El jueves por la mañana?", timestamp: "0:44" },
      { role: "ai", text: "Tenemos hueco el jueves a las 10:30. Son 30 minutos para la consulta. ¿Te confirmo?", timestamp: "0:50" },
      { role: "user", text: "Sí, perfecto.", timestamp: "0:58" },
    ],
  },
  {
    id: "CALL-010",
    status: "failed",
    customerName: "Javier Moreno",
    customerPhone: "+34 655 777 333",
    type: "outbound",
    duration: "0m 45s",
    durationSeconds: 45,
    date: "Jan 12, 5:00 PM",
    dateRaw: "2024-01-12T17:00:00",
    summary: "Cliente rechazó reagendar. Ya no está interesado.",
    fullSummary: "Llamada de recuperación saliente para cliente que canceló su cita. El cliente indicó que ya no está interesado en los servicios y pidió que no se le contacte nuevamente. Solicitud anotada en el sistema.",
    sentiment: "angry",
    wasSuccessful: false,
    recordingUrl: "/recordings/call-010.mp3",
    transcript: [
      { role: "ai", text: "Hola Javier, te llamo de TriveHive Spa. Vimos que cancelaste tu cita y queríamos ofrecerte reagendarla.", timestamp: "0:00" },
      { role: "user", text: "No, gracias. Ya no me interesa.", timestamp: "0:12" },
      { role: "ai", text: "Entendemos. ¿Hay algo que podamos mejorar para futuras ocasiones?", timestamp: "0:18" },
      { role: "user", text: "No, simplemente no me interesa. Por favor, no me llamen más.", timestamp: "0:26" },
      { role: "ai", text: "Por supuesto, lo anotamos. Gracias por tu tiempo. ¡Que tengas buen día!", timestamp: "0:34" },
    ],
  },
];

// Status components
function StatusBadge({ status }: { status: CallStatus }) {
  const config = {
    success: {
      icon: CheckCircle2,
      label: "Éxito",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconClassName: "text-emerald-500",
    },
    failed: {
      icon: XCircle,
      label: "Fallido",
      className: "bg-red-50 text-red-700 border-red-200",
      iconClassName: "text-red-500",
    },
    voicemail: {
      icon: Voicemail,
      label: "Buzón de voz",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      iconClassName: "text-amber-500",
    },
  };

  const { icon: Icon, label, className, iconClassName } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${iconClassName}`} />
      <span>{label}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: CallType }) {
  const config = {
    inbound: {
      icon: PhoneIncoming,
      label: "Entrante",
      className: "text-brand",
    },
    outbound: {
      icon: PhoneOutgoing,
      label: "Saliente",
      className: "text-accent-purple",
    },
  };

  const { icon: Icon, label, className } = config[type];

  return (
    <div className="inline-flex items-center gap-1.5 text-sm">
      <Icon className={`h-4 w-4 ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  const config = {
    happy: { icon: Smile, className: "text-emerald-500", label: "Feliz" },
    neutral: { icon: Meh, className: "text-amber-500", label: "Neutral" },
    angry: { icon: Frown, className: "text-red-500", label: "Enojado" },
  };

  const { icon: Icon, className, label } = config[sentiment];

  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className={`h-4 w-4 ${className}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

// Transcript Message Component
function TranscriptBubble({ message }: { message: TranscriptMessage }) {
  const isAI = message.role === "ai";

  return (
    <div className={`flex gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isAI
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-brand text-brand-foreground rounded-tr-sm"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isAI ? "text-muted-foreground" : "text-brand-foreground/70"}`}>
          {message.timestamp}
        </p>
      </div>
      {!isAI && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
          <User className="h-4 w-4 text-brand" />
        </div>
      )}
    </div>
  );
}

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter calls based on search
  const filteredCalls = callsData.filter(
    (call) =>
      call.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.customerPhone.includes(searchQuery) ||
      call.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Historial y Auditoría de Llamadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa y analiza todas las grabaciones y transcripciones de llamadas de voz IA.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o resumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Calls Table */}
        <Card className="py-0">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider max-w-[250px]">
                      Resumen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {call.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {call.customerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={call.type} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground font-mono">
                          {call.duration}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {call.date}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[250px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {call.summary}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCalls.length === 0 && (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron llamadas que coincidan con tu búsqueda.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedCall && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-lg">
                  {selectedCall.customerName}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-sm">
                      {selectedCall.customerPhone}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {selectedCall.id}
                    </span>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* Section 1: Recording */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Grabación ({selectedCall.duration})
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <audio controls className="w-full h-10">
                      <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  </div>
                </div>

                {/* Section 2: AI Analysis */}
                <Card className="py-4">
                  <CardHeader className="py-0 px-4">
                    <CardTitle className="text-sm font-medium">
                      Análisis IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-0 mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Resultado
                        </p>
                        <div className="flex items-center gap-1.5">
                          {selectedCall.wasSuccessful ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-600">
                                Exitosa
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600">
                                No exitosa
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Sentimiento
                        </p>
                        <SentimentIcon sentiment={selectedCall.sentiment} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Resumen
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedCall.fullSummary}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Transcript */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Transcripción
                  </h3>
                  <div className="space-y-3 rounded-lg border bg-muted/10 p-4 max-h-[400px] overflow-y-auto">
                    {selectedCall.transcript.map((message, index) => (
                      <TranscriptBubble key={index} message={message} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
