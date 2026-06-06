"use client"

import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type { ClubConfig } from "@/lib/config"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { QRCodeSVG } from "qrcode.react"
import { gerarHmacQr } from "@/lib/qr"

type Aluno = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  dataMatricula: Date
  status: string
  foto: string | null
}

export function CarteirinhaView({
  aluno,
  config,
  validade,
  emissao,
}: {
  aluno: Aluno
  config: ClubConfig
  validade: string
  emissao: string
}) {
  const nascimento = format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })
  const matricula = String(aluno.id).padStart(6, "0")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const qrUrl = `${appUrl}/qr/${aluno.id}?h=${gerarHmacQr(aluno.id)}`

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #carteirinha-print, #carteirinha-print * { visibility: visible !important; }
          #carteirinha-print {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center gap-3 p-6 border-b">
        <Link href={`/alunos/${aluno.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-lg">Carteirinha — {aluno.nome}</h1>
        <Button
          onClick={() => window.print()}
          className="ml-auto bg-brand-800 text-white hover:bg-brand-900 gap-2"
        >
          <Printer className="size-4" />
          Imprimir PDF
        </Button>
      </div>

      {/* Preview */}
      <div className="no-print flex items-center justify-center py-12 bg-muted/30 min-h-[calc(100vh-73px)]">
        <div id="carteirinha-print">
          <Carteirinha aluno={aluno} config={config} validade={validade} emissao={emissao} nascimento={nascimento} matricula={matricula} qrUrl={qrUrl} />
        </div>
      </div>
    </>
  )
}

function Carteirinha({
  aluno, config, validade, emissao, nascimento, matricula, qrUrl,
}: {
  aluno: Aluno
  config: ClubConfig
  validade: string
  emissao: string
  nascimento: string
  matricula: string
  qrUrl: string
}) {
  return (
    /* Tamanho padrão cartão: 85.6mm × 54mm */
    <div
      style={{
        width: 342,      // 85.6mm @ 96dpi
        height: 216,     // 54mm @ 96dpi
        fontFamily: "Arial, sans-serif",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
        display: "flex",
        flexDirection: "column",
        background: "white",
      }}
    >
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a3c34 0%, #2d6a5e 100%)",
        padding: "10px 14px 8px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {/* Bola de futebol SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
            <path d="M12 2 C7 5 5 10 12 12 C19 14 17 19 12 22" stroke="white" strokeWidth="1.2" fill="none"/>
            <path d="M2 12 C5 7 10 5 12 12 C14 19 19 17 22 12" stroke="white" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>
        <div>
          <p style={{ color: "white", fontWeight: 700, fontSize: 11, margin: 0, lineHeight: 1.2 }}>
            {config.nome}
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, margin: 0 }}>
            CARTEIRA DE IDENTIFICAÇÃO
          </p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 7, margin: 0 }}>Nº MATRÍCULA</p>
          <p style={{ color: "white", fontWeight: 700, fontSize: 10, margin: 0, fontFamily: "monospace" }}>
            {matricula}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", padding: "10px 14px", gap: 12 }}>
        {/* Foto + QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div style={{
            width: 72, height: 96,
            borderRadius: 6, overflow: "hidden",
            border: "1px solid #e5e7eb",
            background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {aluno.foto ? (
              <Image
                src={aluno.foto}
                alt="Foto"
                width={72}
                height={96}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 8 }}>
            <QRCodeSVG value={qrUrl} size={80} level="M" />
            <span style={{ fontSize: 9, color: "#999" }}>Presença</span>
          </div>
        </div>

        {/* Dados */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div>
            <p style={{ color: "#6b7280", fontSize: 7, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nome</p>
            <p style={{ color: "#111827", fontWeight: 700, fontSize: 11, margin: 0, lineHeight: 1.2 }}>
              {aluno.nome}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Nascimento</p>
              <p style={{ color: "#374151", fontSize: 9, fontWeight: 600, margin: 0 }}>{nascimento}</p>
            </div>
            <div>
              <p style={{ color: "#6b7280", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Turma</p>
              <p style={{ color: "#374151", fontSize: 9, fontWeight: 600, margin: 0 }}>{aluno.turma}</p>
            </div>
          </div>

          <div>
            <p style={{ color: "#6b7280", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Horário</p>
            <p style={{ color: "#374151", fontSize: 9, fontWeight: 600, margin: 0 }}>{aluno.horario}</p>
          </div>

          <div>
            <p style={{ color: "#6b7280", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Responsável</p>
            <p style={{ color: "#374151", fontSize: 9, fontWeight: 600, margin: 0 }}>{aluno.responsavel || "—"}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        padding: "5px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <p style={{ color: "#9ca3af", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Emissão</p>
            <p style={{ color: "#374151", fontSize: 8, fontWeight: 600, margin: 0 }}>{emissao}</p>
          </div>
          <div>
            <p style={{ color: "#9ca3af", fontSize: 7, margin: 0, textTransform: "uppercase" }}>Validade</p>
            <p style={{ color: "#374151", fontSize: 8, fontWeight: 600, margin: 0 }}>{validade}</p>
          </div>
        </div>
        <div style={{
          background: aluno.status === "Ativo" ? "#dcfce7" : "#fee2e2",
          color: aluno.status === "Ativo" ? "#16a34a" : "#dc2626",
          borderRadius: 99, padding: "2px 8px",
          fontSize: 8, fontWeight: 700,
        }}>
          {aluno.status.toUpperCase()}
        </div>
      </div>
    </div>
  )
}
