"use client";

import { useState } from "react";
import Link from "next/link";
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
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      className="hover:bg-muted/20 transition-colors"
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
                      <td className="px-4 py-3">
                        <Link href={`/calls/${call.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </Link>
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
    </>
  );
}
