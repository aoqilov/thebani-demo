import type { MenuCategory, MenuItem } from '@/types/menu.types'
import type { Product, ProductGroup, Recipe, RecipeLine, Unit } from '@/types/warehouse.types'
import { rawMenu } from './menu.raw'

/** [ингредиент, количество на 100 г порции (в единицах склада), % потерь] */
type Ing = [name: string, per100: number, loss?: number]

const SALAD_BASE: Ing[] = [['Помидоры', 0.04], ['Огурцы', 0.04], ['Лук репчатый', 0.01, 10], ['Зелень (укроп, кинза)', 0.005, 5], ['Масло подсолнечное', 0.008]]

/** Типовые составы по виду блюда. Тех. карты приблизительные — их уточняет шеф. */
const TEMPLATES: Record<string, Ing[]> = {
  salad: SALAD_BASE,
  'salad-meat': [['Говядина вырезка', 0.04, 8], ...SALAD_BASE],
  'salad-chicken': [['Куриное филе', 0.05, 5], ['Сыр твёрдый', 0.01], ['Яйца куриные', 0.4], ...SALAD_BASE],
  soup: [['Говядина вырезка', 0.02, 8], ['Картофель', 0.05, 20], ['Морковь', 0.02, 15], ['Лук репчатый', 0.015, 15], ['Томатная паста', 0.003], ['Сметана 20%', 0.01]],
  'soup-fish': [['Форель', 0.04, 5], ['Картофель', 0.04, 20], ['Морковь', 0.02, 15], ['Лук репчатый', 0.015, 15]],
  'cold-meat': [['Колбаса казы', 0.08], ['Огурцы', 0.02], ['Зелень (укроп, кинза)', 0.004]],
  'cold-fish': [['Форель', 0.09, 5], ['Лук репчатый', 0.01, 10]],
  snack: [['Картофель', 0.06, 20], ['Масло подсолнечное', 0.012]],
  chicken: [['Куриное филе', 0.09, 5], ['Масло подсолнечное', 0.006]],
  'main-beef': [['Говядина вырезка', 0.08, 8], ['Картофель', 0.04, 20], ['Лук репчатый', 0.01, 15], ['Масло подсолнечное', 0.004]],
  'main-lamb': [['Баранина (лопатка)', 0.09, 10], ['Лук репчатый', 0.015, 15], ['Картофель', 0.03, 20], ['Масло подсолнечное', 0.004]],
  'main-chicken': [['Куриное филе', 0.09, 5], ['Картофель', 0.04, 20], ['Масло подсолнечное', 0.004]],
  'main-minced': [['Фарш говяжий', 0.08], ['Картофель', 0.05, 20], ['Лук репчатый', 0.01, 15]],
  'main-sausage': [['Фарш говяжий', 0.08], ['Капуста белокочанная', 0.03, 15], ['Картофель', 0.03, 20]],
  'main-tongue': [['Язык говяжий', 0.1, 10], ['Масло подсолнечное', 0.004]],
  fish: [['Форель', 0.09, 5], ['Масло подсолнечное', 0.005]],
  shrimp: [['Креветки', 0.1], ['Масло подсолнечное', 0.004]],
  dessert: [['Сахар', 0.02], ['Сметана 20%', 0.02], ['Яйца куриные', 0.4], ['Мука пшеничная', 0.03]],
  pancake: [['Мука пшеничная', 0.04], ['Молоко 3,2%', 0.06], ['Яйца куриные', 0.6], ['Масло подсолнечное', 0.004]],
  porridge: [['Молоко 3,2%', 0.1], ['Масло сливочное', 0.004], ['Сахар', 0.005]],
  egg: [['Яйца куриные', 1], ['Помидоры', 0.03], ['Масло сливочное', 0.005]],
  company: [['Говядина вырезка', 0.03, 8], ['Баранина (лопатка)', 0.03, 10], ['Куриное филе', 0.02, 5], ['Картофель', 0.03, 20]],
  'company-lamb': [['Баранина (лопатка)', 0.1, 10], ['Лук репчатый', 0.01, 15]],
  bread: [['Мука пшеничная', 0.07], ['Соль', 0.001]],
  mushrooms: [['Грибы шампиньоны', 0.09, 5], ['Лук репчатый', 0.01, 10]],
}

function templateKey(cat: string, n: string): string {
  const t = n.toLowerCase()
  const is = (re: RegExp) => re.test(t)
  switch (cat) {
    case 'Завтраки': return is(/каша/) ? 'porridge' : is(/форел/) ? 'cold-fish' : is(/блины|сырник/) ? 'pancake' : 'egg'
    case 'Салаты': return is(/язык|ростбиф/) ? 'salad-meat' : is(/цезарь/) ? 'salad-chicken' : is(/селёдка/) ? 'cold-fish' : 'salad'
    case 'Первые блюда': return is(/рыб|уха|том ям/) ? 'soup-fish' : 'soup'
    case 'Холодные закуски': return is(/форел|рыб|селёдк|тунец/) ? 'cold-fish' : is(/мяс|паштет|холодец|колбас/) ? 'cold-meat' : is(/гриб/) ? 'mushrooms' : 'salad'
    case 'Горячие закуски': return is(/крыл/) ? 'chicken' : is(/сет/) ? 'company' : is(/мойв|раки/) ? 'fish' : is(/орех|колбас/) ? 'cold-meat' : 'snack'
    case 'Вторые блюда':
      return is(/курин|куриц|шницель|грудк/) ? 'main-chicken' : is(/баран|ягн/) ? 'main-lamb' : is(/форел/) ? 'fish' : is(/язык/) ? 'main-tongue'
        : is(/колбаск|гуляш|котлет|вареник|макарон/) ? (is(/колбаск/) ? 'main-sausage' : 'main-minced') : 'main-beef'
    case 'Сладкие закуски': return is(/блины/) ? 'pancake' : 'dessert'
    case 'На компанию': return is(/креветк/) ? 'shrimp' : is(/форел/) ? 'fish' : is(/баран/) ? 'company-lamb' : 'company'
    case 'Рыба холодного копчения и вяленая': return 'cold-fish'
    case 'Хлеб': return 'bread'
    default: return 'snack'
  }
}

/** Граммы порции из текста («3 шт, 250 г» → 250). Если не указано — 200 г. */
function gramsOf(portion: string): number {
  const g = portion.match(/(\d+)\s*г\b/)
  if (g) return Number(g[1])
  const ml = portion.match(/(\d+)\s*мл/)
  return ml ? Number(ml[1]) : 200
}

const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d

/** Кофе и чай: фиксированный расход на чашку. */
function drinkLines(cat: string, name: string): Ing[] | null {
  const n = name.toLowerCase()
  if (cat === 'Кофе') {
    const milk: Ing[] = /капучино/.test(n) ? [['Молоко 3,2%', 0.15]] : /латте/.test(n) ? [['Молоко 3,2%', 0.22]] : /флэт/.test(n) ? [['Молоко 3,2%', 0.12]] : []
    return [['Кофе в зёрнах', /флэт/.test(n) ? 0.014 : 0.009], ...milk]
  }
  if (cat === 'Чай') return [['Чай чёрный', 0.005], ['Сахар', 0.01]]
  return null
}

/** Какие группы модификаторов подходят позиции (id групп — см. menu.mock). */
function modifiersFor(cat: string, name: string): number[] {
  const n = name.toLowerCase()
  if (/стейк|рибай/.test(n)) return [1, 2]
  if (/шашлык/.test(n)) return [3, 2, 4]
  if (/колбаск|гуляш|мясо по/.test(n)) return [3]
  if (cat === 'Салаты') return [4]
  if (cat === 'Первые блюда') return [2]
  if (cat === 'Кофе' && /капучино|латте|флэт/.test(n)) return [5]
  return []
}

/** Фото из public/menu (скачаны с Wikimedia Commons, см. CREDITS.md); для остальных позиций будет заглушка. */
function imageFor(cat: string, name: string): string | undefined {
  const n = name.toLowerCase()
  const file = /цезарь/.test(n) ? 51 : /греческ/.test(n) ? 50 : /ачичук/.test(n) ? 52 : /^борщ/.test(n) ? 54 : /стейк|рибай/.test(n) ? 49
    : /шашлык из курицы/.test(n) ? 48 : /шашлык/.test(n) ? 47 : cat === 'Чай' ? 55 : /американо/.test(n) ? 56 : /coca cola/.test(n) ? 33
    : /фреш/.test(n) ? 34 : /^лимонад/.test(n) ? 35 : /пив|sarbast|tuborg|carlsberg|zatecky|stella|bud|hoegaarden|paulaner|guinness|corona|kronenbourg|estrella/.test(n) ? 36
    : cat === 'Вино' ? 37 : /водка|настойк/.test(n) ? 38 : undefined
  return file ? `/menu/${file}.jpg` : undefined
}

/** Закупочная цена покупного товара ≈ 45% от цены в меню. */
const buyPrice = (price: number) => Math.round((price * 0.45) / 1000) * 1000
const minStockFor = (price: number) => (price < 50000 ? 30 : price < 150000 ? 12 : price < 500000 ? 6 : 2)

export interface Catalog {
  groups: ProductGroup[]
  goods: Product[]
  /** закупочные цены покупных товаров (productId → сум) */
  buy: Map<number, number>
  dishes: Product[]
  recipes: Recipe[]
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

/**
 * Собирает каталог из реального меню: товары бара, блюда с тех. картами и позиции меню.
 * @param firstProductId следующий свободный id номенклатуры
 * @param ingredientId  id ингредиента по названию (из базового справочника склада)
 */
export function buildCatalog(firstProductId: number, ingredientId: (name: string) => number): Catalog {
  let pid = firstProductId
  let gid = 20
  let mid = 0
  const groups: ProductGroup[] = [{ id: 16, parentId: null, name: 'Табачная продукция' }]
  const goods: Product[] = []
  const dishes: Product[] = []
  const recipes: Recipe[] = []
  const categories: MenuCategory[] = []
  const menuItems: MenuItem[] = []
  const buy = new Map<number, number>()

  rawMenu.forEach((cat, ci) => {
    categories.push({ id: ci + 1, name: cat.name, sort: ci + 1 })
    const groupId = cat.kind === 'dish' ? (groups.push({ id: ++gid, parentId: 11, name: cat.name }), gid) : /Стики/.test(cat.name) ? 16 : /Фреши|Лимонады|Софт|Специальные/.test(cat.name) ? 9 : 10

    for (const [name, portion, price] of cat.items) {
      const id = pid++
      const full = portion ? `${name} · ${portion}` : name

      if (cat.kind === 'goods') {
        const unit: Unit = /Стики/.test(cat.name) ? 'упак' : 'порц'
        goods.push({ id, groupId, code: `T-${String(id).padStart(4, '0')}`, name: full, unit, kind: 'goods', minStock: minStockFor(price), price: 0, active: true })
        buy.set(id, buyPrice(price))
      } else {
        dishes.push({ id, groupId, code: `B-${String(id).padStart(4, '0')}`, name: full, unit: 'порц', kind: 'dish', minStock: 0, price, active: true })
        const lines: Ing[] = drinkLines(cat.name, name) ?? (() => {
          const k = gramsOf(portion) / 100
          return TEMPLATES[templateKey(cat.name, name)].map(([n, per, loss]): Ing => [n, round(per * k), loss])
        })()
        const recipeLines: RecipeLine[] = lines.map(([n, qty, loss]) => ({ productId: ingredientId(n), gross: qty, lossPct: loss ?? 0 }))
        recipes.push({ productId: id, outputQty: 1, lines: recipeLines })
      }

      menuItems.push({
        id: ++mid, categoryId: ci + 1, productId: id, name: full, price, station: cat.station,
        modifierGroupIds: modifiersFor(cat.name, name), stopped: false, active: true, image: imageFor(cat.name, name),
      })
    }
  })

  return { groups, goods, buy, dishes, recipes, categories, menuItems }
}
