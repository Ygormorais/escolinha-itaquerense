"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { getConfig as getFileConfig, saveConfig, type ClubConfig } from "@/lib/config"
import { registrarLog } from "@/app/actions/log"

export async function getClubConfig() {
  await requireAuth(["admin", "secretaria"])
  return getFileConfig()
}

export async function updateClubConfig(data: ClubConfig) {
  await requireAuth(["admin"])
  saveConfig(data)
  void registrarLog("config_atualizada", "Configurações do clube atualizadas")
  revalidatePath("/recibos")
  revalidatePath("/configuracoes")
}
