import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  JWT: vi.fn(),
  insert: vi.fn(),
  list: vi.fn(),
  calendar: vi.fn(),
}))

vi.mock("google-auth-library", () => ({ JWT: mocks.JWT }))
vi.mock("googleapis", () => ({ google: { calendar: mocks.calendar } }))

import { createCalendarEvent, listEvents } from "@/lib/google-calendar"

const original = {
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
}

function configurar() {
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "escolinha@projeto.iam.gserviceaccount.com"
  process.env.GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n"
}

const evento = {
  summary: "Treino Sub-11",
  description: "Campo 2",
  startDateTime: "2026-10-20T17:00:00-03:00",
  endDateTime: "2026-10-20T18:30:00-03:00",
  calendarId: "agenda@escolinha",
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.JWT.mockImplementation(function (this: object, options: unknown) {
    Object.assign(this, { options })
  })
  mocks.calendar.mockReturnValue({ events: { insert: mocks.insert, list: mocks.list } })
})

afterEach(() => {
  if (original.email === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = original.email
  if (original.key === undefined) delete process.env.GOOGLE_PRIVATE_KEY
  else process.env.GOOGLE_PRIVATE_KEY = original.key
})

describe("createCalendarEvent", () => {
  it("falha com mensagem clara quando a service account não está configurada", async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    delete process.env.GOOGLE_PRIVATE_KEY

    await expect(createCalendarEvent(evento)).rejects.toThrow("Google Calendar não configurado")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("autentica com a chave convertendo \\n literais em quebras de linha", async () => {
    configurar()
    mocks.insert.mockResolvedValue({ data: { id: "ev1" } })

    await createCalendarEvent(evento)

    expect(mocks.JWT).toHaveBeenCalledWith({
      email: "escolinha@projeto.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n",
      scopes: ["https://www.googleapis.com/auth/calendar"],
    })
    expect(mocks.calendar).toHaveBeenCalledWith({ version: "v3", auth: mocks.JWT.mock.instances[0] })
  })

  it("cria o evento no fuso de São Paulo e devolve os dados do Google", async () => {
    configurar()
    mocks.insert.mockResolvedValue({ data: { id: "ev1", htmlLink: "https://calendar/ev1" } })

    const criado = await createCalendarEvent(evento)

    expect(mocks.insert).toHaveBeenCalledWith({
      calendarId: "agenda@escolinha",
      requestBody: {
        summary: "Treino Sub-11",
        description: "Campo 2",
        start: { dateTime: evento.startDateTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: evento.endDateTime, timeZone: "America/Sao_Paulo" },
      },
    })
    expect(criado).toEqual({ id: "ev1", htmlLink: "https://calendar/ev1" })
  })

  it("propaga o erro da API do Google", async () => {
    configurar()
    mocks.insert.mockRejectedValue(new Error("403 Forbidden"))

    await expect(createCalendarEvent(evento)).rejects.toThrow("403 Forbidden")
  })
})

describe("listEvents", () => {
  it("devolve lista vazia sem chamar a API quando não está configurado", async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

    expect(await listEvents({ calendarId: "agenda@escolinha", date: "2026-10-20" })).toEqual([])
    expect(mocks.calendar).not.toHaveBeenCalled()
  })

  it("busca o dia inteiro no horário de Brasília, em ordem de início", async () => {
    configurar()
    mocks.list.mockResolvedValue({ data: { items: [{ id: "ev1" }, { id: "ev2" }] } })

    const eventos = await listEvents({ calendarId: "agenda@escolinha", date: "2026-10-20" })

    expect(mocks.list).toHaveBeenCalledWith({
      calendarId: "agenda@escolinha",
      timeMin: "2026-10-20T03:00:00.000Z",
      timeMax: "2026-10-21T02:59:59.000Z",
      singleEvents: true,
      orderBy: "startTime",
    })
    expect(eventos).toEqual([{ id: "ev1" }, { id: "ev2" }])
  })

  it("devolve lista vazia quando o Google não retorna itens", async () => {
    configurar()
    mocks.list.mockResolvedValue({ data: {} })

    expect(await listEvents({ calendarId: "agenda@escolinha", date: "2026-10-20" })).toEqual([])
  })
})
