'use client'

import Link from 'next/link'
import {SignOutButton} from '@clerk/nextjs'
import {toast} from 'sonner'

function SignOutLink() {
  const handleLogout = () => {
    toast('Logout Successful')
  }
  return (
    <SignOutButton>
      <Link href='/' className='w-full text-left' onClick={handleLogout}>
        Logout
      </Link>
    </SignOutButton>
  )
}
export default SignOutLink
