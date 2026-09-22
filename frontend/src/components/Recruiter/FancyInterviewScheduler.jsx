import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Globe, 
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  { label: '09:00 AM', hour: 9, minute: 0 },
  { label: '09:30 AM', hour: 9, minute: 30 },
  { label: '10:00 AM', hour: 10, minute: 0 },
  { label: '10:30 AM', hour: 10, minute: 30 },
  { label: '11:00 AM', hour: 11, minute: 0 },
  { label: '11:30 AM', hour: 11, minute: 30 },
  { label: '01:00 PM', hour: 13, minute: 0 },
  { label: '01:30 PM', hour: 13, minute: 30 },
  { label: '02:00 PM', hour: 14, minute: 0 },
  { label: '02:30 PM', hour: 14, minute: 30 },
  { label: '03:00 PM', hour: 15, minute: 0 },
  { label: '03:30 PM', hour: 15, minute: 30 },
  { label: '04:00 PM', hour: 16, minute: 0 },
  { label: '04:30 PM', hour: 16, minute: 30 },
  { label: '05:00 PM', hour: 17, minute: 0 },
  { label: '05:30 PM', hour: 17, minute: 30 },
  { label: '06:00 PM', hour: 18, minute: 0 },
  { label: '07:00 PM', hour: 19, minute: 0 },
];

export default function FancyInterviewScheduler({
  candidate,
  initialScheduledAt = '',
  initialMeetingUrl = '',
  initialNotes = '',
  onSubmit,
  isSubmitting = false
}) {
  // Parse initial date or default to tomorrow at 14:00
  const parseInitialDate = () => {
    if (initialScheduledAt) {
      const match = String(initialScheduledAt).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
      }
      const parsed = new Date(initialScheduledAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(14, 0, 0, 0);
    return d;
  };

  const [selectedDate, setSelectedDate] = useState(parseInitialDate);
  const [selectedHour, setSelectedHour] = useState(() => selectedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(() => selectedDate.getMinutes());
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState(initialNotes);

  // Video Platform Options
  const candIdClean = (candidate?.id || 'candidate').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const instantJitsiUrl = `https://meet.jit.si/SparkX-Interview-${candIdClean}`;
  const portalInterviewUrl = `${window.location.origin}/interview/${candidate?.id || ''}`;

  const [providerType, setProviderType] = useState(() => {
    if (initialMeetingUrl && initialMeetingUrl.includes('meet.google.com')) return 'google_meet';
    if (initialMeetingUrl && initialMeetingUrl.includes('jit.si')) return 'jitsi';
    return 'google_meet';
  });

  const [customMeetUrl, setCustomMeetUrl] = useState(() => {
    if (initialMeetingUrl && initialMeetingUrl.includes('meet.google.com')) return initialMeetingUrl;
    return '';
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Active meeting URL based on provider
  const activeMeetingUrl = useMemo(() => {
    if (providerType === 'google_meet') {
      return customMeetUrl.trim() || 'https://meet.google.com/new';
    }
    if (providerType === 'jitsi') {
      return instantJitsiUrl;
    }
    return portalInterviewUrl;
  }, [providerType, customMeetUrl, instantJitsiUrl, portalInterviewUrl]);

  // Calendar Math
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month tail
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        isPast: true
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      days.push({
        date,
        isCurrentMonth: true,
        isPast
      });
    }

    // Next month head to fill 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isPast: false
      });
    }

    return days;
  }, [viewMonth, today]);

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handlePrevMonth = () => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (dayObj) => {
    if (dayObj.isPast) return;
    const newDate = new Date(dayObj.date);
    newDate.setHours(selectedHour, selectedMinute, 0, 0);
    setSelectedDate(newDate);
    if (!dayObj.isCurrentMonth) {
      setViewMonth(new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), 1));
    }
  };

  const handleSelectTime = (hour, minute) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    setSelectedDate(newDate);
  };

  // Quick preset buttons
  const applyPreset = (daysFromNow, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    setSelectedDate(d);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // End time calculation
  const endDate = useMemo(() => {
    const end = new Date(selectedDate);
    end.setHours(selectedHour, selectedMinute + durationMinutes, 0, 0);
    return end;
  }, [selectedDate, selectedHour, selectedMinute, durationMinutes]);

  // Human readable labels
  const formattedDateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate]);

  const formattedTimeStr = useMemo(() => {
    const startStr = new Date(selectedDate.setHours(selectedHour, selectedMinute, 0, 0)).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endStr = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${startStr} – ${endStr}`;
  }, [selectedDate, selectedHour, selectedMinute, endDate]);

  // Google Calendar One-Click Event Link
  const googleCalendarTemplateUrl = useMemo(() => {
    const formatCompact = (d) => {
      return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };
    const startComp = formatCompact(selectedDate);
    const endComp = formatCompact(endDate);
    const title = `SparkX AI Interview: ${candidate?.name || 'Candidate'}`;
    const desc = `SparkX AI Interview for ${candidate?.job?.title || 'Position'}.\nCandidate: ${candidate?.name} (${candidate?.email})\nVideo Call: ${activeMeetingUrl}\nNotes: ${notes || 'None'}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startComp}/${endComp}&details=${encodeURIComponent(desc)}&add=${encodeURIComponent(candidate?.email || '')}`;
  }, [selectedDate, endDate, candidate, activeMeetingUrl, notes]);

  const handleCopyLink = () => {
    if (activeMeetingUrl) {
      navigator.clipboard?.writeText(activeMeetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedHour, selectedMinute, 0, 0);

    const yyyy = finalDate.getFullYear();
    const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDate.getDate()).padStart(2, '0');
    const hh = String(finalDate.getHours()).padStart(2, '0');
    const min = String(finalDate.getMinutes()).padStart(2, '0');
    const slotString = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

    onSubmit({
      scheduledAt: slotString,
      meetingUrl: activeMeetingUrl,
      notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Slot Presets Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
        <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Quick Select:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(1, 10, 0)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs transition"
          >
            Tomorrow 10:00 AM
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1, 14, 0)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs transition"
          >
            Tomorrow 2:00 PM
          </button>
          <button
            type="button"
            onClick={() => applyPreset(2, 11, 0)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs transition"
          >
            In 2 Days 11:00 AM
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3, 15, 30)}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs transition"
          >
            In 3 Days 3:30 PM
          </button>
        </div>
      </div>

      {/* Main Two-Column Calendar & Time Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Left Column: Interactive Month Calendar (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any upcoming date to inspect availability
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setViewMonth(new Date())}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map(w => (
              <span key={w} className="text-[11px] font-black text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">
                {w}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((dayObj, idx) => {
              const isSelected = isSameDay(dayObj.date, selectedDate);
              const isToday = isSameDay(dayObj.date, today);

              let cellStyle = "text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600";
              if (!dayObj.isCurrentMonth) {
                cellStyle = "text-slate-300 dark:text-slate-600 opacity-40";
              }
              if (dayObj.isPast) {
                cellStyle = "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 line-through";
              }
              if (isSelected) {
                cellStyle = "bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-indigo-600/30 scale-105";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={dayObj.isPast}
                  onClick={() => handleSelectDay(dayObj)}
                  className={`relative h-10 sm:h-11 rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150 ${cellStyle}`}
                >
                  <span>{dayObj.date.getDate()}</span>
                  {isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timezone & Legend */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)</span>
            </span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Selected</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Today</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Time Slots & Duration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Available Time Slots</span>
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center space-x-1.5 mb-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
              {[30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition ${
                    durationMinutes === mins
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>

            {/* Time Slot Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {TIME_SLOTS.map((slot, idx) => {
                const isSelected = selectedHour === slot.hour && selectedMinute === slot.minute;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTime(slot.hour, slot.minute)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Slot Confirmation Summary Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 text-xs space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
              Confirmed Slot Preview:
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-sm">
              {formattedDateStr}
            </div>
            <div className="text-slate-600 dark:text-slate-300 font-medium flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formattedTimeStr}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold">
                {durationMinutes} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Conference Hub: Google Meet vs Instant Video Room */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Video Conference Provider & Meeting URL
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Choose how you and the candidate will connect
          </span>
        </div>

        {/* 3 Choice Cards for Video Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Choice 1: Real Google Meet */}
          <button
            type="button"
            onClick={() => setProviderType('google_meet')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              providerType === 'google_meet'
                ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Google Meet</span>
              </span>
              {providerType === 'google_meet' && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Real room created via your Google account (<code className="text-blue-600">bkapasi472@rku.ac.in</code>).
            </p>
          </button>

          {/* Choice 2: Instant Video Room (Zero Setup, 100% Reliable) */}
          <button
            type="button"
            onClick={() => setProviderType('jitsi')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              providerType === 'jitsi'
                ? 'bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Instant Video Room</span>
              </span>
              {providerType === 'jitsi' && <Check className="w-3.5 h-3.5 text-purple-600" />}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              No code errors, zero login required. Opens immediately in any web browser.
            </p>
          </button>

          {/* Choice 3: SparkX AI In-Browser Assessment Room */}
          <button
            type="button"
            onClick={() => setProviderType('sparkx')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              providerType === 'sparkx'
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>SparkX AI Lobby</span>
              </span>
              {providerType === 'sparkx' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct link into the candidate assessment lobby & proctored interview room.
            </p>
          </button>
        </div>

        {/* Dynamic Provider Input & Launch Bar */}
        <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          {providerType === 'google_meet' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Meet Room URL:
                </label>
                <div className="flex items-center space-x-2">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center space-x-1 border border-blue-200 dark:border-blue-800/60 transition"
                  >
                    <span>➕ Open meet.google.com/new ↗</span>
                  </a>
                  <a
                    href={googleCalendarTemplateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center space-x-1 border border-indigo-200 dark:border-indigo-800/60 transition"
                  >
                    <span>📅 1-Click Google Calendar Event ↗</span>
                  </a>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={customMeetUrl}
                  onChange={e => setCustomMeetUrl(e.target.value)}
                  placeholder="Paste your generated link (e.g. https://meet.google.com/abc-defg-hij)"
                  className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {copiedLink ? '✓ Copied' : 'Copy'}
                  </button>
                  {customMeetUrl && (
                    <a
                      href={customMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center space-x-1"
                    >
                      <span>Join ↗</span>
                    </a>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Why click "Open meet.google.com/new"?</strong> Google Meet requires meeting spaces to be allocated by Google. Clicking the button creates an active room on your Google account in 1 second, which you then paste here for the candidate.
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active Direct Meeting URL:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  ● Live & Ready
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={activeMeetingUrl}
                  className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs cursor-default"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {copiedLink ? '✓ Copied' : 'Copy'}
                  </button>
                  <a
                    href={activeMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    <span>Launch ↗</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recruiter Notes Input */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
            Recruiter Instructions & Notes for Candidate (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Please join 5 mins early with camera on; have a code editor ready..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Action Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span>Save Official Schedule & Dispatch Confirmation Email (.ics)</span>
      </button>
    </form>
  );
}
