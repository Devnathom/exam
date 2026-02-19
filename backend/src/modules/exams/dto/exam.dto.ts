import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChoiceDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกตัวเลือก' })
  label!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกเนื้อหาตัวเลือก' })
  content!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionDto {
  @IsNumber()
  @Min(1)
  questionNumber!: number;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกคำถาม' })
  content!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChoiceDto)
  choices!: CreateChoiceDto[];
}

export class CreateExamDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อข้อสอบ' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกวิชา' })
  subject!: string;

  @IsNumber()
  @Min(1)
  @Max(200)
  totalQuestions!: number;

  @IsNumber()
  @Min(2)
  @Max(6)
  @IsOptional()
  choicesPerQuestion?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @IsOptional()
  questions?: CreateQuestionDto[];
}

export class UpdateExamDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class GenerateVersionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'กรุณาระบุรหัสชุดข้อสอบ' })
  versionCodes!: string[];

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleChoices?: boolean;
}
