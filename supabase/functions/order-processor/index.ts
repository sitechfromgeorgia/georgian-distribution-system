import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Georgian Distribution System Order Processing Edge Function
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, orderId, data } = await req.json();

    switch (action) {
      case 'calculate_total':
        return await calculateOrderTotal(data);
      case 'assign_driver':
        return await assignDriver(orderId, data.driverId);
      case 'update_status':
        return await updateOrderStatus(orderId, data.status, data.notes);
      case 'send_notification':
        return await sendOrderNotification(data);
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Order processor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function calculateOrderTotal(data: any) {
  const { items } = data;

  // Calculate total based on items
  let totalAmount = 0;
  let totalCost = 0;

  for (const item of items) {
    const itemTotal = item.quantity * item.unit_price;
    const itemCost = item.quantity * (item.cost_price || 0);
    
    totalAmount += itemTotal;
    totalCost += itemCost;
  }

  // Add delivery fee and calculate profit margin
  const deliveryFee = data.deliveryFee || 0;
  const finalTotal = totalAmount + deliveryFee;
  const profit = finalTotal - totalCost;

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        subtotal: totalAmount,
        deliveryFee,
        totalAmount: finalTotal,
        totalCost,
        profit,
        profitMargin: ((profit / finalTotal) * 100).toFixed(2)
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function assignDriver(orderId: string, driverId: string) {
  // Update order with driver assignment
  const { error } = await supabase
    .from('orders')
    .update({ 
      driver_id: driverId,
      status: 'assigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw error;

  // Get order and restaurant details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      restaurant:profiles!orders_restaurant_id_fkey(*),
      driver:profiles!orders_driver_id_fkey(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  // Send notification to driver
  await supabase
    .from('notifications')
    .insert({
      user_id: driverId,
      title: 'ახალი შეკვეთა დაგიმატებთ',
      title_ka: 'ახალი შეკვეთა დაგიმატებთ',
      message: `მინდა რომ შეკვეთა ${orderId} მიეწოდება: ${order.delivery_address}`,
      message_ka: `მინდა რომ შეკვეთა ${orderId} მიეწოდება: ${order.delivery_address}`,
      type: 'info'
    });

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({ 
      status,
      notes: notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Get order details for notifications
  const { data: order } = await supabase
    .from('orders')
    .select('*, restaurant:profiles!orders_restaurant_id_fkey(*)')
    .eq('id', orderId)
    .single();

  if (order) {
    // Notify restaurant of status change
    await supabase
      .from('notifications')
      .insert({
        user_id: order.restaurant_id,
        title: 'შეკვეთის სტატუსი განახლებულია',
        title_ka: 'შეკვეთის სტატუსი განახლებულია',
        message: getStatusMessage(status),
        message_ka: getStatusMessage(status),
        type: status === 'completed' ? 'success' : 'info'
      });
  }

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function sendOrderNotification(data: any) {
  const { userId, title, message, titleKa, messageKa, type } = data;

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      title_ka: titleKa,
      message,
      message_ka: messageKa,
      type: type || 'info'
    });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function getStatusMessage(status: string): string {
  const statusMessages: Record<string, string> = {
    pending: 'შეკვეთა ელოდება დამუშავებას',
    confirmed: 'შეკვეთა დადასტურებულია',
    priced: 'ფასები განსაზღვრულია',
    assigned: 'შეკვეთა დამატებულია მძღოველს',
    out_for_delivery: 'შეკვეთა გაგზავნილია მიწოდებისთვის',
    delivered: 'შეკვეთა მიწოდებულია',
    completed: 'შეკვეთა დასრულებულია',
    cancelled: 'შეკვეთა გაუქმებულია'
  };

  return statusMessages[status] || 'შეკვეთის სტატუსი განახლებულია';
}