import {LuUser} from 'react-icons/lu'
import {currentUser} from '@clerk/nextjs/server'
import Image from 'next/image'

async function UserIcon() {
  const user = await currentUser()

  const profileImage = user?.imageUrl
  if (profileImage) {
    return (
      <Image
        src={profileImage}
        alt='avatar'
        width={24}
        height={24}
        objectFit='object-cover'
        className='rounded-full'
      />
    )
  }

  return (
    <LuUser className='w-6 h-6 bg-primary rounded-full text-white'></LuUser>
  )
}
export default UserIcon
