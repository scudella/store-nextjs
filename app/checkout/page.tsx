import {CheckoutClientWrapper} from '@/components/checkout/CheckoutClientWrapper'
import React, {Suspense} from 'react'

// Server Component page
export default function CheckoutPage() {
  return (
    // Suspense boundary around the component using searchParams
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutClientWrapper />
    </Suspense>
  )
}
