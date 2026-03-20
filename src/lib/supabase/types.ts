export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  | "super_admin"
  | "company_admin"
  | "payroll_analyst"
  | "viewer";

// The project is evolving toward generated Supabase types, but for now
// we keep the client generic permissive so the repository and server
// services can evolve without blocking the migration.
export type Database = any;
