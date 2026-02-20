import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const classroom = url.searchParams.get('classroom') || '';

    const where: any = { schoolId: user.schoolId, deletedAt: null };
    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (classroom) where.classroom = classroom;

    const [data, total] = await Promise.all([
      prisma.student.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { studentCode: 'asc' } }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('Students GET error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const student = await prisma.student.create({
      data: { ...body, schoolId: user.schoolId },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error('Students POST error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
