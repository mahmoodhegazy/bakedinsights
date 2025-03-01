export interface User {
    id: number;
    deactivated: boolean,
    name: string;
    username: string;
    email: string;
    role: string[];
    employee_id: string;
    phone: string;
    password?: string,
    is_admin_role?: boolean,
  }
  

export * from './checklist';
export * from './tables';