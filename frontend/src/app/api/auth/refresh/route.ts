import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.sub, deletedAt: null } });
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    const newPayload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
