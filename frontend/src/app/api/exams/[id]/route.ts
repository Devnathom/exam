import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, schoolId: user.schoolId || undefined },
      include: {
        questions: { include: { choices: true }, orderBy: { questionNumber: 'asc' } },
        examVersions: true,
      },
    });
    if (!exam) return NextResponse.json({ message: 'ไม่พบข้อสอบ' }, { status: 404 });

    return NextResponse.json(exam);
  } catch {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        title: body.title,
        subject: body.subject,
        description: body.description,
        totalQuestions: body.totalQuestions,
        choicesPerQuestion: body.choicesPerQuestion,
        status: body.status,
      },
    });

    return NextResponse.json(exam);
  } catch {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await prisma.exam.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'ลบข้อสอบสำเร็จ' });
  } catch {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
