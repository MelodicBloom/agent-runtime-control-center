import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const text = body?.message?.text ?? "";
  const chatId = body?.message?.chat?.id;
  // TODO: parse command, create task, dispatch workflow
  console.log("Telegram command received:", { chatId, text });
  return NextResponse.json({ ok: true, received: text });
}
