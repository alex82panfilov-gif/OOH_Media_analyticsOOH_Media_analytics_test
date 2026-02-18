# Жесткий аудит проекта OOH Media Analytics

## 1) Вердикт (Executive Summary)

- **Код и архитектура: 4.5/10**
- **Безопасность: 3/10**
- **UI/UX и дизайн: 5.5/10**
- **Итог:** в текущем виде проект **не production-ready**. Переписывать с нуля не обязательно, но без срочного рефакторинга и закрытия security-дыр запуск в открытый интернет — высокий риск.

## 2) Зона поражения (критические проблемы)

1. **Небезопасная сборка SQL в DuckDB worker (инъекции через фильтры).**
   - Фильтры (city/year/month/format/vendor) подставляются в SQL через string interpolation без escaping и параметризации.
   - Риск: подмена условий запроса, поломка запросов, возможный доступ к нежелательным данным.

2. **Аутентификация на «честном слове», без сессий, без token/cookie, без rate limit.**
   - Сервер только сравнивает пароль и возвращает роль.
   - Клиент хранит роль в Zustand, logout = `window.location.reload()`.
   - Любой XSS в будущем = полный обход «авторизации» на клиенте.

3. **Секретные данные фактически публичны из `/public` + security by obscurity.**
   - Parquet-файлы отдаются статикой (`/public/storage_v1_9hf29sk`), а путь «секретной папки» зашит константой.
   - Это не контроль доступа, а маскировка URL.

4. **Отсутствует нормальная обработка ошибок и observability.**
   - Ошибки в auth и data-fetcher проглатываются до простого флага/console.error.
   - Нет унифицированного error boundary/telemetry.

5. **Сильный type debt: массовое использование `any`.**
   - В ядре аналитики и визуализации это повышает риск runtime-ошибок и «тихих» неверных расчетов.

## 3) Технический долг и “душные” придирки

### Архитектура и код

- **God-component в `App.tsx`:** layout, auth-gate, навигация, фильтры, KPI, табы и действия в одном файле.
- **Расхождение с SOLID:** UI, state orchestration и business flow связаны напрямую.
- **Отсутствие контрактов данных между worker ↔ store ↔ components.** Сейчас это `any[]`/`any`.

### Производительность

- На каждый чих фильтров запускается новый тяжелый SQL pipeline (несколько query подряд).
- Нет debounce/filter batching.
- Повторные вычисления трендов/матриц/treemap на клиенте + на серверной стороне worker.

### Пример рефакторинга (Было/Стало)

#### Было (уязвимо)
```ts
clauses.push(`city IN (${filters.city.map((c: any) => `'${c}'`).join(',')})`);
```

#### Стало (минимально безопаснее)
```ts
const escapeSql = (v: string) => v.replace(/'/g, "''");
const inList = (vals: string[]) => vals.map(v => `'${escapeSql(v)}'`).join(',');
clauses.push(`city IN (${inList(filters.city)})`);
```

#### Стало (enterprise-подход)
- Белый список допустимых значений фильтров (из уже рассчитанных options).
- DTO-схема валидации входящих сообщений в worker через Zod.
- Отказ от динамического SQL там, где можно использовать подготовленные шаблоны.

## 4) UX/UI Roasting

1. **A11y провал на интерактивных элементах карты.**
   - Кастомные `L.divIcon` маркеры не имеют семантики/aria-лейблов и keyboard-навигации.

2. **Фильтры-мультиселекты не имеют явных ARIA-атрибутов.**
   - Dropdown поведение не описано для screen reader.

3. **Типографика и контраст местами на грани.**
   - Текст размера `text-[9px]/[10px]` и серые подписи создают читаемость уровня «только для идеального зрения».

4. **UX-логика “Выход = reload” антипаттерн.**
   - Нет ясного состояния сессии, нет “remember me”, нет уведомлений о timeout.

## 5) Strategy Level Up (как вывести на enterprise-уровень)

### Security-first
- Внедрить нормальный auth слой: `httpOnly` cookies + server-side session/JWT rotation + rate limiting.
- CSP, Trusted Types (где применимо), заголовки безопасности (Helmet), запрет inline-скриптов.
- Проверка входных payload в worker и API по Zod-схемам.

### Архитектура
- Разделить `App.tsx` на feature-модули:
  - `features/auth`
  - `features/filters`
  - `features/analytics`
  - `features/map`
  - `features/reports`
- Ввести typed domain contracts (`types/domain.ts`) + `Result<T, E>` style handling.
- Кеширование и оркестрация запросов через React Query (TanStack Query).

### Data/Performance
- Предварительные агрегаты и materialized views (или подготовленные parquet extracts по use-case).
- Debounce фильтров + отмена устаревших query.
- Web Worker protocol versioning и метрики latency.

### Design System
- Внедрить токены дизайна (spacing, typography, color roles), единый компонентный слой.
- Проверить WCAG 2.2 AA: контраст, focus states, tab order, labels.

### Референсы
- OWASP ASVS + Cheat Sheets (Auth, Input Validation, XSS Prevention).
- TanStack Query patterns (enterprise data-fetching).
- GOV.UK Design System / IBM Carbon (как эталон системного a11y).

## 6) Этапы исправления кода: от простого к сложному

### Этап 1 — Быстрые победы (1–2 дня)
- Убрать прямую интерполяцию фильтров в SQL и добавить экранирование строковых значений.
- Убрать `window.location.reload()` для logout: сделать явный `logout()` в store с очисткой роли/фильтров/данных.
- Добавить базовую валидацию payload в `api/auth` и не принимать пустой/нестроковый пароль.
- Добавить минимальные ARIA-атрибуты в `MultiSelect` (`aria-expanded`, `aria-controls`, `role=listbox`).

### Этап 2 — Стабилизация и контроль качества (3–5 дней)
- Ввести строгие типы для `mapData`, `matrixData`, `trendData`, `reportData` вместо `any[]`.
- Разделить `App.tsx` на контейнеры: `AuthGate`, `TopNav`, `FilterBar`, `AnalyticsTab`, `MapTab`, `ReportsTab`.
- Добавить debounce на изменение фильтров и отмену устаревших запросов в worker.
- Включить линтинг и тип-чек в CI (минимум: `tsc --noEmit`, ESLint).

### Этап 3 — Усиление безопасности (1–2 недели)
- Перейти с role-only ответа на серверные сессии (`httpOnly` cookie, TTL, rotation).
- Добавить rate limiting на `api/auth` + блокировку по IP/устройству при brute force.
- Вынести данные из публичной статики при необходимости ограниченного доступа (signed URLs или backend proxy).
- Добавить security headers: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.

### Этап 4 — Архитектурный апгрейд (2–4 недели)
- Внедрить модульную feature-архитектуру и единые контракты доменных типов.
- Перевести data-fetch orchestration на TanStack Query + кэш + инвалидация.
- Ввести протокол сообщений worker (versioned schema + валидация Zod на вход/выход).
- Добавить telemetry: latency/error rate по запросам, ошибки worker/API, UX-мониторинг.

### Этап 5 — Enterprise hardening и UX-полировка (постоянно)
- Провести аудит WCAG 2.2 AA и закрыть keyboard/screen-reader пробелы (включая карту).
- Ввести дизайн-токены и компонентную дизайн-систему для консистентности.
- Добавить performance budget (bundle size, TTI) и алерты на деградацию.
- Формализовать threat modeling и регулярный security review в release-процессе.
