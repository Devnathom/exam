import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกรหัสนักเรียน' })
  studentCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อ' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกนามสกุล' })
  lastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกห้องเรียน' })
  classroom!: string;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  studentCode?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  classroom?: string;
}

export class StudentQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  classroom?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
