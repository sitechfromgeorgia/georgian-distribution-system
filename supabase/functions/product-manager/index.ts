import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Georgian Distribution System Product Management Edge Function
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'bulk_update_prices':
        return await bulkUpdatePrices(data);
      case 'check_inventory':
        return await checkInventory(data);
      case 'generate_report':
        return await generateProductReport(data);
      case 'manage_categories':
        return await manageCategories(data);
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
    console.error('Product manager error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function bulkUpdatePrices(data: any) {
  const { updates } = data; // Array of { productId, newPrice, category }
  
  if (!Array.isArray(updates)) {
    return new Response(
      JSON.stringify({ error: 'Updates must be an array' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      const { productId, newPrice, costPrice, notes } = update;

      const { error } = await supabase
        .from('products')
        .update({ 
          price: newPrice,
          cost_price: costPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        errorCount++;
        errors.push(`Error updating product ${productId}: ${error.message}`);
      } else {
        successCount++;
        
        // Log the price change for audit
        console.log(`Price updated for product ${productId}: ${newPrice} (cost: ${costPrice})`);
      }
    } catch (error) {
      errorCount++;
      errors.push(`Exception updating product ${update.productId}: ${error.message}`);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        successCount,
        errorCount,
        totalProcessed: updates.length,
        errors: errors.length > 0 ? errors : undefined
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkInventory(data: any) {
  const { threshold } = data; // Low stock threshold
  
  // Get products below threshold
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .lt('stock_quantity', threshold || 10)
    .eq('active', true)
    .order('stock_quantity', { ascending: true });

  if (error) throw error;

  // Calculate low stock summary
  const lowStockProducts = products || [];
  const categories = [...new Set(lowStockProducts.map(p => p.category))];
  
  const summary = {
    totalLowStock: lowStockProducts.length,
    categoriesAffected: categories.length,
    criticalItems: lowStockProducts.filter(p => p.stock_quantity === 0).length,
    byCategory: categories.map(category => ({
      category,
      count: lowStockProducts.filter(p => p.category === category).length,
      items: lowStockProducts.filter(p => p.category === category)
    }))
  };

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        summary,
        products: lowStockProducts
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateProductReport(data: any) {
  const { reportType, category, dateRange } = data;
  
  let query = supabase.from('products').select('*');
  
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  
  if (dateRange) {
    const { startDate, endDate } = dateRange;
    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);
  }

  const { data: products, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  const productsList = products || [];
  
  // Generate report based on type
  let reportData: any = {};
  
  switch (reportType) {
    case 'inventory':
      reportData = {
        totalProducts: productsList.length,
        activeProducts: productsList.filter(p => p.active).length,
        byCategory: getCategoryStats(productsList),
        stockLevels: getStockLevelStats(productsList)
      };
      break;
      
    case 'pricing':
      reportData = {
        totalProducts: productsList.length,
        averagePrice: productsList.reduce((sum, p) => sum + p.price, 0) / productsList.length,
        priceRange: {
          min: Math.min(...productsList.map(p => p.price)),
          max: Math.max(...productsList.map(p => p.price))
        },
        byCategory: getCategoryStats(productsList, 'avg_price')
      };
      break;
      
    case 'full':
    default:
      reportData = {
        totalProducts: productsList.length,
        activeProducts: productsList.filter(p => p.active).length,
        categories: getCategoryStats(productsList),
        stockLevels: getStockLevelStats(productsList),
        recentUpdates: productsList.slice(0, 10)
      };
      break;
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        ...reportData
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function manageCategories(data: any) {
  const { action, category, newName, description } = data;

  switch (action) {
    case 'list':
      // Get all unique categories
      const { data: products } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (!products) {
        return new Response(
          JSON.stringify({ success: true, data: { categories: [] } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const categories = [...new Set(products.map(p => p.category))];
      const categoryStats = await Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', cat);

          return {
            name: cat,
            productCount: count || 0
          };
        })
      );

      return new Response(
        JSON.stringify({ success: true, data: { categories: categoryStats } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    case 'rename':
      if (!category || !newName) {
        return new Response(
          JSON.stringify({ error: 'Category and new name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update all products with the old category name
      const { error } = await supabase
        .from('products')
        .update({ category: newName })
        .eq('category', category);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }
}

// Helper functions
function getCategoryStats(products: any[], field?: string) {
  const categoryGroups = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  return Object.entries(categoryGroups).map(([category, products]) => {
    if (field === 'avg_price') {
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      return { category, avgPrice: Number(avgPrice.toFixed(2)), count: products.length };
    }
    return { category, count: products.length };
  });
}

function getStockLevelStats(products: any[]) {
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length;
  const normalStock = products.filter(p => p.stock_quantity > p.min_stock_level).length;

  return {
    outOfStock,
    lowStock,
    normalStock,
    total: products.length
  };
}