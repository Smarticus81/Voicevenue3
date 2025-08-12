import { createClient } from '@supabase/supabase-js';

type ToolParams = Record<string, any>;

const carts = new Map<string, Array<{ name: string; quantity: number }>>();

export async function invokeMcpToolSupabase(tool: string, parameters: ToolParams, supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (tool) {
      case 'health_check': {
        try {
          const { error } = await supabase.from('drinks').select('count').limit(1);
          return { success: true, status: error ? 'degraded' : 'ok' };
        } catch {
          return { success: true, status: 'degraded' };
        }
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
        const q = String(parameters.query || '').toLowerCase();
        const { data: rows, error } = q
          ? await supabase.from('drinks').select('*').ilike('name', `%${q}%`).limit(25)
          : await supabase.from('drinks').select('*').limit(25);
        
        if (error) return { success: false, error: error.message };
        return { success: true, items: rows || [] };
      }
      
      case 'list_drinks': {
        const { data: rows, error } = await supabase.from('drinks').select('*').limit(100);
        if (error) return { success: false, error: error.message };
        return { success: true, items: rows || [] };
      }
      
      case 'get_drink_details': {
        const name = String(parameters.name || '').toLowerCase();
        const { data: rows, error } = await supabase
          .from('drinks')
          .select('*')
          .ilike('name', name)
          .limit(1);
        
        if (error) return { success: false, error: error.message };
        return { success: Boolean(rows?.[0]), item: rows?.[0] };
      }
      
      default:
        return { success: false, error: `unknown tool: ${tool}` };
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
