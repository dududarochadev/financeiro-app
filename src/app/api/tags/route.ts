import { auth } from '@/lib/auth';
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await pool.query('SELECT * FROM public.tags WHERE user_id = $1 ORDER BY name ASC', [session.user.id]);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Error fetching tags:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, color } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const result = await pool.query('INSERT INTO public.tags (user_id, name, color) VALUES ($1,$2,$3) ON CONFLICT (user_id, name) DO UPDATE SET color = COALESCE($3, tags.color) RETURNING *', [session.user.id, name.trim(), color || '#6b7280']);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Error creating tag:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const result = await pool.query('DELETE FROM public.tags WHERE id = $1 AND user_id = $2 RETURNING id', [id, session.user.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting tag:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
