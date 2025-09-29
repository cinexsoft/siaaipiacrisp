import { NextRequest, NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ disabled: true }, { status: 410 }); }


