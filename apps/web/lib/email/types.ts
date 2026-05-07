export interface CartItem {
  id: string
  title: string
  variant_title?: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

export interface CartEmailData {
  cartId: string
  email: string
  firstName?: string
  items: CartItem[]
  total: number
  currency: string
  cartUrl: string
}

export interface OrderLineItem {
  id: string
  title: string
  variantTitle?: string | null
  quantity: number
  unitPrice: number
}

export interface OrderEmailData {
  id: string
  displayId: number
  createdAt: string
  currency: string
  firstName: string | null
  email: string
  items: OrderLineItem[]
  subtotal: number
  taxTotal: number
  total: number
}
