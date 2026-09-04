<script setup lang="ts">
import {
  CalendarRoot,
  CalendarHeader,
  CalendarHeading,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarGridRow,
  CalendarCell,
  CalendarCellTrigger,
  CalendarHeadCell,
  CalendarPrev,
  CalendarNext,
} from 'radix-vue'
import type { DateValue } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

const modelValue = defineModel<DateValue | undefined>()

const props = defineProps<{
  class?: unknown
  minValue?: DateValue
}>()

const weekDays = Array.from({ length: 7 }, (_, index) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(2024, 0, index + 1)),
)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid }"
    v-model="modelValue"
    :week-starts-on="1"
    :min-value="props.minValue"
    :class="cn('inline-flex select-none flex-col gap-2 p-3', props.class)"
  >
    <CalendarHeader class="flex items-center justify-between px-1 pt-1">
      <CalendarPrev
        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        aria-label="Previous month"
      >
        <ChevronLeftIcon class="h-4 w-4" aria-hidden="true" />
      </CalendarPrev>
      <CalendarHeading class="text-sm font-semibold text-slate-900" />
      <CalendarNext
        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        aria-label="Next month"
      >
        <ChevronRightIcon class="h-4 w-4" aria-hidden="true" />
      </CalendarNext>
    </CalendarHeader>

    <CalendarGrid class="border-collapse">
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell
            v-for="day in weekDays"
            :key="day"
            class="w-9 pb-1 text-center text-[11px] font-medium text-slate-400"
          >
            {{ day }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow
          v-for="(dates, index) in grid[0]?.rows"
          :key="`week-${index}`"
          :week-dates="dates"
          class="mt-0.5"
        >
          <CalendarCell v-for="date in dates" :key="date.toString()" :date="date" class="relative p-0 text-center text-sm">
            <CalendarCellTrigger
              :day="date"
              :month="grid[0]?.value"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 data-[selected=true]:rounded-full data-[selected=true]:bg-slate-900 data-[selected=true]:font-semibold data-[selected=true]:text-white data-[today=true]:bg-slate-100 data-[today=true]:font-semibold data-[today=true]:text-slate-900 data-[today=true]:data-[selected=true]:bg-slate-900 data-[today=true]:data-[selected=true]:text-white data-[disabled=true]:text-slate-300 data-[outside-view]:pointer-events-none data-[outside-view]:opacity-0"
            />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
