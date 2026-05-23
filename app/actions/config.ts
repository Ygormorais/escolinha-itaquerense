"use server"

import { revalidatePath } from "next/cache"
import { getConfig, saveConfig, type ClubConfig } from "@/lib/config"

export async function getClubConfig() {
  return getConfig()
}

export async function updateClubConfig(data: ClubConfig) {
  saveConfig(data)
  revalidatePath("/recibos")
  revalidatePath("/configuracoes")
}
