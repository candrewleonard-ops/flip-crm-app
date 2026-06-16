export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

// Twilio API endpoint for sending SMS and initiating calls.
// Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER
// environment variables before use.

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, to, message } = body;

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_PHONE) {
    return NextResponse.json(
      {
        error: "Twilio credentials not configured",
        demo: true,
        message: `[DEMO MODE] Would send ${action} to ${to}: ${message || "call"}`,
      },
      { status: 200 }
    );
  }

  const twilioBase = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}`;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  try {
    if (action === "sms") {
      const response = await fetch(`${twilioBase}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE,
          Body: message,
        }),
      });
      const data = await response.json();
      return NextResponse.json({ success: true, sid: data.sid });
    }

    if (action === "call") {
      const response = await fetch(`${twilioBase}/Calls.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE,
          Url: "http://demo.twilio.com/docs/voice.xml",
        }),
      });
      const data = await response.json();
      return NextResponse.json({ success: true, sid: data.sid });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Twilio API error" }, { status: 500 });
  }
}

// Webhook handler for incoming Twilio events
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Twilio webhook endpoint ready" });
}
