"use client"
import { RouteError } from "@/components/ui/route-error"
export default function Error({ reset }: { error: Error; reset: () => void }) { return <RouteError title="Não foi possível abrir desenvolvimento" reset={reset} /> }
