'use client'

import {Input} from '../ui/input'
import {useSearchParams, useRouter} from 'next/navigation'
import {useDebouncedCallback} from 'use-debounce'
import {useState, useEffect} from 'react'

function NavSearch() {
  const searchParams = useSearchParams()
  const {replace} = useRouter()
  const [search, setSearch] = useState(
    searchParams.get('search')?.toString() || ''
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    replace(`/products?${params.toString()}`)
  }, 500)

  const searchParamValue = searchParams.get('search') || ''

  useEffect(() => {
    if (!searchParamValue) {
      setSearch('')
    }
  }, [searchParamValue])

  return (
    <Input
      type='search'
      placeholder='search product...'
      className='max-w-xs dark:bg-muted'
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
        handleSearch(e.target.value)
      }}
    />
  )
}
export default NavSearch
