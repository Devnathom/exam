import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class SubmitScanDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสข้อสอบ' })
  examId!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสนักเรียน' })
  studentCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสชุดข้อสอบ' })
  versionCode!: string;

  @IsObject()
  @IsNotEmpty({ message: 'กรุณาระบุคำตอบ' })
  answers!: Record<string, string>;

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสโรงเรียน' })
  schoolId!: string;
}
