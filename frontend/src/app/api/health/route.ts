import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Exam OMR System API',
    time: new Date().toISOString(),
  });
}
