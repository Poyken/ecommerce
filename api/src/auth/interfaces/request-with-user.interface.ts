import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    email: string;
    permissions: string[];
    jti?: string;
    [key: string]: any;
  };
}
