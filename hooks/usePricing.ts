import { useEffect, useState } from 'react'
import { PRICING, SUBJECT_TIERS, SessionFormat, SubjectTier } from '../constants/pricing'
import { supabase } from '../lib/supabase'

type PricingMap = Record<SessionFormat, Record<SubjectTier, { parentRate: number; tutorRate: number }>>
type SubjectTierMap = Record<string, SubjectTier>

type PricingState = {
  pricing: PricingMap
  subjectTiers: SubjectTierMap
  subjects: string[]
  loading: boolean
  getPrice: (subject: string, format: SessionFormat) => { parentRate: number; tutorRate: number }
}

// Build flat subjects list from the tier map
function buildSubjectList(tierMap: SubjectTierMap): string[] {
  const basic  = Object.entries(tierMap).filter(([, t]) => t === 'basic').map(([s]) => s)
  const upper  = Object.entries(tierMap).filter(([, t]) => t === 'upper').map(([s]) => s)
  const sat    = Object.entries(tierMap).filter(([, t]) => t === 'sat').map(([s]) => s)
  return [...basic, ...upper, ...sat]
}

export function usePricing(): PricingState {
  const [pricing, setPricing]           = useState<PricingMap>(PRICING)
  const [subjectTiers, setSubjectTiers] = useState<SubjectTierMap>(SUBJECT_TIERS)
  const [subjects, setSubjects]         = useState<string[]>(buildSubjectList(SUBJECT_TIERS))
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function fetchPricing() {
      const [{ data: rates }, { data: tiers }] = await Promise.all([
        supabase.from('pricing').select('session_format, subject_tier, parent_rate, tutor_rate'),
        supabase.from('subject_tiers').select('subject, tier'),
      ])

      if (rates && rates.length > 0) {
        const map = { ...PRICING } as PricingMap
        for (const row of rates) {
          map[row.session_format as SessionFormat][row.subject_tier as SubjectTier] = {
            parentRate: row.parent_rate,
            tutorRate: row.tutor_rate,
          }
        }
        setPricing(map)
      }

      if (tiers && tiers.length > 0) {
        const map: SubjectTierMap = {}
        for (const row of tiers) map[row.subject] = row.tier as SubjectTier
        setSubjectTiers(map)
        setSubjects(buildSubjectList(map))
      }

      setLoading(false)
    }

    fetchPricing()
  }, [])

  function getPrice(subject: string, format: SessionFormat) {
    const tier = subjectTiers[subject] ?? 'basic'
    return pricing[format][tier]
  }

  return { pricing, subjectTiers, subjects, loading, getPrice }
}
