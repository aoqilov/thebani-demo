# Thebani Admin — CLAUDE.md

Админ-панель + мобильные интерфейсы кассира и оператора. React + Vite + TypeScript.
Структура и подходы взяты из `park-system-mobile`; внешний вид — Kaiadmin Lite.

---

## Язык (ОБЯЗАТЕЛЬНО)

**Весь пользовательский текст пишется только на русском языке**: заголовки, подписи, кнопки,
placeholder'ы, сообщения об ошибках, toast'ы, пункты меню, пустые состояния, текст в диалогах.

- Новые строки не пишем на узбекском или английском.
- Приложение одноязычное (только `ru`, переключателя языка нет). Повторяющиеся тексты и навигацию выносим в `src/i18n/ru.json`
  и используем через `useTranslation('prefix.')`.
- Одноразовые тексты внутри feature можно писать прямо в JSX, но тоже на русском.
- Комментарии в коде и сообщения коммитов — на русском.
- Имена переменных, файлов, компонентов и ключей i18n — на английском.

---

## Стек

| Инструмент | Заметки |
|---|---|
| React 19 + TypeScript (strict) | `erasableSyntaxOnly` — **без `enum`**, используем `as const` объекты |
| Vite | alias `@` → `src/` |
| Tailwind CSS v4 | токены в `@theme` внутри `src/index.css` |
| Recharts | все графики только через `CusChart` |
| React Router (data router) | `src/routes/routes.tsx` |
| TanStack Query + Axios | `src/api-config/` |
| react-icons | только набор `react-icons/lu` |

Всегда импортируем через `@/`, никаких `../../../` между границами feature.

---

## Структура папок (FSD)

```
src/
├─ api-config/       axiosInstance, interceptors (Bearer + 401), queryClient
├─ api/<entity>/     функции API (пока mock из src/data/mock.ts)
├─ components/
│  ├─ ui/<group>/    Cus* компоненты (buttons, badge, table, inputs, select, dialog, popover, ...)
│  ├─ shared/card/   CusCard, CusCardHeader, CusInfoRow, CusStatCard
│  ├─ charts/        CusChart
│  └─ layout/        admin/ (AppLayout, header, sidebar), role-app/ (RoleAppLayout), shared/ (RoleShell, UserMenu, SettingsPanel)
├─ widgets/
│  ├─ shared-ui/     PageHeader
│  └─ features/<role>/<feature>/{types,hooks,components,modals}/ + Feature<Name>.tsx
├─ pages/            тонкие обёртки (admin/main, admin/control, roles/<role>)
├─ routes/           routes.tsx, AppRoutes.tsx
├─ middleware/       AuthGuard
├─ context/ hooks/ i18n/ const/ theme/ types/ utils/ data/
```

### Feature

Корневой `Feature<Name>.tsx` — только композиция. Логика в `hooks/`, UI в `components/`,
диалоги в `modals/`, типы в `types/index.ts`. Страница в `src/pages/` — тонкая обёртка:

```tsx
import FeatureX from "@/widgets/features/admin/x/FeatureX";
export default function X() { return <FeatureX />; }
```

---

## Свои UI-компоненты (`Cus*`)

Все UI-кит компоненты пишем сами с префиксом `Cus`. **Не использовать «сырые» HTML-аналоги и
сторонние UI-библиотеки** (Chakra, MUI и т.п.).

`CusButton` (проп `isDisabled`, а не `disabled`), `CusBadge`, `CusAvatar`, `CusAlert`, `CusTabs`,
`CusTable` + `CusPagination`, `CusInput`, `CusTextArea`, `CusCheckbox`, `CusSwitch`, `CusSelect`,
`CusDialog`, `CusDialogDelete`, `CusDrawer`, `CusPopover`, `CusBreadCrumb`, `CusCard`,
`CusStatCard`, `CusChart`.

Нужен новый компонент — создаём `Cus<Name>` в подходящей папке `components/ui/`.

---

## Тема и цвета

- Палитра Kaiadmin: primary `#1572e8`, success `#31ce36`, info `#48abf7`, warning `#ffad46`,
  danger `#f25961`, secondary `#6861ce`, dark `#1a2035`. Шрифт — Public Sans.
- Цвета поверхностей и текста — через токены `park-*` (CSS-переменные), например
  `bg-park-bgCard`, `text-park-text`, `border-park-border`. Тёмная тема — класс `dark` на `<html>`.
- Карточки: белые, с тенью `shadow-card`, без рамки (в тёмной теме рамка включается).
- **Sidebar**: цвет задаётся CSS-переменными `--sidebar-*` и меняется в панели настроек
  (⚙ в header). Пресеты — `sidebarPresets` в `src/context/ThemeContext.tsx`.
  В стилях sidebar используем `bg-[var(--sidebar-bg)]`, не жёсткие цвета.
- Sidebar на desktop **не закрывается полностью**: в свёрнутом виде остаётся полоса 92px только с иконками.
  Scrollbar скрыт (`no-scrollbar`).

---

## Адаптивность

Только кастомные брейкпоинты. **Не использовать** `sm:`, `md:`, `lg:`.

```
(без префикса) 0–479px    mobile
tablet:        480px+
desktop:       1020px+    sidebar закреплён
wide:          1440px+
```

Таблицы всегда оборачиваем в `overflow-x-auto`.

---

## Роли и маршруты

Домен: банный комплекс (thebani.uz). Гость получает **NFC-браслет**, на который открывается счёт;
все услуги, кухня и бар складываются в один счёт, который закрывает кассир.

Роли — `RoleTypes` в `src/const/constData.ts`; группы для sidebar/маршрутов — `RoleGroups`.

### Админ-панель (desktop, `AppLayout`)
| Роль | Что делает |
|---|---|
| superadmin / owner / director | Всё; owner и director — только просмотр |
| admin (администратор смены) | Оперативное управление, возвраты/скидки, блокировка браслета |
| accountant | Финансы, Z-отчёты |
| marketing | Тарифы, комбо, акции, меню |
| hr | Сотрудники |
| sklad | Приход/расход, рецепты (тех. карты, как в iiko), товары |
| procedure (менеджер услуг) | Создаёт услуги, цены, направления массажа и сотрудников-массажистов |

### Мобильные рабочие места (по одному layout на роль)
Конфигурация — `src/const/roleApps.ts`, единый layout — `components/layout/role-app/RoleAppLayout.tsx`.

| Роль | Путь | Задача |
|---|---|---|
| reception | `/reception` | Выбрать тариф, выдать браслет, открыть счёт |
| cashier | `/cashier` | Закрыть счёт по браслету на выходе, принять оплату, смена |
| razdevalka | `/razdevalka` | Единая раздевалка с электронными шкафами: считать браслет, выдать любой свободный шкаф; шкаф открывается этим же браслетом, при закрытии счёта освобождается |
| waiter | `/waiter` | Открыть счёт на стол, привязать браслет, заказы |
| cook | `/cook` | Заказы официантов, сгруппированные по столам |
| bartender | `/bar` | Заказы бара (обязанности уточняются) |
| cleaner | `/cleaner` | Пока не делаем (отложено) |
| masseur | `/masseur` | Добавить оказанную услугу на NFC клиента с любой POS |

- Новый пункт sidebar — в `components/layout/admin/sidebar/sidebarNav.ts` (с `roles`) + ключ в `ru.json`.
- Родитель без видимых подпунктов скрывается автоматически.
- Новый маршрут — в `src/routes/routes.tsx` через `lazy` и `rg(<Page />, RoleGroups.X)`.
- Мобильные экраны: max-width 768px, кнопки не ниже 56px, иконка + текст, крупные числа.

---

## Данные и API

**Сейчас работаем полностью на MOCK-данных.** Backend не подключаем и не ждём.

- Любая новая feature сразу делается с mock: данные лежат в `src/data/` (по файлу на сущность,
  например `employees.mock.ts`), а функции в `src/api/<entity>/` возвращают их через `delay()`.
- Интерфейс функций API и типы пишем так, как будто это настоящий backend (пагинация, фильтры,
  `create/update/delete` меняют in-memory store), чтобы потом заменить только тело функции.
- Mock должен быть реалистичным: русские имена и названия, суммы в сумах, разные статусы и роли,
  достаточно строк для пагинации (10+), хотя бы одно пустое и одно «плохое» значение для проверки UI.
- Не вызываем реальные URL и не добавляем `.env` с адресом backend.

- Пока backend нет — функции в `src/api/*` возвращают mock из `src/data/mock.ts`
  (помечены `TODO`). Когда появится backend, заменяем на `api.get(...)` из `@/api-config/axiosInstance`.
- Запросы только через TanStack Query (`useQuery`/`useMutation`), ключи в константе `*_KEYS`.
- Авторизация демо: `FeaturedLogin` сохраняет выбранную роль + фейковый токен (`authApi.ts`).

---

## Правила кода

- TypeScript strict, `noUnusedLocals`, `verbatimModuleSyntax` → типы импортируем через `import type`.
- Не используем `enum` — только `as const`.
- Классы объединяем через `cn()` из `@/lib/cn`.
- Перед завершением задачи запускаем `npx tsc -b` и `npx vite build`.

---

## Демо-ядро «iiko»

Единый mock-store `src/data/warehouse.store.ts` (localStorage, ключ `thebani_warehouse_vN`, синхронизация между вкладками через `BroadcastChannel`).
В нём: склад (товары, документы прихода/расхода), тех. карты, меню (категории, позиции, модификаторы), столы и заказы.
- При изменении схемы store увеличиваем версию ключа (`vN`), иначе у пользователей останутся старые данные.
- Все query-ключи начинаются с `['wh', ...]` — по ним инвалидируется кэш при синхронизации вкладок.
- Расчёты: `warehouse.calc.ts` (остатки, средняя себестоимость), `recipe.calc.ts` (себестоимость, food cost, «хватит на N»), `menu.calc.ts` (стоп-лист: ручной и автоматический).
- Фото меню лежат в `public/menu/<productId>.jpg` (источники — `public/menu/CREDITS.md`). Всегда выводим через `CusImage` — у него есть заглушка.

---

## Реальные данные (thebani.uz)

Mock-данные собраны с https://thebani.uz/ (тарифы, меню кухни и бара, процедуры бани и SPA, товары магазина, правила).
- Меню: `src/data/real/menu.raw.ts` (сырые данные с сайта) → `src/data/real/catalog.ts` строит товары бара, блюда, тех. карты и позиции меню.
  Тех. карты блюд **приблизительные** (типовой состав по виду блюда) — их уточняет шеф. Напитки (пиво, водка, вино, лимонады) — покупные товары, списываются как есть.
- Тарифы — `tariff.mock.ts` (будни/выходные/безлимит/дети/пенсионеры/VIP-кабинки); услуги и мастера — `services.mock.ts`; товары магазина — `shop.mock.ts`.
- Правила сайта в коде: обслуживание **20%** только на кухню и бар (`data/billing.ts`), экстра-час при превышении оплаченного времени более чем на 15 минут (`data/overtime.ts`).
- Не взято с сайта (придумано для демо): штраф за утерю браслета (50 000 сум), закупочные цены сырья и проценты мастеров.
- Пока не реализовано из данных сайта: банные номера (Южная, Восточная, «На МОРЕ») с бронированием, комбо-пакеты, абонементы и подарочные карты.

---

## Склад как в iiko (демо)

Помимо прихода/расхода, остатков и тех. карт есть:
- **Инвентаризация** (`/warehouse/inventory`): факт vs учёт; при проведении недостача → расход, излишек → приход (обычные документы склада с полем `source`).
- **Приготовление** (`/warehouse/production`): сырьё списывается по тех. карте заготовки, заготовка приходуется по себестоимости партии.
- **Заказы поставщикам** (`/warehouse/orders`): «Предложить по остаткам» (`data/purchasing.ts`), отправка, приёмка создаёт проведённую приходную накладную.
- **Оборотная ведомость** (`/warehouse/turnover`, `data/turnover.ts`): начало + приход − расход = конец, экспорт в CSV.
- Документы, созданные автоматически (`source`), нельзя править или отменять напрямую — только через документ-источник.
- Логика: `api/warehouse/ops.api.ts`. Все операции строятся поверх `replay()` из `warehouse.calc.ts`, поэтому остатки и себестоимость всегда согласованы.
- **Потери и расхождения** (`/warehouse/variance`, `data/variance.ts`): теоретический расход (продажи и приготовление по тех. картам) против факта инвентаризации. Потери = недостача − излишек.

- **Исключение из правила о языке:** страница `/warehouse/guide` («Как работает склад») имеет переключатель RU / UZ (тексты в `warehouse-guide/steps.ts`, выбор языка хранится в localStorage). Остальные страницы — только на русском.
