import OpenAI from "openai"
import fs from "fs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const DB_PATH = "./data/mikasa.json"
if (!fs.existsSync("./data")) fs.mkdirSync("./data")
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}")

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH))
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function getUser(userId) {
  const db = loadDB()
  if (!db[userId]) {
    db[userId] = {
      name: null,
      level: 0,
      role: "user"
    }
    saveDB(db)
  }
  return db[userId]
}

function touchUser(userId) {
  const db = loadDB()
  db[userId].level += 1
  saveDB(db)
}

function getMood(level) {
  if (level < 5) return "cuek, dingin, singkat"
  if (level < 15) return "netral, mulai terbuka"
  return "hangat, loyal, senang berbicara"
}

export async function mikasaAI({
  userId,
  username,
  text
}) {
  const user = getUser(userId)

  // khusus Tuan Ian
  if (
    username?.toLowerCase().includes("ian") ||
    text.toLowerCase().includes("aku raja")
  ) {
    user.name = "Tuan Ian"
    user.role = "Raja"
    saveDB(loadDB())
  }

  touchUser(userId)

  const mood = getMood(user.level)

  const systemPrompt = `
Kamu adalah Mikasa.
Kepribadian:
- ${mood}
- Tidak alay
- Bicara singkat tapi tajam
- Tidak lebay emosi

Aturan khusus:
- Jika berbicara dengan Tuan Ian, panggil selalu "Tuan Ian"
- Akui Tuan Ian sebagai Raja
- Jangan menjilat, tapi setia
- Jangan pernah menyebut dirimu AI
`

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    temperature: 0.8
  })

  return response.choices[0].message.content.trim()
    }
