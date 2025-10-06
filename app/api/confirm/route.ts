import Stripe from 'stripe'
import {redirect} from 'next/navigation'
import {type NextRequest} from 'next/server'
import {prisma} from '@/utils/db'

export const GET = async (req: NextRequest) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    // This is a safety check for runtime errors
    return Response.json(
      {error: 'Stripe secret key not configured.'},
      {status: 500}
    )
  }
  // 🔑 LAZY LOADING: Stripe is initialized ONLY when GET is called
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

  const {searchParams} = new URL(req.url)
  const session_id = searchParams.get('session_id') as string

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    const orderId = session.metadata?.orderId
    const cartId = session.metadata?.cartId

    if (session.status === 'complete') {
      await prisma.order.update({
        where: {
          uid: orderId,
        },
        data: {
          isPaid: true,
        },
      })
    }

    await prisma.cart.delete({
      where: {
        uid: cartId,
      },
    })
  } catch (error) {
    console.log(error)
    return Response.json(null, {
      status: 500,
      statusText: 'Internal Server Error',
    })
  }
  redirect('/orders')
}
