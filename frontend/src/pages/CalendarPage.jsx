import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays } from 'lucide-react';
import { useCalendar, useUpsertCalendar } from '../hooks/useContent.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../lib/errorMessage.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** @param {Date} date */
function mondayOf(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // shift Sunday(0) back to the previous Monday
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** @param {Date} date */
function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const toast = useToast();
  const [weekStartDate, setWeekStartDate] = useState(() => mondayOf(new Date()));
  const weekStart = toIsoDate(weekStartDate);

  const { data: calendar, isLoading } = useCalendar(weekStart);
  const upsertCalendar = useUpsertCalendar();

  const [draftDay, setDraftDay] = useState(null);
  const [draftTopic, setDraftTopic] = useState('');
  const [draftTime, setDraftTime] = useState('');

  const slots = calendar?.slots ?? [];

  const changeWeek = (deltaDays) => {
    setWeekStartDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + deltaDays);
      return next;
    });
    setDraftDay(null);
  };

  const saveSlots = async (nextSlots) => {
    try {
      await upsertCalendar.mutateAsync({ weekStart, slots: nextSlots, preferences: calendar?.preferences });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const addSlot = async (day) => {
    if (!draftTopic.trim()) {
      toast.error('Add a topic for this slot.');
      return;
    }
    const nextSlots = [...slots, { dayOfWeek: day, time: draftTime || undefined, topicTag: draftTopic.trim() }];
    await saveSlots(nextSlots);
    setDraftDay(null);
    setDraftTopic('');
    setDraftTime('');
  };

  const removeSlot = async (index) => {
    const nextSlots = slots.filter((_, i) => i !== index);
    await saveSlots(nextSlots);
  };

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        subtitle={`${weekStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => changeWeek(-7)} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekStartDate(mondayOf(new Date()))}>
              This week
            </Button>
            <Button variant="secondary" size="sm" onClick={() => changeWeek(7)} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Card>
          <SkeletonLines count={6} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {DAYS.map((day) => {
            const daySlots = slots
              .map((slot, index) => ({ ...slot, index }))
              .filter((slot) => slot.dayOfWeek === day);

            return (
              <div key={day} className="rounded-xl border border-(--color-line) bg-(--color-paper-raised) p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-ink-faint)">{day}</p>

                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.index}
                      className="group flex items-start justify-between gap-1.5 rounded-lg bg-(--color-accent-soft) px-2.5 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-(--color-accent)">{slot.topicTag}</p>
                        {slot.time && <p className="text-(--color-accent)/70">{slot.time}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.index)}
                        className="text-(--color-accent)/50 hover:text-(--color-critical)"
                        aria-label="Remove slot"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {draftDay === day ? (
                  <div className="mt-2 space-y-2">
                    <TextField id={`topic-${day}`} value={draftTopic} onChange={setDraftTopic} placeholder="Topic" />
                    <TextField id={`time-${day}`} value={draftTime} onChange={setDraftTime} placeholder="09:00 (optional)" />
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => addSlot(day)} loading={upsertCalendar.isPending}>
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDraftDay(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDraftDay(day)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-(--color-line) py-2 text-xs text-(--color-ink-faint) hover:border-(--color-accent) hover:text-(--color-accent)"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && slots.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={CalendarDays}
            title="No slots planned for this week"
            description="Add a slot to any day to start planning your week."
          />
        </div>
      )}
    </div>
  );
}
