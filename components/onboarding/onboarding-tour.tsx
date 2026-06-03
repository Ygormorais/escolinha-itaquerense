"use client"

import { X, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

const STEPS = [
  {
    title: "Bem-vindo!",
    content: "Este é o painel da Escolinha Itaquerense. Vamos te mostrar as principais funcionalidades em 8 passos rápidos.",
  },
  {
    title: "Dashboard",
    content: "Aqui você vê um resumo de tudo: alunos ativos, receita do mês, inadimplência e presença média. Os gráficos mostram a evolução mensal.",
  },
  {
    title: "Alunos",
    content: "Cadastre e gerencie todos os alunos. Veja histórico de pagamentos, frequência, uniformes e muito mais. Use a busca global (Ctrl+K) para encontrar rapidamente.",
  },
  {
    title: "Pagamentos & Caixa",
    content: "Registre pagamentos, veja recebimentos por PIX, boleto, cartão (importe CSV da maquininha) e gerencie descontos. O relatório financeiro consolida tudo.",
  },
  {
    title: "Frequência & Agenda",
    content: "Lance a presença dos alunos por turma e data. A agenda registra treinos, jogos e eventos. Tudo integrado.",
  },
  {
    title: "Campeonatos",
    content: "Organize campeonatos, inscreva alunos, registre partidas com placar e veja a classificação automaticamente.",
  },
  {
    title: "Comunicados & WhatsApp",
    content: "Envie comunicados em massa ou cobranças individuais via WhatsApp. O chatbot AI responde dúvidas automaticamente.",
  },
  {
    title: "Pronto!",
    content: "Explore as outras seções como relatórios, histórico de auditoria, configurações e o portal do responsável. Qualquer dúvida, use o menu de ajuda.",
  },
]

export function OnboardingTour() {
  const { active, currentStep, totalSteps, next, prev, skip, complete } = useOnboarding()

  if (!active) return null
  if (typeof window !== "undefined" && window.location.pathname === "/login") return null

  const step = STEPS[currentStep] ?? STEPS[0]
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground">
            Passo {currentStep + 1} de {totalSteps}
          </span>
          <button onClick={skip} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-2 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? "bg-brand-600" : "bg-muted"}`}
            />
          ))}
        </div>

        <h2 className="font-heading text-lg font-bold text-ink-950 mb-2">{step.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={isFirst ? skip : prev}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {isFirst ? "Pular" : <><ChevronLeft className="size-4" /> Anterior</>}
          </button>
          <button
            onClick={isLast ? complete : next}
            className="flex items-center gap-1 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 transition-colors"
          >
            {isLast ? <><Check className="size-4" /> Concluir</> : <>Próximo <ChevronRight className="size-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
