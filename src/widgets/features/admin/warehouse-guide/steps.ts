import type { WarehouseLive } from './hooks/useWarehouseLive'

export type Lang = 'ru' | 'uz'
export type LiveTone = 'ok' | 'warn' | 'idle'

export interface GuideStep {
  id: string
  title: string
  /** Кто работает с этим шагом */
  who: string
  /** Как часто */
  when: string
  to: string
  openLabel: string
  /** Что делает человек */
  doing: string[]
  /** Что система делает сама */
  auto: string[]
  example: string
  live: (l: WarehouseLive) => { text: string; tone: LiveTone }
}

const n = (x: number) => x.toLocaleString('ru-RU')
const date = (d: string) => d.split('-').reverse().join('.')

// ═════════════ Русский ═════════════
const stepsRu: GuideStep[] = [
  {
    id: 'catalog', title: 'Справочник товаров', who: 'Склад', when: 'Один раз, потом при новых товарах', to: '/warehouse/products', openLabel: 'Открыть номенклатуру',
    doing: ['Создайте группы (мясо, овощи, напитки) и товары в них.', 'Укажите единицу измерения: кг, л, шт.', 'Задайте минимальный остаток — ниже него товар считается «заканчивающимся».'],
    auto: ['Присваивает код товару.', 'Использует минимальный остаток для предупреждений и подсказки заказа.'],
    example: 'Говядина вырезка · кг · минимальный остаток 10 кг.',
    live: (l) => ({ text: `${l.goods} товаров и ${l.dishes} блюд в справочнике`, tone: 'idle' }),
  },
  {
    id: 'order', title: 'Заказ поставщику', who: 'Склад', when: 'Когда товар заканчивается', to: '/warehouse/orders', openLabel: 'Открыть заказы',
    doing: ['Один раз добавьте поставщиков в разделе «Поставщики».', 'Создайте заказ и выберите поставщика.', 'Нажмите «Предложить по остаткам» — товары ниже минимума добавятся сами.', 'Проверьте количество и цены, нажмите «Отправить поставщику».'],
    auto: ['Подбирает только товары выбранного поставщика.', 'Заказывает до 2,5 минимальных остатков, цена — последняя закупочная.'],
    example: 'Сметаны осталось 2 кг при минимуме 5 → предложено заказать 10,5 кг.',
    live: (l) => ({ text: `Ниже минимума: ${l.lowStock} · заказов в пути: ${l.ordersSent}`, tone: l.lowStock > 0 ? 'warn' : 'ok' }),
  },
  {
    id: 'income', title: 'Приёмка товара (приход)', who: 'Склад', when: 'При каждой поставке', to: '/warehouse/income', openLabel: 'Открыть приход',
    doing: ['Если был заказ — откройте его и нажмите «Принять товар».', 'Если заказа не было — «Приход → Новая накладная»: поставщик, товары, количество, цена.', 'Нажмите «Провести» — пока накладная в черновике, остаток не меняется.'],
    auto: ['Увеличивает остаток.', 'Пересчитывает среднюю себестоимость (средневзвешенную).'],
    example: 'Было 14 кг по 95 000, пришло 8 кг по 100 700 → средняя цена ≈ 97 070 сум/кг.',
    live: (l) => ({ text: l.draftIncome ? `Непроведённых накладных: ${l.draftIncome}` : 'Все накладные проведены', tone: l.draftIncome ? 'warn' : 'ok' }),
  },
  {
    id: 'recipes', title: 'Рецепты (тех. карты)', who: 'Склад / шеф', when: 'Один раз на блюдо', to: '/warehouse/recipes', openLabel: 'Открыть рецепты',
    doing: ['Выберите блюдо или заготовку.', 'Добавьте ингредиенты: брутто, % потерь при обработке, выход порции.', 'Задайте цену продажи у блюда.'],
    auto: ['Считает нетто, себестоимость порции и food cost.', 'Показывает, на сколько порций хватит остатков.'],
    example: 'Блюдо за 169 000 сум, сырьё на 38 000 → food cost 22% (норма до 30%).',
    live: (l) => ({ text: `Тех. карт: ${l.recipes}`, tone: 'idle' }),
  },
  {
    id: 'production', title: 'Приготовление заготовок', who: 'Склад / кухня', when: 'Когда готовите впрок', to: '/warehouse/production', openLabel: 'Открыть приготовление',
    doing: ['Создайте акт: какую заготовку и сколько приготовили (бульон 10 л, тесто 5 кг).', 'Проверьте таблицу «Расход сырья» — хватает ли продуктов.', 'Нажмите «Провести».'],
    auto: ['Списывает сырьё по тех. карте заготовки.', 'Приходует готовую заготовку по себестоимости партии.'],
    example: 'Бульон 10 л: списано 3 кг говядины, овощи, соль → заготовка на складе, 29 991 сум/л.',
    live: (l) => ({ text: l.draftProductions ? `Непроведённых актов: ${l.draftProductions}` : 'Все акты проведены', tone: l.draftProductions ? 'warn' : 'ok' }),
  },
  {
    id: 'menu', title: 'Меню и стоп-лист', who: 'Маркетолог / склад', when: 'При изменении меню', to: '/menu', openLabel: 'Открыть меню',
    doing: ['Добавьте блюдо в меню: категория, цена, цех (кухня или бар), модификаторы.', 'При необходимости поставьте вручную «Стоп».'],
    auto: ['Если сырья не хватает даже на одну порцию — блюдо само уходит в стоп.', 'После прихода товара блюдо возвращается в продажу.'],
    example: 'Закончилось сливочное масло → все завтраки с ним автоматически в стопе.',
    live: (l) => ({ text: `В стоп-листе: ${l.stopCount}`, tone: l.stopCount ? 'warn' : 'ok' }),
  },
  {
    id: 'sale', title: 'Продажа и автосписание', who: 'Официант, повар, бармен', when: 'Каждый заказ', to: '/warehouse/expense', openLabel: 'Посмотреть расход',
    doing: ['Вам делать ничего не нужно.', 'Официант отправляет заказ → повар нажимает «Принять», затем «Готово».'],
    auto: ['В момент «Готово» создаёт документ расхода «Продажа (авто)».', 'Списывает ингредиенты по тех. карте (заготовки — со склада, если они есть).'],
    example: 'Приготовили шашлык из говядины → сразу списано мясо, лук, масло по рецепту.',
    live: () => ({ text: 'Работает автоматически', tone: 'ok' }),
  },
  {
    id: 'writeoff', title: 'Списания: порча, брак, питание персонала', who: 'Склад', when: 'По факту', to: '/warehouse/expense', openLabel: 'Открыть расход',
    doing: ['«Расход → Новое списание»: выберите причину.', 'Добавьте товары и количество, нажмите «Провести».'],
    auto: ['Уменьшает остаток по средней себестоимости.', 'Не даёт списать больше, чем есть на складе.'],
    example: 'Помидоры 3 кг — причина «Порча».',
    live: (l) => ({ text: l.draftExpense ? `Непроведённых списаний: ${l.draftExpense}` : 'Все списания проведены', tone: l.draftExpense ? 'warn' : 'ok' }),
  },
  {
    id: 'stock', title: 'Остатки и движение', who: 'Склад, администратор', when: 'Ежедневно', to: '/warehouse/stock', openLabel: 'Открыть остатки',
    doing: ['Смотрите остатки, среднюю себестоимость и стоимость склада.', 'Нажмите на товар — увидите всю историю прихода и расхода.'],
    auto: ['Всё считается из проведённых документов — отдельно остаток никто не вводит.'],
    example: 'Говядина: 12 кг, средняя цена 97 000, стоимость остатка 1 164 000 сум.',
    live: (l) => ({ text: `Ниже минимума: ${l.lowStock}`, tone: l.lowStock ? 'warn' : 'ok' }),
  },
  {
    id: 'inventory', title: 'Инвентаризация', who: 'Склад + администратор', when: 'Раз в неделю и перед закрытием месяца', to: '/warehouse/inventory', openLabel: 'Открыть инвентаризацию',
    doing: ['Физически пересчитайте товар.', 'Создайте инвентаризацию, введите фактический остаток по каждой позиции.', 'Нажмите «Провести».'],
    auto: ['Сравнивает факт с учётом.', 'Недостачу оформляет расходом, излишек — приходом (по средней себестоимости).'],
    example: 'По учёту 14 кг говядины, насчитали 12 → недостача 2 кг (≈ 194 000 сум).',
    live: (l) => ({ text: l.lastInventory ? `Последняя: ${date(l.lastInventory)}` : 'Инвентаризаций ещё не было', tone: l.inventoryThisMonth ? 'ok' : 'warn' }),
  },
  {
    id: 'variance', title: 'Потери и расхождения', who: 'Руководитель, бухгалтер', when: 'После инвентаризации', to: '/warehouse/variance', openLabel: 'Открыть потери',
    doing: ['Выберите период и посмотрите, какие продукты «исчезают».', 'Разберитесь с позициями, выделенными красным (потери от 5% расхода).'],
    auto: ['Сравнивает теоретический расход (продажи и приготовление по рецептам) с итогом инвентаризации.', 'Потери = недостача − излишек.'],
    example: 'По рецептам ушло 40 кг мяса, а недостача ещё 3 кг → 3 кг ушли без документов.',
    live: (l) => ({ text: l.monthLoss > 0 ? `Потери за месяц: ${n(l.monthLoss)} сум` : 'Потерь в этом месяце нет', tone: l.monthLoss > 0 ? 'warn' : 'ok' }),
  },
  {
    id: 'turnover', title: 'Оборотная ведомость — месячный отчёт', who: 'Бухгалтер, склад', when: 'В конце месяца', to: '/warehouse/turnover', openLabel: 'Открыть ведомость',
    doing: ['Выберите период: с 1-го по последнее число месяца.', 'При необходимости отфильтруйте группу.', 'Нажмите «Экспорт CSV» и передайте бухгалтеру.'],
    auto: ['Считает: начальный остаток + приход − расход = конечный остаток.', 'Показывает всё в количестве и в деньгах, с итогами.'],
    example: 'Начало 25 кг + приход 28 кг − расход 0 = конец 53 кг; в деньгах — по себестоимости.',
    live: () => ({ text: 'Готов к выгрузке после проверки чек-листа ниже', tone: 'idle' }),
  },
]

// ═════════════ O'zbekcha (lotin) ═════════════
// Кнопки и пункты меню интерфейса оставлены на русском в кавычках — чтобы их было легко найти на экране.
const stepsUz: GuideStep[] = [
  {
    id: 'catalog', title: "Tovarlar ma'lumotnomasi", who: 'Ombor', when: "Bir marta, keyin yangi tovar qo'shilganda", to: '/warehouse/products', openLabel: 'Nomenklaturani ochish',
    doing: ["Guruhlar (go'sht, sabzavot, ichimliklar) va ular ichida tovarlar yarating.", "O'lchov birligini belgilang: kg, l, dona.", "Minimal qoldiqni kiriting: undan pastga tushsa tovar «tugayapti» hisoblanadi."],
    auto: ['Tovarga kod beradi.', 'Minimal qoldiqni ogohlantirish va buyurtma taklifi uchun ishlatadi.'],
    example: 'Говядина вырезка · kg · minimal qoldiq 10 kg.',
    live: (l) => ({ text: `Ma'lumotnomada ${l.goods} ta tovar va ${l.dishes} ta taom`, tone: 'idle' }),
  },
  {
    id: 'order', title: "Ta'minotchiga buyurtma", who: 'Ombor', when: 'Tovar tugayotganda', to: '/warehouse/orders', openLabel: 'Buyurtmalarni ochish',
    doing: ["Bir marta «Поставщики» bo'limida ta'minotchilarni qo'shing.", "Buyurtma yarating va ta'minotchini tanlang.", '«Предложить по остаткам» tugmasini bosing: minimaldan past tovarlar o‘zi qo‘shiladi.', 'Miqdor va narxlarni tekshiring, «Отправить поставщику» tugmasini bosing.'],
    auto: ["Faqat tanlangan ta'minotchining tovarlarini tanlaydi.", "Minimal qoldiqning 2,5 baravarigacha buyurtma qiladi, narx — oxirgi xarid narxi."],
    example: 'Smetana 2 kg qoldi, minimal 5 kg → 10,5 kg buyurtma qilish taklif etiladi.',
    live: (l) => ({ text: `Minimaldan past: ${l.lowStock} · yo'ldagi buyurtmalar: ${l.ordersSent}`, tone: l.lowStock > 0 ? 'warn' : 'ok' }),
  },
  {
    id: 'income', title: 'Tovarni qabul qilish (kirim)', who: 'Ombor', when: 'Har bir yetkazib berishda', to: '/warehouse/income', openLabel: 'Kirimni ochish',
    doing: ['Buyurtma bo‘lgan bo‘lsa — uni oching va «Принять товар» tugmasini bosing.', 'Buyurtma bo‘lmasa — «Приход → Новая накладная»: ta’minotchi, tovarlar, miqdor, narx.', '«Провести» tugmasini bosing: nakladnoy qoralama bo‘lib turguncha qoldiq o‘zgarmaydi.'],
    auto: ['Qoldiqni oshiradi.', "O'rtacha tannarxni qayta hisoblaydi (o'rtacha tortilgan)."],
    example: "14 kg 95 000 so'mdan edi, 8 kg 100 700 so'mdan keldi → o'rtacha narx ≈ 97 070 so'm/kg.",
    live: (l) => ({ text: l.draftIncome ? `Provodka qilinmagan nakladnoylar: ${l.draftIncome}` : 'Barcha nakladnoylar provodka qilingan', tone: l.draftIncome ? 'warn' : 'ok' }),
  },
  {
    id: 'recipes', title: 'Retseptlar (tex. kartalar)', who: 'Ombor / shef', when: "Har bir taom uchun bir marta", to: '/warehouse/recipes', openLabel: 'Retseptlarni ochish',
    doing: ['Taom yoki zagotovkani tanlang.', "Ingredientlarni qo'shing: brutto, ishlov berishdagi yo'qotish %, porsiya chiqishi.", 'Taomga sotuv narxini belgilang.'],
    auto: ["Netto, porsiya tannarxi va food cost'ni hisoblaydi.", 'Qoldiq necha porsiyaga yetishini ko‘rsatadi.'],
    example: "Taom 169 000 so'm, xom ashyo 38 000 so'm → food cost 22% (me'yor 30% gacha).",
    live: (l) => ({ text: `Tex. kartalar: ${l.recipes}`, tone: 'idle' }),
  },
  {
    id: 'production', title: 'Zagotovkalar tayyorlash', who: 'Ombor / kuxnya', when: 'Oldindan tayyorlaganda', to: '/warehouse/production', openLabel: 'Tayyorlashni ochish',
    doing: ['Akt yarating: qaysi zagotovka va qancha tayyorlandi (bulyon 10 l, xamir 5 kg).', '«Расход сырья» jadvalini tekshiring: mahsulot yetarlimi.', '«Провести» tugmasini bosing.'],
    auto: ['Zagotovkaning tex. kartasi bo‘yicha xom ashyoni yechadi.', 'Tayyor zagotovkani partiya tannarxi bilan omborga kirim qiladi.'],
    example: "Bulyon 10 l: 3 kg mol go'shti, sabzavotlar, tuz yechildi → zagotovka omborda, 29 991 so'm/l.",
    live: (l) => ({ text: l.draftProductions ? `Provodka qilinmagan aktlar: ${l.draftProductions}` : 'Barcha aktlar provodka qilingan', tone: l.draftProductions ? 'warn' : 'ok' }),
  },
  {
    id: 'menu', title: 'Menyu va stop-list', who: 'Marketolog / ombor', when: "Menyu o'zgarganda", to: '/menu', openLabel: 'Menyuni ochish',
    doing: ["Taomni menyuga qo'shing: kategoriya, narx, sex (kuxnya yoki bar), modifikatorlar.", "Kerak bo'lsa qo'lda «Стоп» qo'ying."],
    auto: ["Xom ashyo bir porsiyaga ham yetmasa — taom o'zi stopga tushadi.", 'Tovar kirim qilingach taom sotuvga qaytadi.'],
    example: "Sariyog' tugadi → u ishlatiladigan barcha nonushtalar avtomatik stopda.",
    live: (l) => ({ text: `Stop-listda: ${l.stopCount}`, tone: l.stopCount ? 'warn' : 'ok' }),
  },
  {
    id: 'sale', title: 'Sotuv va avtomatik spisanie', who: 'Ofitsant, oshpaz, barmen', when: 'Har bir buyurtmada', to: '/warehouse/expense', openLabel: "Chiqimni ko'rish",
    doing: ['Sizdan hech narsa talab qilinmaydi.', 'Ofitsant buyurtma yuboradi → oshpaz «Принять», keyin «Готово» tugmasini bosadi.'],
    auto: ['«Готово» paytida «Продажа (авто)» chiqim hujjatini yaratadi.', "Ingredientlarni tex. karta bo'yicha yechadi (zagotovkalar — omborda bo'lsa, undan)."],
    example: "Mol go'shti shashlig'i tayyorlandi → retsept bo'yicha go'sht, piyoz, yog' darrov yechildi.",
    live: () => ({ text: 'Avtomatik ishlaydi', tone: 'ok' }),
  },
  {
    id: 'writeoff', title: 'Spisanielar: buzilish, brak, xodimlar ovqati', who: 'Ombor', when: "Fakt bo'yicha", to: '/warehouse/expense', openLabel: 'Chiqimni ochish',
    doing: ['«Расход → Новое списание»: sababni tanlang.', "Tovar va miqdorni qo'shing, «Провести» tugmasini bosing."],
    auto: ["Qoldiqni o'rtacha tannarx bo'yicha kamaytiradi.", "Ombordagidan ko'p spisanie qilishga yo'l qo'ymaydi."],
    example: 'Pomidor 3 kg — sabab «Порча» (buzilish).',
    live: (l) => ({ text: l.draftExpense ? `Provodka qilinmagan spisanielar: ${l.draftExpense}` : 'Barcha spisanielar provodka qilingan', tone: l.draftExpense ? 'warn' : 'ok' }),
  },
  {
    id: 'stock', title: 'Qoldiqlar va harakat', who: 'Ombor, administrator', when: 'Har kuni', to: '/warehouse/stock', openLabel: 'Qoldiqlarni ochish',
    doing: ["Qoldiq, o'rtacha tannarx va ombor qiymatini ko'ring.", "Tovarni bosing — kirim va chiqimning to'liq tarixi ochiladi."],
    auto: ['Hammasi provodka qilingan hujjatlardan hisoblanadi — qoldiqni hech kim alohida kiritmaydi.'],
    example: "Mol go'shti: 12 kg, o'rtacha narx 97 000, qoldiq qiymati 1 164 000 so'm.",
    live: (l) => ({ text: `Minimaldan past: ${l.lowStock}`, tone: l.lowStock ? 'warn' : 'ok' }),
  },
  {
    id: 'inventory', title: 'Inventarizatsiya', who: 'Ombor + administrator', when: 'Haftada bir marta va oy yopilishidan oldin', to: '/warehouse/inventory', openLabel: 'Inventarizatsiyani ochish',
    doing: ['Tovarni jismonan sanang.', "Inventarizatsiya yarating, har bir pozitsiya bo'yicha haqiqiy qoldiqni kiriting.", '«Провести» tugmasini bosing.'],
    auto: ['Haqiqiy qoldiqni hisobdagi bilan solishtiradi.', "Kamomadni chiqim, ortiqchani kirim sifatida rasmiylashtiradi (o'rtacha tannarx bo'yicha)."],
    example: "Hisob bo'yicha 14 kg mol go'shti, sanaganda 12 kg → 2 kg kamomad (≈ 194 000 so'm).",
    live: (l) => ({ text: l.lastInventory ? `Oxirgisi: ${date(l.lastInventory)}` : "Hali inventarizatsiya bo'lmagan", tone: l.inventoryThisMonth ? 'ok' : 'warn' }),
  },
  {
    id: 'variance', title: "Yo'qotishlar va farqlar", who: 'Rahbar, buxgalter', when: 'Inventarizatsiyadan keyin', to: '/warehouse/variance', openLabel: "Yo'qotishlarni ochish",
    doing: ["Davrni tanlab, qaysi mahsulotlar «yo'qolayotganini» ko'ring.", "Qizil belgilangan pozitsiyalarni (sarfning 5% va undan ko'p yo'qotish) tekshiring."],
    auto: ['Nazariy sarfni (retsept bo‘yicha sotuv va tayyorlash) inventarizatsiya natijasi bilan solishtiradi.', "Yo'qotish = kamomad − ortiqcha."],
    example: "Retsept bo'yicha 40 kg go'sht ketdi, yana 3 kg kamomad chiqdi → 3 kg hujjatsiz yo'qolgan.",
    live: (l) => ({ text: l.monthLoss > 0 ? `Oy bo'yicha yo'qotish: ${n(l.monthLoss)} so'm` : "Bu oyda yo'qotish yo'q", tone: l.monthLoss > 0 ? 'warn' : 'ok' }),
  },
  {
    id: 'turnover', title: 'Oborot qaydnomasi — oylik hisobot', who: 'Buxgalter, ombor', when: 'Oy oxirida', to: '/warehouse/turnover', openLabel: 'Qaydnomani ochish',
    doing: ["Davrni tanlang: oyning 1-sanasidan oxirgi sanasigacha.", "Kerak bo'lsa guruh bo'yicha filtrlang.", '«Экспорт CSV» tugmasini bosing va buxgalterga yuboring.'],
    auto: ["Hisoblaydi: boshlang'ich qoldiq + kirim − chiqim = oxirgi qoldiq.", "Hammasini miqdor va pulda, jami bilan ko'rsatadi."],
    example: "Boshida 25 kg + kirim 28 kg − chiqim 0 = oxirida 53 kg; pulda — tannarx bo'yicha.",
    live: () => ({ text: "Pastdagi tekshiruv ro'yxatidan keyin yuklashga tayyor", tone: 'idle' }),
  },
]

const eventsRu: Array<[string, string]> = [
  ['Накладная прихода проведена', 'Остаток растёт, средняя себестоимость пересчитывается.'],
  ['Заказ поставщику принят', 'Автоматически создаётся и проводится приходная накладная.'],
  ['Списание проведено', 'Остаток уменьшается по средней себестоимости.'],
  ['Блюдо отмечено «Готово»', 'Ингредиенты списываются по тех. карте (расход «Продажа (авто)»).'],
  ['Акт приготовления проведён', 'Сырьё списывается, заготовка приходуется.'],
  ['Инвентаризация проведена', 'Недостача → расход, излишек → приход.'],
  ['Проведение отменено', 'Остаток возвращается, если он не ушёл в минус из-за других документов.'],
]
const eventsUz: Array<[string, string]> = [
  ['Kirim nakladnoyi provodka qilindi', "Qoldiq oshadi, o'rtacha tannarx qayta hisoblanadi."],
  ["Ta'minotchiga buyurtma qabul qilindi", 'Kirim nakladnoyi avtomatik yaratiladi va provodka qilinadi.'],
  ['Spisanie provodka qilindi', "Qoldiq o'rtacha tannarx bo'yicha kamayadi."],
  ['Taom «Готово» deb belgilandi', "Ingredientlar tex. karta bo'yicha yechiladi («Продажа (авто)» chiqimi)."],
  ['Tayyorlash akti provodka qilindi', 'Xom ashyo yechiladi, zagotovka kirim qilinadi.'],
  ['Inventarizatsiya provodka qilindi', 'Kamomad → chiqim, ortiqcha → kirim.'],
  ['Provodka bekor qilindi', "Qoldiq qaytadi, agar boshqa hujjatlar sababli manfiyga tushmasa."],
]

const glossaryRu: Array<[string, string]> = [
  ['Проведение', 'Момент, когда документ начинает влиять на остатки. До этого он — черновик.'],
  ['Средняя себестоимость', 'Цена единицы товара, усреднённая по всем приходам с учётом количества.'],
  ['Тех. карта', 'Рецепт блюда или заготовки: из чего состоит и сколько сырья нужно.'],
  ['Брутто и нетто', 'Брутто — сколько сырья взяли, нетто — сколько осталось после обработки (за вычетом потерь).'],
  ['Food cost', 'Доля себестоимости в цене блюда. Норма — до 30%, до 40% — внимание.'],
  ['Стоп-лист', 'Блюда, которые нельзя заказать: выключены вручную или нет продуктов.'],
  ['Теоретический расход', 'Сколько продукта должно было уйти по рецептам и продажам.'],
  ['Потери', 'Разница между тем, что ушло фактически, и тем, что объяснено продажами и списаниями.'],
]
const glossaryUz: Array<[string, string]> = [
  ['Provodka (Проведение)', "Hujjat qoldiqqa ta'sir qila boshlaydigan payt. Undan oldin u — qoralama."],
  ["O'rtacha tannarx", "Barcha kirimlar bo'yicha miqdor hisobga olingan holda o'rtachalangan birlik narxi."],
  ['Tex. karta', "Taom yoki zagotovka retsepti: nimadan iborat va qancha xom ashyo kerak."],
  ['Brutto va netto', "Brutto — qancha xom ashyo olindi, netto — ishlovdan keyin qancha qoldi (yo'qotishlarni ayirib)."],
  ['Food cost', "Tannarxning taom narxidagi ulushi. Me'yor — 30% gacha, 40% gacha — e'tibor."],
  ['Stop-list', "Buyurtma qilib bo'lmaydigan taomlar: qo'lda o'chirilgan yoki mahsulot yo'q."],
  ['Nazariy sarf', "Retsept va sotuvlar bo'yicha qancha mahsulot ketishi kerak edi."],
  ["Yo'qotishlar", "Haqiqatda ketgan miqdor bilan sotuv va spisanie tushuntirgan miqdor orasidagi farq."],
]

/** Тексты интерфейса страницы и чек-листа. */
export interface GuideUi {
  label: string
  title: string
  highlight: string
  subtitle: string
  brief: string
  rule: string
  youDo: string
  sysDo: string
  example: string
  eventsTitle: string
  glossaryTitle: string
  monthTitle: string
  monthSubtitle: (done: number, total: number) => string
  manualSuffix: string
  open: string
  check: {
    income: [string, (draft: number) => string]
    orders: [string, (sent: number) => string]
    docs: [string, (n: number) => string]
    inventory: [string, (last: string | null) => string]
    loss: [string, (sum: number) => string]
    report: [string, string]
  }
}

const uiRu: GuideUi = {
  label: 'Склад', title: 'Как работает', highlight: 'склад',
  subtitle: 'Весь путь товара: от справочника и поставки до оборотной ведомости за месяц. У каждого шага — что делаете вы и что система делает сама.',
  brief: 'Коротко',
  rule: 'Главное правило: остаток меняется только после «Провести». Пока документ в черновике, склад его не видит.',
  youDo: 'Что делаете вы', sysDo: 'Что делает система сама', example: 'Пример',
  eventsTitle: 'Что происходит с остатком, когда…', glossaryTitle: 'Словарь',
  monthTitle: 'Закрытие месяца',
  monthSubtitle: (d, t) => `Проверьте по порядку — в конце ведомость будет готова к выгрузке (${d} из ${t})`,
  manualSuffix: ' · отмечается вручную', open: 'Открыть →',
  check: {
    income: ['Все приходные накладные проведены', (d) => (d ? `Осталось черновиков: ${d}` : 'Черновиков нет')],
    orders: ['Заказы поставщикам закрыты', (s) => (s ? `Ждут приёмки: ${s}` : 'Нет заказов «в пути»')],
    docs: ['Списания и акты приготовления проведены', (c) => (c ? `Непроведённых: ${c}` : 'Всё проведено')],
    inventory: ['Инвентаризация проведена в этом месяце', (l) => (l ? `Последняя: ${date(l)}` : 'Инвентаризаций ещё не было')],
    loss: ['Потери проверены, причины выяснены', (s) => (s ? `Потери за месяц: ${n(s)} сум — проверьте и отметьте` : 'Потерь за месяц нет')],
    report: ['Оборотная ведомость выгружена и передана бухгалтеру', 'Период — весь месяц, формат CSV'],
  },
}

const uiUz: GuideUi = {
  label: 'Ombor', title: 'Ombor', highlight: 'qanday ishlaydi',
  subtitle: "Tovarning butun yo'li: ma'lumotnoma va yetkazib berishdan oylik oborot qaydnomasigacha. Har bir bosqichda — siz nima qilasiz va tizim o'zi nima qiladi.",
  brief: 'Qisqacha',
  rule: "Asosiy qoida: qoldiq faqat «Провести» tugmasidan keyin o'zgaradi. Hujjat qoralama bo'lib turguncha ombor uni ko'rmaydi.",
  youDo: 'Siz nima qilasiz', sysDo: "Tizim o'zi nima qiladi", example: 'Misol',
  eventsTitle: "Qoldiq bilan nima bo'ladi, qachonki…", glossaryTitle: "Lug'at",
  monthTitle: 'Oyni yopish',
  monthSubtitle: (d, t) => `Tartib bilan tekshiring — oxirida qaydnoma yuklashga tayyor bo'ladi (${d} / ${t})`,
  manualSuffix: " · qo'lda belgilanadi", open: 'Ochish →',
  check: {
    income: ['Barcha kirim nakladnoylari provodka qilingan', (d) => (d ? `Qoralamalar qoldi: ${d}` : "Qoralamalar yo'q")],
    orders: ["Ta'minotchi buyurtmalari yopilgan", (s) => (s ? `Qabul kutmoqda: ${s}` : "«Yo'ldagi» buyurtmalar yo'q")],
    docs: ['Spisanie va tayyorlash aktlari provodka qilingan', (c) => (c ? `Provodka qilinmagan: ${c}` : 'Hammasi provodka qilingan')],
    inventory: ["Shu oyda inventarizatsiya o'tkazilgan", (l) => (l ? `Oxirgisi: ${date(l)}` : "Inventarizatsiya hali bo'lmagan")],
    loss: ["Yo'qotishlar tekshirilgan, sabablari aniqlangan", (s) => (s ? `Oy bo'yicha yo'qotish: ${n(s)} so'm — tekshirib belgilang` : "Oy bo'yicha yo'qotish yo'q")],
    report: ['Oborot qaydnomasi yuklangan va buxgalterga topshirilgan', "Davr — butun oy, format CSV"],
  },
}

export const guideContent: Record<Lang, { steps: GuideStep[]; events: Array<[string, string]>; glossary: Array<[string, string]>; ui: GuideUi }> = {
  ru: { steps: stepsRu, events: eventsRu, glossary: glossaryRu, ui: uiRu },
  uz: { steps: stepsUz, events: eventsUz, glossary: glossaryUz, ui: uiUz },
}
