"use server"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { getConfig as getFileConfig, saveConfig, type ClubConfig } from "@/lib/config"
import { registrarLog } from "@/app/actions/log"

const getCachedFileConfig = unstable_cache(
  async () => getFileConfig(),
  ["club-config"],
  { tags: ["config-clube"] }
)

export async function getClubConfig() {
  await requireAuth(["admin", "secretaria"])
  return getCachedFileConfig()
}

export async function updateClubConfig(data: ClubConfig) {
  await requireAuth(["admin"])
  saveConfig(data)
  void registrarLog("config_atualizada", "Configurações do clube atualizadas")
  revalidateTag("config-clube", { expire: 0 })
  revalidatePath("/recibos")
  revalidatePath("/configuracoes")
}
