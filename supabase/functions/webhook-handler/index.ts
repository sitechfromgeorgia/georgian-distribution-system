import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Georgian Distribution System webhook handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    switch (type) {
      case 'order_status_updated':
        return await handleOrderStatusUpdate(data);
      case 'product_updated':
        return await handleProductUpdate(data);
      case 'user_registered':
        return await handleUserRegistered(data);
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown webhook type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleOrderStatusUpdate(data: any) {
  const { orderId, status, userId, message } = data;

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Create notification
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'შეკვეთის სტატუსი განახლებულია',
      title_ka: 'შეკვეთის სტატუსი განახლებულია',
      message: message || `შეკვეთის სტატუსი განახლებულია: ${status}`,
      message_ka: message || `შეკვეთის სტატუსი განახლებულია: ${status}`,
      type: 'info'
    });

  if (notificationError) throw notificationError;

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleProductUpdate(data: any) {
  const { productId, updateType } = data;

  // Log product update for admin
  console.log(`Product ${productId} updated: ${updateType}`);

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleUserRegistered(data: any) {
  const { userId, role, restaurantName } = data;

  // Update profile with restaurant name if applicable
  if (role === 'restaurant' && restaurantName) {
    const { error } = await supabase
      .from('profiles')
      .update({ restaurant_name: restaurantName })
      .eq('id', userId);

    if (error) throw error;
  }

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}