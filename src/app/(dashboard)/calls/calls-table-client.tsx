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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// Types
export type CallStatus = "success" | "failed" | "voicemail";
export type CallType = "inbound" | "outbound";
export type Sentiment = "happy" | "neutral" | "angry";

export interface TranscriptMessage {
  role: "ai" | "user";
  text: string;
  timestamp: string;
}

export interface CallRecord {
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

interface CallsTableClientProps {
  calls: CallRecord[];
  isDemoMode: boolean;
}

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

export default function CallsTableClient({ calls, isDemoMode }: CallsTableClientProps) {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter calls based on search
  const filteredCalls = calls.filter(
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

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              ✨ Vista de Demostración: Así se verá tu panel cuando recibas tu primera llamada.
            </AlertDescription>
          </Alert>
        )}

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
