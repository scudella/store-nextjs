// components/CheckoutClientWrapper.tsx
'use client'
import axios from 'axios'
import {useSearchParams} from 'next/navigation'
import React, {useCallback} from 'react'
import {loadStripe} from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'

// This should be defined OUTSIDE the component to avoid re-initialization
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
)

export function CheckoutClientWrapper() {
  // This hook causes docker build failure when not wrapped in Suspense
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const cartId = searchParams.get('cartId')

  const fetchClientSecret = useCallback(async () => {
    // Only proceed if IDs are found
    if (!orderId || !cartId) {
      console.error('Missing orderId or cartId in URL params.')
      // Depending on your logic, you might redirect or show an error here
      throw new Error('Missing required parameters.')
    }

    const response = await axios.post('/api/payment', {orderId, cartId})
    return response.data.clientSecret
  }, [cartId, orderId])

  const options = {fetchClientSecret}

  return (
    <div id='checkout'>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
