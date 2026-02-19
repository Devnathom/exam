import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId: string | null;
}

export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string | null;
}
