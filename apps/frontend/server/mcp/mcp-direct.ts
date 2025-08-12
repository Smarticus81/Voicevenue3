import { eq, like, sql } from 'drizzle-orm';
import { drinks as Drinks } from '@/server/db/schema';
import { db as sharedDb } from '../db/client';

type ToolParams = Record<string, any>;

const carts = new Map<string, { name: string; quantity: number }[]>();

async function getDb() {
  try {
    return { client: null as any, db: sharedDb } as const;
  } catch {
    return null;
  }
}

export async function invokeMcpToolDirect(tool: string, parameters: ToolParams) {
  const conn = await getDb();
  const db = conn?.db;

  try {
    switch (tool) {
      case 'health_check': {
        if (db) {
          try { await db.execute(sql`select 1`); } catch {}
        }
        return { success: true, status: db ? 'ok' : 'degraded' };
      }
      case 'cart_add': {
        const clientId = String(parameters.clientId || 'default');
        const drinkName = String(parameters.drink_name || parameters.name || '').trim();
        const quantity = Number(parameters.quantity || 1);
        const list = carts.get(clientId) || [];
        const existing = list.find((i) => i.name.toLowerCase() === drinkName.toLowerCase());
        if (existing) existing.quantity += quantity;
        else list.push({ name: drinkName, quantity });
        carts.set(clientId, list);
        return { success: true };
      }
      case 'cart_view': {
        const clientId = String(parameters.clientId || 'default');
        const list = carts.get(clientId) || [];
        return { success: true, cart: list };
      }
      case 'cart_create_order': {
        const clientId = String(parameters.clientId || 'default');
        const list = carts.get(clientId) || [];
        const total = list.reduce((acc, item) => acc + 500 /* $5 stub */ * Math.max(1, item.quantity), 0);
        carts.set(clientId, []);
        return { success: true, total };
      }
      case 'search_drinks': {
        if (!db) return { success: true, items: [] };
        const q = String(parameters.query || '').toLowerCase();
        const rows = q
          ? await db.select().from(Drinks).where(like(sql`LOWER(${Drinks.name})`, `%${q}%`)).limit(25)
          : await db.select().from(Drinks).limit(25);
        return { success: true, items: rows };
      }
      case 'list_drinks': {
        if (!db) return { success: true, items: [] };
        const rows = await db.select().from(Drinks).limit(100);
        return { success: true, items: rows };
      }
      case 'get_drink_details': {
        if (!db) return { success: false, error: 'no db' };
        const name = String(parameters.name || '').toLowerCase();
        const rows = await db.select().from(Drinks).where(eq(sql`LOWER(${Drinks.name})`, name)).limit(1);
        return { success: Boolean(rows[0]), item: rows[0] };
      }
      default:
        return { success: false, error: `unknown tool: ${tool}` };
    }
  } finally {
    // shared client managed at process level; no per-call closing
  }
}

