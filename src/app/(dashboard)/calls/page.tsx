import { createClient } from "@/lib/supabase/server";
import CallsTableClient, { CallRecord, CallStatus, CallType, Sentiment, TranscriptMessage } from "./calls-table-client";

// Demo Data - 10 realistic call scenarios (fallback for users with no calls)
const demoData: CallRecord[] = [
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

// Helper function to convert duration seconds to "Xm Ys" format
function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return "0m 0s";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

// Helper function to format date to readable string
function formatDate(dateString: string | null): string {
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
function mapStatus(status: string | null): CallStatus {
  if (!status) return "failed";
  const statusLower = status.toLowerCase();
  // 'ended' -> 'success' (displays as "Completada")
  if (statusLower === "ended" || statusLower === "completed") return "success";
  // 'ringing' -> 'failed' (displays as "Fallido" - could be extended to "Llamando" in future)
  if (statusLower === "ringing" || statusLower === "in-progress") return "failed";
  if (statusLower === "voicemail") return "voicemail";
  return "failed";
}

// Map Supabase call data to CallRecord format
function mapCallToRecord(call: any): CallRecord {
  const durationSeconds = call.duration_seconds ? Number(call.duration_seconds) : 0;
  const status = mapStatus(call.status);
  const customerPhone = call.customer_number || "Desconocido";
  
  // Parse transcript if available (assuming it's stored as text, we'll create a simple structure)
  let transcript: TranscriptMessage[] = [];
  if (call.transcript) {
    try {
      // Try to parse as JSON first
      const parsed = typeof call.transcript === "string" ? JSON.parse(call.transcript) : call.transcript;
      if (Array.isArray(parsed)) {
        transcript = parsed;
      } else {
        // If it's a plain string, create a simple transcript entry
        transcript = [
          {
            role: "ai",
            text: call.transcript,
            timestamp: "0:00",
          },
        ];
      }
    } catch {
      // If parsing fails, treat as plain text
      transcript = [
        {
          role: "ai",
          text: call.transcript,
          timestamp: "0:00",
        },
      ];
    }
  }

  // Determine sentiment from analysis_data or default to neutral
  let sentiment: Sentiment = "neutral";
  if (call.analysis_data && typeof call.analysis_data === "object") {
    const sentimentValue = call.analysis_data.sentiment?.toLowerCase();
    if (sentimentValue === "happy" || sentimentValue === "positive") sentiment = "happy";
    else if (sentimentValue === "angry" || sentimentValue === "negative") sentiment = "angry";
  }

  // Determine if call was successful (ended status and no error)
  const wasSuccessful = status === "success" && call.ended_reason !== "error";

  const createdDate = call.created_at || call.started_at || new Date().toISOString();
  const dateFormatted = formatDate(createdDate);

  return {
    id: call.id || call.vapi_call_id || `call-${Date.now()}`,
    status,
    customerName: "Desconocido", // No name field in schema, use "Desconocido"
    customerPhone,
    type: "inbound" as CallType, // Default to inbound as per requirements
    duration: formatDuration(durationSeconds),
    durationSeconds,
    date: dateFormatted,
    dateRaw: createdDate,
    summary: call.summary || "Sin resumen",
    fullSummary: call.summary || "Procesando...",
    sentiment,
    wasSuccessful,
    recordingUrl: call.recording_url || "",
    transcript,
  };
}

export default async function CallsPage() {
  const supabase = await createClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Fetch calls from Supabase
  let realCalls: CallRecord[] = [];
  if (user && !userError) {
    const { data: callsData, error: callsError } = await supabase
      .from("calls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!callsError && callsData) {
      realCalls = callsData.map(mapCallToRecord);
    }
  }

  // Determine if we should use demo mode
  const isDemoMode = !realCalls || realCalls.length === 0;
  const callsToDisplay = isDemoMode ? demoData : realCalls;

  return <CallsTableClient calls={callsToDisplay} isDemoMode={isDemoMode} />;
}
