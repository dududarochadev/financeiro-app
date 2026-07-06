import { auth } from '@/lib/auth';
import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RecurrenceEditScope } from '@/lib/types';

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

    // Verify ownership and get series info
    const ownerCheck = await pool.query(
      'SELECT template_id, month, year FROM public.transactions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, session.user.id]
    );
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tx = ownerCheck.rows[0];
    const rootId = tx.template_id || id;

    // When scope != 'this', exclude per-occurrence structural fields
    // so month/year aren't overwritten on all occurrences in the series
    // installment_total is excluded here so it CAN be changed with scope=all
    const structuralFields = new Set([
      'month', 'year', 'installment_current',
      'template_id', 'wallet_id', 'user_id', 'paid_amount', 'paid_at',
    ]);

    const setEntries = Object.entries(updates)
      .filter(([k, v]) => v !== undefined && (scope === 'this' || !structuralFields.has(k)));
    if (setEntries.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    const setClauses = setEntries.map(([key], i) => `"${key}" = $${i + 1}`);
    const setValues = setEntries.map(([_, value]) => value);

    // Build WHERE clause based on scope
    let whereClause: string;
    let whereValues: any[];

    if (!scope || scope === 'this') {
      whereClause = `id = $${setClauses.length + 1}`;
      whereValues = [id];
    } else {
      whereClause = `(id = $${setClauses.length + 1} OR template_id = $${setClauses.length + 1})`;
      whereValues = [rootId];

      if (scope === 'this_and_future') {
        whereClause += ` AND (year > $${setClauses.length + 2} OR (year = $${setClauses.length + 2} AND month >= $${setClauses.length + 3}))`;
        whereValues.push(tx.year, tx.month);
      }
    }

    setClauses.push('updated_at = NOW()');

    const allParams = [...setValues, ...whereValues];

    await pool.query(
      `UPDATE public.transactions SET ${setClauses.join(', ')} WHERE ${whereClause} AND deleted_at IS NULL`,
      allParams
    );

    // Handle installment_total changes — create or delete rows as needed
    if (scope && scope !== 'this' && updates.installment_total !== undefined) {
      const newTotal = updates.installment_total;

      // Find current max installment in the series
      const seriesQuery = await pool.query(
        `SELECT MAX(installment_current) as max_current
         FROM public.transactions
         WHERE (id = $1 OR template_id = $1) AND deleted_at IS NULL`,
        [rootId]
      );
      const oldMaxCurrent = seriesQuery.rows[0]?.max_current || 0;

      if (newTotal > oldMaxCurrent) {
        // Create new installment rows
        // Get reference data from the first installment
        const refQuery = await pool.query(
          `SELECT * FROM public.transactions WHERE id = $1 AND deleted_at IS NULL`,
          [rootId]
        );
        if (refQuery.rows.length === 0) {
          return NextResponse.json({ error: 'Reference row not found' }, { status: 500 });
        }
        const ref = refQuery.rows[0];

        // Find the last active installment to determine starting month/year
        const lastQuery = await pool.query(
          `SELECT * FROM public.transactions
           WHERE (id = $1 OR template_id = $1) AND deleted_at IS NULL
           ORDER BY year DESC, month DESC LIMIT 1`,
          [rootId]
        );
        const last = lastQuery.rows[0];

        // Build base data, merging any PATCH updates
        // Note: paid_amount is intentionally omitted so the DB default (0) is used,
        // matching how POST creates installment rows
        const baseData: Record<string, any> = {
          wallet_id: ref.wallet_id,
          user_id: ref.user_id,
          type: ref.type,
          title: updates.title ?? ref.title,
          description: updates.description ?? ref.description,
          expected_amount: updates.expected_amount ?? ref.expected_amount,
          status: 'pending',
          group: updates.group ?? ref.group,
          recurrence_type: 'none',
          template_id: rootId,
        };

        const newRows: Record<string, any>[] = [];
        let occMonth = last.month + 1;
        let occYear = last.year;
        if (occMonth > 12) { occMonth = 1; occYear++; }

        for (let i = oldMaxCurrent + 1; i <= newTotal; i++) {
          newRows.push({
            ...baseData,
            month: occMonth,
            year: occYear,
            installment_current: i,
            installment_total: newTotal,
          });
          occMonth++;
          if (occMonth > 12) { occMonth = 1; occYear++; }
        }

        if (newRows.length > 0) {
          const cols = Object.keys(newRows[0]).join(', ');
          const valPlaceholders = newRows.map((_, i) => {
            const row = newRows[i];
            return '(' + Object.keys(row).map((_, j) => `$${i * Object.keys(row).length + j + 1}`).join(', ') + ')';
          }).join(', ');
          const flatValues = newRows.flatMap(Object.values);
          await pool.query(`INSERT INTO public.transactions (${cols}) VALUES ${valPlaceholders}`, flatValues);
        }
      }

      if (newTotal < oldMaxCurrent) {
        // Soft-delete rows beyond the new total
        await pool.query(
          `UPDATE public.transactions SET deleted_at = NOW()
           WHERE (id = $1 OR template_id = $1)
           AND installment_current > $2
           AND deleted_at IS NULL`,
          [rootId, newTotal]
        );
      }
    }

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
    const scope = searchParams.get('scope') as RecurrenceEditScope | null;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Verify ownership and get series info
    const ownerCheck = await pool.query(
      'SELECT template_id, month, year FROM public.transactions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, session.user.id]
    );
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tx = ownerCheck.rows[0];
    const rootId = tx.template_id || id;

    let whereClause: string;
    const params: any[] = [];

    if (!scope || scope === 'this') {
      whereClause = 'id = $1';
      params.push(id);
    } else {
      whereClause = '(id = $1 OR template_id = $1)';
      params.push(rootId);

      if (scope === 'this_and_future') {
        whereClause += ' AND (year > $2 OR (year = $2 AND month >= $3))';
        params.push(tx.year, tx.month);
      }
    }

    await pool.query(
      `UPDATE public.transactions SET deleted_at = NOW() WHERE ${whereClause} AND deleted_at IS NULL`,
      params
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
