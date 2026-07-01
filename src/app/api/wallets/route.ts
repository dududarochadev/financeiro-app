import { auth } from '@/lib/auth';
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/wallets — list wallets
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM public.wallets
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [session.user.id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallets — create wallet
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO public.wallets (user_id, name, description, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session.user.id, name.trim(), description || null, color || '#6366f1']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Error creating wallet:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/wallets — update wallet
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT 1 FROM public.wallets WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const result = await pool.query(
      `UPDATE public.wallets
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name || null, description ?? null, color || null, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating wallet:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wallets — hard delete wallet
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT 1 FROM public.wallets WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await pool.query('DELETE FROM public.wallets WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting wallet:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
