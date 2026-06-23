"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { getConfig as getFileConfig, saveConfig, type ClubConfig } from "@/lib/config"

export async function getClubConfig() {
  return getFileConfig()
}

export async function updateClubConfig(data: ClubConfig) {
  await requireAuth(["admin"])
  saveConfig(data)
  revalidatePath("/recibos")
  revalidatePath("/configuracoes")
}
