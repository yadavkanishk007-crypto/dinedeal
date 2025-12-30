import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (existingAdmin) {
      console.log('Admin user already exists')
      return new Response(
        JSON.stringify({ message: 'Admin user already exists', exists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create admin user
    const adminEmail = 'zaveadmin123@gmail.com'
    const adminPassword = '645a905B@'

    console.log('Creating admin user with email:', adminEmail)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Zave Admin',
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Error creating admin user:', authError)
      throw authError
    }

    console.log('Admin user created successfully:', authData.user?.id)

    // The trigger should handle profile and role creation, but let's ensure the role is set
    if (authData.user) {
      // Update role to admin (in case trigger set it to customer)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: authData.user.id,
          role: 'admin',
        }, { onConflict: 'user_id' })

      if (roleError) {
        console.error('Error setting admin role:', roleError)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully', 
        userId: authData.user?.id,
        email: adminEmail 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in create-admin function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})