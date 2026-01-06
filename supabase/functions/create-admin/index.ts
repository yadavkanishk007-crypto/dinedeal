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

    // Check if this is a manual admin creation request
    const contentType = req.headers.get('content-type')
    let body: any = null
    
    if (contentType?.includes('application/json')) {
      body = await req.json()
    }

    // If body has email/password, this is a manual creation request
    if (body?.email && body?.password) {
      // Verify the caller is an admin
      const authHeader = req.headers.get('authorization')
      if (!authHeader) {
        throw new Error('Missing authorization header')
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !userData.user) {
        throw new Error('Invalid token')
      }

      // Check if caller is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single()

      if (roleError || roleData?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can create new admins')
      }

      console.log(`Admin ${userData.user.email} creating new admin: ${body.email}`)

      // Create the new user with admin client
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.fullName || '',
          phone: body.phone || '',
          role: 'admin',
          city: body.city || 'Jhansi',
        },
      })

      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }

      // Ensure admin role is set
      if (newUser.user) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: newUser.user.id,
            role: 'admin',
          }, { onConflict: 'user_id' })
      }

      console.log(`Admin user created successfully: ${newUser.user.id}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin created successfully',
          user_id: newUser.user.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Original functionality: Check/create initial admin
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

    // Create initial admin user
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

    // Update role to admin
    if (authData.user) {
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: errorMessage.includes('Unauthorized') ? 403 : 500 
      }
    )
  }
})
