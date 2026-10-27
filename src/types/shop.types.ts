/** Товар магазина при бане («Банные товары»): веники, шапки, халаты. Продаётся на браслет гостя. */
export interface ShopItem {
  id: number
  /** Группа товара: веники, шапки, косметика… */
  category: string
  name: string
  price: number
  active: boolean
}
