import Stripe from 'stripe'
import {type NextRequest} from 'next/server'
import {prisma} from '@/utils/db'

export const POST = async (req: NextRequest) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    // This is a safety check for runtime errors
    return Response.json(
      {error: 'Stripe secret key not configured.'},
      {status: 500}
    )
  }
  // 🔑 LAZY LOADING: Stripe is initialized ONLY when GET is called
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

  const requestHeaders = new Headers(req.headers)
  const origin = requestHeaders.get('origin')

  const {orderId, cartId} = await req.json()

  const order = await prisma.order.findUnique({
    where: {
      uid: orderId,
    },
  })

  const cart = await prisma.cart.findUnique({
    where: {
      uid: cartId,
    },
    include: {
      cartItems: {
        include: {
          product: true,
        },
      },
    },
  })
  if (!order || !cart) {
    return Response.json(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }
  // line items
  const line_items = cart.cartItems.map((cartItem) => {
    return {
      quantity: cartItem.amount,
      price_data: {
        currency: 'usd',
        product_data: {
          name: cartItem.product.name,
          images: [cartItem.product.image],
        },
        unit_amount: cartItem.product.price * 100, // price in cents
      },
    }
  })

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      metadata: {orderId, cartId},
      line_items: line_items,
      mode: 'payment',
      return_url: `${origin}/api/confirm?session_id={CHECKOUT_SESSION_ID}`,
    })
    return Response.json({clientSecret: session.client_secret})
  } catch (error) {
    console.log(error)
    return Response.json(null, {
      status: 500,
      statusText: 'Internal Server Error',
    })
  }
}
