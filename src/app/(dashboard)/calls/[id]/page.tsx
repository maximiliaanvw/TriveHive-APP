import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Voicemail, PhoneIncoming, PhoneOutgoing, Smile, Meh, Frown, Bot, User, Clock, Hash } from "lucide-react";
import Link from "next/link";
import { formatDate, formatDuration, mapStatus } from "../call-utils";
import type { CallRecord, CallStatus, CallType, Sentiment, TranscriptMessage } from "../calls-table-client";

// Re-export types for use in this page
export type { CallRecord, CallStatus, CallType, Sentiment, TranscriptMessage } from "../calls-table-client";

export const metadata: Metadata = {
  title: "Detalle de Llamada | TriveHive",
};

// Status components
function StatusBadge({ status }: { status: CallStatus }) {
  const config = {
    success: {
      icon: CheckCircle2,
      label: "Completada",
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
      <span className="text-sm text-foreground font-medium">{label}</span>
    </div>
  );
}

// Transcript Message Component
function TranscriptBubble({ message }: { message: TranscriptMessage }) {
  const isAI = message.role === "ai";

  if (isAI) {
    // Mensajes de la IA a la izquierda
    return (
      <div className="flex items-end gap-2 mb-4 justify-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col max-w-[75%] items-start">
          <div className="rounded-2xl rounded-tl-sm bg-muted text-foreground px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
          </div>
          <p className="text-[10px] mt-1 px-1 text-muted-foreground">
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  // Mensajes del usuario a la derecha (estilo WhatsApp azul)
  return (
    <div className="flex items-end gap-2 mb-4 justify-end">
      <div className="flex flex-col max-w-[75%] items-end">
        <div className="rounded-2xl rounded-tr-sm bg-[#0084ff] text-white px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <p className="text-[10px] mt-1 px-1 text-muted-foreground text-right">
          {message.timestamp}
        </p>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0084ff]/20 flex items-center justify-center border border-[#0084ff]/30">
        <User className="h-4 w-4 text-[#0084ff]" />
      </div>
    </div>
  );
}

// Parse transcript text format (e.g., "AI: text\nUser: text")
function parseTranscriptText(text: string): TranscriptMessage[] {
  const messages: TranscriptMessage[] = [];
  
  // Try to split by lines or by "AI:" / "User:" patterns
  // Handle both formats: line-by-line and continuous text with prefixed roles
  const textNormalized = text.trim();
  
  // Pattern to match "AI:" or "User:" followed by text
  const rolePattern = /(AI|User):\s*/gi;
  const parts: Array<{ role: "ai" | "user"; text: string }> = [];
  
  let lastIndex = 0;
  let matches: RegExpExecArray | null;
  
  // Find all role markers
  while ((matches = rolePattern.exec(textNormalized)) !== null) {
    const role = matches[1].toLowerCase() === "user" ? "user" : "ai";
    const startIndex = matches.index + matches[0].length;
    
    // Find the next role marker or end of string
    const nextMatch = rolePattern.exec(textNormalized);
    rolePattern.lastIndex -= matches[0].length; // Reset for next iteration
    
    const endIndex = nextMatch ? nextMatch.index : textNormalized.length;
    const messageText = textNormalized.substring(startIndex, endIndex).trim();
    
    if (messageText) {
      parts.push({ role, text: messageText });
    }
    
    // Move to the position after the current match
    rolePattern.lastIndex = endIndex;
  }
  
  // If no matches found, check if entire text is just one message
  if (parts.length === 0) {
    // Try splitting by newlines first
    const lines = textNormalized.split(/\n+/).filter(l => l.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const lineMatch = trimmedLine.match(/^(AI|User):\s*(.+)$/i);
      
      if (lineMatch) {
        const role = lineMatch[1].toLowerCase() === "user" ? "user" : "ai";
        const messageText = lineMatch[2].trim();
        if (messageText) {
          parts.push({ role, text: messageText });
        }
      } else if (parts.length > 0) {
        // Continuation of previous message
        parts[parts.length - 1].text += " " + trimmedLine;
      } else {
        // First line without role prefix, assume AI
        parts.push({ role: "ai", text: trimmedLine });
      }
    }
  }
  
  // Convert to TranscriptMessage format with timestamps
  parts.forEach((part, index) => {
    const timestamp = `${Math.floor(index * 5 / 60)}:${String((index * 5) % 60).padStart(2, "0")}`;
    messages.push({
      role: part.role,
      text: part.text.replace(/\n+/g, " ").trim(),
      timestamp,
    });
  });
  
  return messages.length > 0 ? messages : [
    {
      role: "ai",
      text: textNormalized.replace(/\n+/g, " ").trim(),
      timestamp: "0:00",
    },
  ];
}

// Map Supabase call data to CallRecord format
function mapCallToRecord(call: any): CallRecord {
  const durationSeconds = call.duration_seconds ? Number(call.duration_seconds) : 0;
  const status = mapStatus(call.status);
  const customerPhone = call.customer_number || "Desconocido";
  
  // Parse transcript if available
  let transcript: TranscriptMessage[] = [];
  if (call.transcript) {
    try {
      const parsed = typeof call.transcript === "string" ? JSON.parse(call.transcript) : call.transcript;
      if (Array.isArray(parsed)) {
        transcript = parsed;
      } else if (typeof parsed === "string") {
        // Parse text format like "AI: text\nUser: text"
        transcript = parseTranscriptText(parsed);
      } else {
        transcript = [
          {
            role: "ai",
            text: call.transcript,
            timestamp: "0:00",
          },
        ];
      }
    } catch {
      // If JSON parse fails, try to parse as text
      if (typeof call.transcript === "string") {
        transcript = parseTranscriptText(call.transcript);
      } else {
        transcript = [
          {
            role: "ai",
            text: String(call.transcript),
            timestamp: "0:00",
          },
        ];
      }
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
    customerName: "Desconocido",
    customerPhone,
    type: (call.type === "outbound" ? "outbound" : "inbound") as CallType,
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

async function getCallById(callId: string) {
  const supabase = await createClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return null;
  }

  // Fetch call from Supabase
  const { data: callData, error: callError } = await supabase
    .from("calls")
    .select("*")
    .eq("id", callId)
    .eq("user_id", user.id)
    .single();

  // If no real call found, check if it's a demo call ID
  if (callError || !callData) {
    // Import demo data dynamically to check
    const { demoData } = await import("../page");
    const demoCall = demoData.find((call) => call.id === callId);
    if (demoCall) {
      return demoCall;
    }
    return null;
  }

  return mapCallToRecord(callData);
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 16
  const { id } = await params;

  // Get current user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch call data
  const callData = await getCallById(id);

  if (!callData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/calls">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a Llamadas
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {callData.customerName}
        </h1>
        <p className="text-muted-foreground mt-1">{callData.customerPhone}</p>
      </div>

      {/* Call Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la Llamada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <div className="mt-1">
                <StatusBadge status={callData.status} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <div className="mt-1">
                <TypeBadge type={callData.type} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duración</p>
              <p className="text-sm text-foreground mt-1 font-mono">
                {callData.duration}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-sm text-foreground mt-1">
                {new Date(callData.dateRaw).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID de Llamada</p>
              <p className="text-sm text-foreground mt-1 font-mono text-xs">
                {callData.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análisis IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resultado</p>
              <div className="flex items-center gap-1.5 mt-1">
                {callData.wasSuccessful ? (
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
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sentimiento</p>
              <div className="mt-1">
                <SentimentIcon sentiment={callData.sentiment} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resumen</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                {callData.fullSummary}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recording Section */}
      {callData.recordingUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Grabación ({callData.duration})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4">
              <audio controls className="w-full h-10">
                <source src={callData.recordingUrl} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Section */}
      {callData.transcript && callData.transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transcripción</CardTitle>
            <CardDescription>
              Conversación completa de la llamada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-background p-4 max-h-[600px] overflow-y-auto">
              {callData.transcript.map((message, index) => (
                <TranscriptBubble key={index} message={message} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
