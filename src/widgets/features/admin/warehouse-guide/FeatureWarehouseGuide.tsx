import { useState } from 'react'
import { LuArrowRight, LuBot, LuLanguages, LuLightbulb, LuUser } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { cn } from '@/lib/cn'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import MonthChecklist from './components/MonthChecklist'
import { useWarehouseLive } from './hooks/useWarehouseLive'
import { guideContent, type Lang, type LiveTone } from './steps'

const LANG_KEY = 'thebani_guide_lang'

const toneStyle: Record<LiveTone, string> = {
  ok: 'bg-success/10 text-success',
  warn: 'bg-warning/15 text-warning',
  idle: 'bg-park-bgHover text-park-text3',
}

/** Язык этой страницы запоминается. Это единственная страница с переключателем RU / UZ — по просьбе заказчика. */
function useGuideLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => {
    try { return localStorage.getItem(LANG_KEY) === 'uz' ? 'uz' : 'ru' } catch { return 'ru' }
  })
  const change = (l: Lang) => {
    setLang(l)
    try { localStorage.setItem(LANG_KEY, l) } catch { /* без сохранения */ }
  }
  return [lang, change]
}

/** Как работает склад: путь товара от справочника до месячной оборотной ведомости (RU / UZ). */
export default function FeatureWarehouseGuide() {
  const navigate = useNavigate()
  const live = useWarehouseLive()
  const [lang, setLang] = useGuideLang()
  const { steps, events, glossary, ui } = guideContent[lang]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <div className="flex items-center justify-end gap-2">
        <LuLanguages size={16} className="text-park-textMuted" />
        <div role="group" aria-label="Язык / Til" className="flex overflow-hidden rounded-lg border border-park-border bg-park-bgCard">
          {(['ru', 'uz'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={cn('px-4 py-1.5 text-sm font-bold uppercase transition', lang === l ? 'bg-primary text-white' : 'text-park-text3 hover:bg-park-bgHover')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <PageHeader label={ui.label} title={ui.title} highlight={ui.highlight} subtitle={ui.subtitle} />

      <CusCard className="p-5">
        <p className="mb-3 text-sm font-bold text-park-text">{ui.brief}</p>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold text-park-text3">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              <a href={`#step-${s.id}`} className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20">{i + 1}. {s.title}</a>
              {i < steps.length - 1 && <LuArrowRight size={13} className="text-park-textMuted" />}
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-start gap-2 text-xs text-park-textMuted"><LuLightbulb size={14} className="mt-0.5 shrink-0 text-warning" />{ui.rule}</p>
      </CusCard>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const l = s.live(live)
          return (
            <CusCard key={s.id}>
              <div id={`step-${s.id}`} className="scroll-mt-24 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">{i + 1}</span>
                    <div>
                      <h3 className="text-base font-bold text-park-text">{s.title}</h3>
                      <p className="text-xs text-park-textMuted">{s.who} · {s.when}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', toneStyle[l.tone])}>{l.text}</span>
                    <CusButton size="sm" variant="outline" onClick={() => navigate(s.to)}>{s.openLabel}</CusButton>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-2">
                  <div className="rounded-xl bg-park-bgHover/60 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-park-textMuted"><LuUser size={14} /> {ui.youDo}</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-park-text3">{s.doing.map((d) => <li key={d}>{d}</li>)}</ul>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary"><LuBot size={14} /> {ui.sysDo}</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-park-text3">{s.auto.map((a) => <li key={a}>{a}</li>)}</ul>
                  </div>
                </div>
                <p className="mt-3 text-sm text-park-textMuted"><b className="text-park-text3">{ui.example}:</b> {s.example}</p>
              </div>
            </CusCard>
          )
        })}
      </div>

      <MonthChecklist live={live} ui={ui} />

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-2">
        <CusCard>
          <CusCardHeader title={ui.eventsTitle} />
          <ul className="divide-y divide-park-border">
            {events.map(([event, effect]) => (
              <li key={event} className="px-5 py-3 text-sm"><p className="font-semibold text-park-text">{event}</p><p className="text-park-textMuted">{effect}</p></li>
            ))}
          </ul>
        </CusCard>
        <CusCard>
          <CusCardHeader title={ui.glossaryTitle} />
          <dl className="divide-y divide-park-border">
            {glossary.map(([term, meaning]) => (
              <div key={term} className="px-5 py-3 text-sm"><dt className="font-semibold text-park-text">{term}</dt><dd className="text-park-textMuted">{meaning}</dd></div>
            ))}
          </dl>
        </CusCard>
      </div>
    </div>
  )
}
