'use server'

import pool from '@/lib/postgres';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
  try {
    const client = await pool.connect();
    try {
      // Delete from auth.users - this should cascade to public.profiles
      // Note: This requires the database user to have permission to delete from auth.users
      // If this fails, we might need to fallback to deleting from public.profiles
      await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);
      
      revalidatePath('/dashboard/usuarios');
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}
