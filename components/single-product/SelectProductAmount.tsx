import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const modeUsage = {
  singleProduct: 'singleProduct',
  cartItem: 'cartItem',
} as const

type SelectProductAmountProps = {
  mode: typeof modeUsage.singleProduct
  amount: number
  setAmount: (value: number) => void
}

type SelectCartItemAmountProps = {
  mode: typeof modeUsage.cartItem
  amount: number
  setAmount: (value: number) => Promise<void>
  isLoading: boolean
}

function SelectProductAmount(
  props: SelectProductAmountProps | SelectCartItemAmountProps
) {
  const {mode, amount, setAmount} = props

  const isCartItem = mode === modeUsage.cartItem

  return (
    <>
      <h4 className='mb-2'>Amount</h4>
      <Select
        defaultValue={amount.toString()}
        onValueChange={(value) => setAmount(Number(value))}
        disabled={isCartItem ? props.isLoading : false}
      >
        <SelectTrigger className={isCartItem ? 'w-[100px]' : 'w-[150px]'}>
          <SelectValue placeholder={amount} />
          <SelectContent>
            {Array.from({length: isCartItem ? amount + 10 : 10}, (_, index) => {
              const selectValue = (index + 1).toString()
              return (
                <SelectItem key={selectValue} value={selectValue}>
                  {selectValue}
                </SelectItem>
              )
            })}
          </SelectContent>
        </SelectTrigger>
      </Select>
    </>
  )
}

export default SelectProductAmount
