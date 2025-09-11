'use client'

import {useActionState, useEffect} from 'react'
import {toast} from 'sonner'
import {actionFunction} from '@/utils/types'
import {type PropsWithChildren} from 'react'

const initialState = {
  message: '',
}

type FormContainerProps = {
  action: actionFunction
}

function FormContainer({
  action,
  children,
}: PropsWithChildren<FormContainerProps>) {
  const [state, formAction] = useActionState(action, initialState)

  useEffect(() => {
    if (state.message) {
      toast(state.message)
    }
  }, [state])

  return <form action={formAction}>{children}</form>
}
export default FormContainer
