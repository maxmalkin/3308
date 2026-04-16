'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/supabase/server-client'

export async function signup(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        username: formData.get('username') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }
  // Log them out immediately to kill the auto-login feature (why is that even there)
  await supabase.auth.signOut()


  redirect('/login')
}