import { NextResponse } from "next/server";
import { isSetupComplete } from "@/lib/db/local";

export async function GET() {
  const done = await isSetupComplete();
  return NextResponse.json({ setupComplete: done });
}