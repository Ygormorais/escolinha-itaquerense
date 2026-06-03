import Image from "next/image"
import { MatriculaForm } from "./matricula-form"

export const metadata = {
  title: "Pré-Matrícula",
  description: "Faça a pré-matrícula do seu filho na Escolinha Itaquerense.",
}

export default function MatriculaPage() {
  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <Image
            src="/logo.jpg"
            alt="E.C. Itaquerense"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-xl object-contain"
          />
          <h1 className="font-heading text-3xl font-bold text-brand-900">
            Pré-Matrícula
          </h1>
          <p className="mt-2 text-muted-foreground">
            Preencha os dados abaixo para iniciar o processo de matrícula.
            Entraremos em contato em até 48h.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-md sm:p-10">
          <MatriculaForm />
        </div>
      </div>
    </div>
  )
}
