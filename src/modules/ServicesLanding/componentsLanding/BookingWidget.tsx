import * as React from 'react'
import { Box, Chip, CircularProgress, List, ListItemButton, Stack, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { es } from 'date-fns/locale'
import { format, startOfDay } from 'date-fns'
import { supabase } from '../../../components/lib/supabaseClient.ts';

export type Slot = { slot_start: string; slot_end: string }

type Props = {
  companyId: string
  staffId: string
  serviceIds: string[]
  onSelect(slot: Slot): void
}

export default function BookingWidget({ companyId, staffId, serviceIds, onSelect }: Props) {
  const [day, setDay] = React.useState<Date>(new Date())
  const [slots, setSlots] = React.useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [monthCounts, setMonthCounts] = React.useState<Record<string, number>>({})
  const [loadingMonth, setLoadingMonth] = React.useState(false)

  const dayISO = format(day, 'yyyy-MM-dd')
  const year = Number(format(day, 'yyyy'))
  const month = Number(format(day, 'M'))

  async function getTotalMinutes() {
    if (!serviceIds?.length) return 0
    const { data, error } = await supabase.from('services').select('duration_minutes').in('id', serviceIds)
    if (error) throw error
    return (data ?? []).reduce((acc: number, r: any) => acc + (r.duration_minutes ?? 0), 0)
  }

  async function loadMonthCounts() {
    setLoadingMonth(true); setError(null)
    try {
      const total = await getTotalMinutes()
      if (!total) { setMonthCounts({}); return }
      const { data, error } = await supabase.rpc('get_available_days_v2', {
        p_company_id: companyId,
        p_staff_id: staffId,
        p_year: year,
        p_month: month,
        p_total_minutes: total,
        p_step_minutes: 15,
      })
      if (error) throw error
      const map: Record<string, number> = {}
      ;(data as any[]).forEach(r => {
        const k = format(new Date(r.day), 'yyyy-MM-dd')
        map[k] = r.slots_count as number
      })
      setMonthCounts(map)
    } catch (e: any) {
      setError(e.message ?? 'Error cargando disponibilidad del mes')
    } finally {
      setLoadingMonth(false)
    }
  }

  async function loadDaySlots() {
    setLoadingSlots(true); setError(null)
    try {
      const total = await getTotalMinutes()
      if (!total) { setSlots([]); return }
      const { data, error } = await supabase.rpc('get_available_slots_v2', {
        p_company_id: companyId,
        p_staff_id: staffId,
        p_date: dayISO,
        p_total_minutes: total,
        p_step_minutes: 15,
      })
      if (error) throw error
      setSlots(data as Slot[])
    } catch (e: any) {
      setError(e.message ?? 'Error cargando horarios')
    } finally {
      setLoadingSlots(false)
    }
  }

  React.useEffect(() => { loadMonthCounts() }, [companyId, staffId, year, month, JSON.stringify(serviceIds)])
  React.useEffect(() => { loadDaySlots() }, [companyId, staffId, dayISO, JSON.stringify(serviceIds)])

  const renderDay = (date: Date, _selected: any, pickersDayProps: any) => {
    const key = format(date, 'yyyy-MM-dd')
    const count = monthCounts[key] ?? 0
    const isPast = startOfDay(date) < startOfDay(new Date())
    return (
      <Box sx={{ position: 'relative' }}>
        <PickersDay {...pickersDayProps} disabled={isPast || count === 0} />
        {count > 0 && (
          <Chip label={count} size="small"
            sx={{ position: 'absolute', bottom: 2, right: 2, transform: 'scale(0.75)', pointerEvents: 'none' }} />
        )}
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Stack spacing={2}>
        <DateCalendar value={day} onChange={(d) => d && setDay(d)} onMonthChange={(m) => m && setDay(m)} renderDay={renderDay}/>
        {(loadingMonth || loadingSlots) && <CircularProgress size={24} />}
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        {!loadingSlots && slots && (
          <>
            {slots.length === 0 ? (
              <Typography variant="body2">No hay horarios disponibles para este día.</Typography>
            ) : (
              <List dense sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {slots.map(s => {
                  const label = `${format(new Date(s.slot_start), 'HH:mm')} - ${format(new Date(s.slot_end), 'HH:mm')}`
                  return (
                    <ListItemButton key={s.slot_start} onClick={() => onSelect(s)}>
                      {label}
                    </ListItemButton>
                  )
                })}
              </List>
            )}
          </>
        )}
      </Stack>
    </LocalizationProvider>
  )
}
