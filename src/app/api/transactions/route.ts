import { auth } from '@/lib/auth';
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get('wallet_id');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const status = searchParams.get('status');

  if (!walletId || !month || !year) {
    return NextResponse.json({ error: 'wallet_id, month, year required' }, { status: 400 });
  }

  let query = `SELECT * FROM public.transactions WHERE user_id = $1 AND wallet_id = $2 AND month = $3 AND year = $4 AND deleted_at IS NULL`;
  const params: any[] = [session.user.id, walletId, parseInt(month), parseInt(year)];
  let paramIndex = 5;

  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ' ORDER BY due_date ASC NULLS LAST, created_at ASC';

  try {
    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { wallet_id, type, title, description, expected_amount, paid_amount, status: txStatus, group, due_date, month, year, recurrence_type, recurrence_interval, recurrence_end_date, installment_current, installment_total } = body;

    const insertResult = await pool.query(
      `INSERT INTO public.transactions (wallet_id, user_id, type, title, description, expected_amount, paid_amount, status, "group", due_date, month, year, recurrence_type, recurrence_interval, recurrence_end_date, installment_current, installment_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [wallet_id, session.user.id, type, title, description || null, expected_amount, paid_amount || null, txStatus || 'pending', group || 'Outros', due_date || null, month, year, recurrence_type || 'none', recurrence_interval || null, recurrence_end_date || null, installment_current || null, installment_total || null]
    );

    const transaction = insertResult.rows[0];
    const occurrences: any[] = [];

    if (installment_total && installment_total > 1) {
      for (let i = 2; i <= installment_total; i++) {
        let occMonth = month + (i - 1);
        let occYear = year;
        while (occMonth > 12) { occMonth -= 12; occYear++; }
        occurrences.push({ wallet_id, user_id: session.user.id, type, title, expected_amount, status: 'pending', group: group || 'Outros', month: occMonth, year: occYear, recurrence_type: 'none', installment_current: i, installment_total, template_id: transaction.id });
      }
    }

    if (recurrence_type === 'monthly' && !installment_total) {
      const endDate = recurrence_end_date ? new Date(recurrence_end_date) : null;
      let occMonth = month + 1;
      let occYear = year;
      for (let i = 0; i < 60; i++) {
        while (occMonth > 12) { occMonth -= 12; occYear++; }
        const occDate = new Date(occYear, occMonth - 1, 1);
        if (endDate && occDate > endDate) break;
        let occDueDate = null;
        if (due_date) { const day = new Date(due_date).getDate(); occDueDate = `${occYear}-${String(occMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`; }
        occurrences.push({ wallet_id, user_id: session.user.id, type, title, expected_amount, status: 'pending', group: group || 'Outros', month: occMonth, year: occYear, recurrence_type: 'monthly', template_id: transaction.id, due_date: occDueDate });
        occMonth++;
      }
    }

    if (occurrences.length > 0) {
      const cols = Object.keys(occurrences[0]).join(', ');
      const valPlaceholders = occurrences.map((_, i) => {
        const row = occurrences[i];
        return '(' + Object.keys(row).map((_, j) => `$${i * Object.keys(row).length + j + 1}`).join(', ') + ')';
      }).join(', ');
      const flatValues = occurrences.flatMap(Object.values);
      await pool.query(`INSERT INTO public.transactions (${cols}) VALUES ${valPlaceholders}`, flatValues);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, scope, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const ownerCheck = await pool.query('SELECT 1 FROM public.transactions WHERE id = $1 AND user_id = $2', [id, session.user.id]);
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) { setClauses.push(`"${key}" = $${paramIdx}`); params.push(value); paramIdx++; }
    }
    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    await pool.query(`UPDATE public.transactions SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`, params);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating transaction:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const ownerCheck = await pool.query('SELECT 1 FROM public.transactions WHERE id = $1 AND user_id = $2', [id, session.user.id]);
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await pool.query('UPDATE public.transactions SET deleted_at = NOW() WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
