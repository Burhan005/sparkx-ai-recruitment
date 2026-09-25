import React, { useState, useMemo, useEffect } from 'react';
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
  Zap,
  Sliders,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  Link2,
  Unlink,
  Code2,
  Bot,
  Building,
  FileText
} from 'lucide-react';
import api from '../../services/api';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  // Flexibility Controls
  const [slotInterval, setSlotInterval] = useState(30); // 15, 30, 45, 60 mins
  const [daypartFilter, setDaypartFilter] = useState('all'); // 'all', 'morning', 'afternoon', 'evening'
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState(false);

  // Interaction / Stage Round Format Type
  const [roundType, setRoundType] = useState(() => {
    if (initialMeetingUrl && (initialMeetingUrl.includes('/assessment') || initialMeetingUrl.includes('assessment'))) return 'technical_assessment';
    if (initialMeetingUrl && (initialMeetingUrl.includes('/interview') || initialMeetingUrl.includes('interview'))) return 'ai_interview';
    if (initialMeetingUrl && (initialMeetingUrl.includes('Onsite') || initialMeetingUrl.includes('onsite'))) return 'onsite';
    return 'technical_assessment'; // Default to technical assessment / MCQ first!
  });
  const [onsiteLocation, setOnsiteLocation] = useState('SparkX Engineering Campus, Innovation Block, Floor 3');

  const ROUND_OPTIONS = useMemo(() => [
    {
      id: 'technical_assessment',
      title: 'Round 1: Online Technical Assessment (MCQ & Coding Sandbox)',
      shortTitle: 'MCQ & Technical Test',
      badge: 'Pre-Interview Test',
      icon: Code2,
      desc: 'Send candidate an online timed MCQ + hands-on code challenge before scheduling live video calls.',
      defaultNote: `Technical Assessment & MCQ Invitation for ${candidate?.jobTitle || 'Applied Role'}. Candidate has 48 hours to complete all modules.`,
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/assessment`
    },
    {
      id: 'ai_interview',
      title: 'Round 2: Autonomous AI Technical Screen',
      shortTitle: 'AI Voice Interview',
      badge: 'SparkX AI Room',
      icon: Bot,
      desc: 'Candidate enters SparkX AI Interview Room for automated conversational screening on core competencies.',
      defaultNote: `AI Voice Technical Screening round. Please enter the SparkX AI room with working microphone and webcam.`,
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/interview`
    },
    {
      id: 'face_to_face',
      title: 'Round 3: Live Face-to-Face Video Interview',
      shortTitle: 'Live Video Call',
      badge: 'Google Meet / Video',
      icon: Video,
      desc: 'Interactive 1-on-1 or panel video discussion with engineering leaders & hiring team.',
      defaultNote: `Technical panel interview via Google Meet. Please join with camera enabled.`,
      url: ''
    },
    {
      id: 'onsite',
      title: 'Round 4: Onsite / In-Person Final Interview',
      shortTitle: 'Onsite Campus',
      badge: 'Office Campus',
      icon: Building,
      desc: 'Face-to-face final interview round at company engineering headquarters.',
      defaultNote: `Onsite in-person interview. Please report to reception 10 minutes prior to scheduled slot.`,
      url: 'Onsite Corporate Office'
    }
  ], [candidate]);

  // Candidate ID sanitized
  const candIdClean = (candidate?.id || 'candidate').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

  // 100% Guaranteed Automatic Instant Meeting Room (Zero login, zero errors, HD video)
  const autoInstantRoomUrl = `https://meet.jit.si/SparkX-Interview-${candIdClean}`;

  // Recruiter saved default Google Meet URL from localStorage
  const savedGoogleMeetUrl = typeof window !== 'undefined' ? (localStorage.getItem('sparkx_saved_google_meet_url') || '') : '';
  const [googleMeetUrl, setGoogleMeetUrl] = useState(() => {
    if (initialMeetingUrl && initialMeetingUrl.includes('meet.google.com')) return initialMeetingUrl;
    return savedGoogleMeetUrl;
  });
  const [saveAsDefaultMeet, setSaveAsDefaultMeet] = useState(false);

  // Google OAuth Connection State
  const [googleStatus, setGoogleStatus] = useState({ configured: false, connected: false, email: '' });
  const [loadingGoogleStatus, setLoadingGoogleStatus] = useState(true);

  const fetchGoogleStatus = async () => {
    try {
      const status = await api.getGoogleMeetStatus();
      if (status) setGoogleStatus(status);
    } catch (e) {
      console.warn('Could not fetch Google status', e);
    } finally {
      setLoadingGoogleStatus(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();

    // Listen to OAuth popup completion
    const handleMsg = (event) => {
      if (event.data?.type === 'GOOGLE_MEET_CONNECTED') {
        fetchGoogleStatus();
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const handleConnectGoogle = () => {
    const width = 520;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      api.getGoogleConnectUrl(),
      'GoogleAuthPopup',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Disconnect your Google account from SparkX?')) {
      await api.disconnectGoogleMeet();
      fetchGoogleStatus();
    }
  };

  // Selected Provider Mode: 'google_meet' (default for formal scheduled interviews) | 'auto_instant' (quick instant room)
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (initialMeetingUrl && (initialMeetingUrl.includes('meet.jit.si') || initialMeetingUrl.includes('jitsi'))) return 'auto_instant';
    return 'google_meet';
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Active meeting URL computed automatically
  const activeMeetingUrl = useMemo(() => {
    if (selectedProvider === 'google_meet') {
      if (googleMeetUrl.trim()) return googleMeetUrl.trim();
      if (googleStatus.connected) return `https://meet.google.com (Auto-generated via Calendar API)`;
      return `https://meet.google.com (Requires Google Connect or Personal Link)`;
    }
    if (selectedProvider === 'portal_lobby') {
      return `${window.location.origin}/interview/${candidate?.id || ''}`;
    }
    return autoInstantRoomUrl;
  }, [selectedProvider, googleMeetUrl, googleStatus.connected, autoInstantRoomUrl, candidate?.id]);

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

    // Next month head
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

  // Dynamic Flexible Time Slots Generator based on slotInterval and daypartFilter
  const dynamicTimeSlots = useMemo(() => {
    const slots = [];
    // Start at 8:00 AM (480 mins) to 8:30 PM (1230 mins)
    for (let m = 8 * 60; m <= 20 * 60; m += slotInterval) {
      const hour24 = Math.floor(m / 60);
      const minute = m % 60;

      // Filter by daypart
      if (daypartFilter === 'morning' && hour24 >= 12) continue;
      if (daypartFilter === 'afternoon' && (hour24 < 12 || hour24 >= 17)) continue;
      if (daypartFilter === 'evening' && hour24 < 17) continue;

      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const ampm = hour24 < 12 ? 'AM' : 'PM';
      const label = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;

      slots.push({
        label,
        hour: hour24,
        minute
      });
    }
    return slots;
  }, [slotInterval, daypartFilter]);

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
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

  // Quick Preset Handlers
  const applyPreset = (daysFromNow, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    setSelectedDate(d);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // End Date calculation
  const endDate = useMemo(() => {
    const end = new Date(selectedDate);
    end.setHours(selectedHour, selectedMinute + durationMinutes, 0, 0);
    return end;
  }, [selectedDate, selectedHour, selectedMinute, durationMinutes]);

  // Human readable strings
  const formattedDateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate]);

  const formattedTimeStr = useMemo(() => {
    const s = new Date(selectedDate);
    s.setHours(selectedHour, selectedMinute, 0, 0);
    const startStr = s.toLocaleTimeString('en-US', {
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

  const handleCopyLink = () => {
    if (activeMeetingUrl) {
      navigator.clipboard?.writeText(activeMeetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Persist default Google Meet URL if checked
    if (saveAsDefaultMeet && googleMeetUrl.trim()) {
      localStorage.setItem('sparkx_saved_google_meet_url', googleMeetUrl.trim());
    }

    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedHour, selectedMinute, 0, 0);

    const yyyy = finalDate.getFullYear();
    const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDate.getDate()).padStart(2, '0');
    const hh = String(finalDate.getHours()).padStart(2, '0');
    const min = String(finalDate.getMinutes()).padStart(2, '0');
    const slotString = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

    let meetingUrlToSend = '';
    if (roundType === 'technical_assessment') {
      meetingUrlToSend = `${window.location.origin}/assessment`;
    } else if (roundType === 'ai_interview') {
      meetingUrlToSend = `${window.location.origin}/interview`;
    } else if (roundType === 'onsite') {
      meetingUrlToSend = onsiteLocation.trim() || 'Onsite Corporate Headquarters';
    } else {
      meetingUrlToSend = selectedProvider === 'google_meet'
        ? (googleMeetUrl.trim() || '')
        : autoInstantRoomUrl;
    }

    const selectedOpt = ROUND_OPTIONS.find(r => r.id === roundType);
    const prefix = selectedOpt ? `[${selectedOpt.shortTitle}] ` : '';
    const finalNotes = notes?.trim() 
      ? (notes.startsWith('[') ? notes : `${prefix}${notes}`)
      : (selectedOpt?.defaultNote || '');

    onSubmit({
      scheduledAt: slotString,
      meetingUrl: meetingUrlToSend,
      notes: finalNotes
    });
  };

  // Convert 24h to 12h & ampm for custom fine-tune inputs
  const currentHour12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
  const currentAmPm = selectedHour < 12 ? 'AM' : 'PM';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* ── RESCHEDULE NOTICE (When candidate already has a slot) ── */}
      {initialScheduledAt && (
        <div className="p-3.5 px-4 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-cyan-900 dark:text-cyan-200">Rescheduling Existing Interview</span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Currently booked: <strong className="text-slate-800 dark:text-slate-200 font-mono">{initialScheduledAt}</strong>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700 shrink-0">
            Reschedule Mode
          </span>
        </div>
      )}

      {/* ── STEP 1: INTERACTION / STAGE FORMAT SELECTOR ── */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse-subtle" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Step 1: Select Hiring Stage & Interaction Format
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Choose online assessment, AI voice screen, or face-to-face round
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ROUND_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = roundType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRoundType(opt.id);
                  setNotes(opt.defaultNote);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 ring-2 ring-brand-500/20 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold leading-snug">{opt.shortTitle}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {opt.desc}
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded self-start font-semibold ${
                  isSelected ? 'bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                }`}>
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TOP HEADER: QUICK PRESETS & INTERVAL TOGGLES ── */}
      <div className="p-4 bg-brand-50/60 dark:bg-[#0E121E] rounded-2xl border border-brand-200/70 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>1-Click Slot Presets:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(1, 10, 0)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/70 dark:border-indigo-800 shadow-xs transition"
            >
              Tomorrow 10:00 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1, 14, 0)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/70 dark:border-indigo-800 shadow-xs transition"
            >
              Tomorrow 2:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2, 11, 0)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/70 dark:border-indigo-800 shadow-xs transition"
            >
              In 2 Days 11:00 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3, 15, 30)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-indigo-200/70 dark:border-indigo-800 shadow-xs transition"
            >
              In 3 Days 3:30 PM
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CALENDAR + TIME SLOTS MATRIX ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* LEFT COLUMN: INTERACTIVE MONTH CALENDAR (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select your preferred interview date below
              </p>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(now);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map(w => (
              <span key={w} className="text-xs font-bold text-slate-500 dark:text-slate-400 py-1 uppercase tracking-wider">
                {w}
              </span>
            ))}
          </div>

          {/* Day Cells Matrix */}
          <div className="grid grid-cols-7 gap-2">
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
                cellStyle = "bg-brand-600 text-white font-bold shadow-subtle ring-2 ring-brand-500/40";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={dayObj.isPast}
                  onClick={() => handleSelectDay(dayObj)}
                  className={`relative h-11 sm:h-12 rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-150 ${cellStyle}`}
                >
                  <span>{dayObj.date.getDate()}</span>
                  {isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timezone & Info Bar */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 gap-2">
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Timezone: <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong> (Automatic Detection)</span>
            </span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>Selected</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                <span>Today</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FLEXIBILITY TIME SLOTS & CUSTOM CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 pl-0 lg:pl-5 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0">
          <div className="space-y-3.5">
            
            {/* Header: Title & Time Preview */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Flexible Time Slots</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCustomTimeOpen(!isCustomTimeOpen)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-bold flex items-center space-x-1 transition"
              >
                <Sliders className="w-3 h-3" />
                <span>{isCustomTimeOpen ? 'Close Custom' : 'Custom Time ⚙️'}</span>
              </button>
            </div>

            {/* Custom Minute Stepper (When opened, allows ANY exact time e.g. 2:15 PM) */}
            {isCustomTimeOpen ? (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-in fade-in">
                <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Exact Time Picker:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{currentHour12}:{selectedMinute.toString().padStart(2, '0')} {currentAmPm}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Hour Selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Hour</label>
                    <select
                      value={currentHour12}
                      onChange={(e) => {
                        const h12 = Number(e.target.value);
                        const h24 = currentAmPm === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                        handleSelectTime(h24, selectedMinute);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Minute Selector (5-min precision) */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Minute</label>
                    <select
                      value={selectedMinute}
                      onChange={(e) => handleSelectTime(selectedHour, Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>

                  {/* AM / PM Toggle */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Period</label>
                    <div className="flex rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = currentHour12 === 12 ? 0 : currentHour12;
                          handleSelectTime(h24, selectedMinute);
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] ${currentAmPm === 'AM' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = currentHour12 === 12 ? 12 : currentHour12 + 12;
                          handleSelectTime(h24, selectedMinute);
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] ${currentAmPm === 'PM' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Flexibility Filter 1: Daypart Tabs (Morning / Afternoon / Evening) */}
                <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {[
                    { id: 'all', label: 'All Day' },
                    { id: 'morning', label: 'Morning' },
                    { id: 'afternoon', label: 'Afternoon' },
                    { id: 'evening', label: 'Evening' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDaypartFilter(tab.id)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                        daypartFilter === tab.id
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Flexibility Filter 2: Interval Chips (15m, 30m, 45m, 60m) */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="font-semibold">Slot Spacing:</span>
                  <div className="flex items-center space-x-1">
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSlotInterval(mins)}
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition ${
                          slotInterval === mins
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Slot Buttons Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {dynamicTimeSlots.map((slot, idx) => {
                    const isSelected = selectedHour === slot.hour && selectedMinute === slot.minute;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTime(slot.hour, slot.minute)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white font-bold shadow-subtle scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50/50'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Duration Selector */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Interview Duration:
                </span>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {durationMinutes} Minutes
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[30, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmed Slot Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-subtle">
            <span className="text-2xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 block font-mono">
              Confirmed Slot Preview:
            </span>
            <div className="text-slate-900 dark:text-white font-black text-sm">
              {formattedDateStr}
            </div>
            <div className="text-slate-600 dark:text-slate-300 font-semibold flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formattedTimeStr}</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px]">
                {durationMinutes} mins
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DELIVERY & CREDENTIALS HUB (BRANCHED PER ROUND TYPE) ── */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        {/* ROUND 1: ONLINE TECHNICAL ASSESSMENT */}
        {roundType === 'technical_assessment' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Code2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Technical Assessment Hub (MCQ & Code Sandbox)</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Candidate receives an automated test invitation link to complete technical screening & coding exercises
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[11px] flex items-center space-x-1 border border-brand-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Automated Grading Ready</span>
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-brand-200 dark:border-brand-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <span>Candidate Assessment Portal:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    Ready to Dispatch
                  </span>
                </span>

                <a
                  href="/assessment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                  title="Preview assessment portal"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Preview Assessment ↗</span>
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/assessment`}
                  className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs cursor-default"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/assessment`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="absolute right-2 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-semibold">
                  📋 Includes: MCQ Domain Assessment + Live Code Sandbox (Python, JavaScript, Go, SQL).
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Candidate submits solutions through the portal. Once submitted, scorecards and benchmark percentiles sync directly into your pipeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROUND 2: AUTONOMOUS AI TECHNICAL VOICE SCREEN */}
        {roundType === 'ai_interview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Autonomous AI Technical Voice Screen Hub</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Candidate enters SparkX AI room for conversational vocal & technical screening
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center space-x-1 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Agent Ready</span>
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <span>AI Interview Room Link:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    Active
                  </span>
                </span>

                <a
                  href={`/interview?candidateId=${candidate?.id || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                  title="Test AI Interview Room"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Enter Room Now ↗</span>
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/interview?candidateId=${candidate?.id || ''}`}
                  className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs cursor-default"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/interview?candidateId=${candidate?.id || ''}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="absolute right-2 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROUND 3: LIVE FACE-TO-FACE VIDEO INTERVIEW (GOOGLE MEET / JITSI) */}
        {roundType === 'face_to_face' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Video Interview Provider & Meeting Credentials</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Synced with Live Gmail SMTP & Calendar Invites (.ics) — zero hardcoded fake links
                </span>
              </div>

              {selectedProvider === 'google_meet' ? (
                googleStatus.connected ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center space-x-1 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Google Calendar Synced: {googleStatus.email || 'Active'}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center space-x-1 border border-amber-500/20">
                    <span>Google OAuth Ready (1-Click Connect)</span>
                  </span>
                )
              ) : (
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center space-x-1 border border-indigo-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Video Active</span>
                </span>
              )}
            </div>

            {/* 2 Clear Provider Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tab 1: Google Meet */}
              <button
                type="button"
                onClick={() => setSelectedProvider('google_meet')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedProvider === 'google_meet'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Video className="w-4 h-4" />
                    <span>Google Meet (Official / Calendar API)</span>
                  </span>
                  {selectedProvider === 'google_meet' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Creates a <strong>real Google Meet link</strong> via Google Calendar API. Dispatches calendar invite (.ics) to candidate and recruiter.
                </p>
              </button>

              {/* Tab 2: SparkX Instant Video Room (Jitsi Quick Join) */}
              <button
                type="button"
                onClick={() => setSelectedProvider('auto_instant')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedProvider === 'auto_instant'
                    ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-500 text-slate-900 dark:text-white ring-2 ring-brand-500/20 shadow-subtle'
                    : 'bg-white dark:bg-[#0E121E] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-xs flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>SparkX Instant Video (Jitsi — 1-Click Quick)</span>
                  </span>
                  {selectedProvider === 'auto_instant' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Quick Room:</strong> Zero setup, zero login required. Works in any browser with full HD video, mic, and screen sharing.
                </p>
              </button>
            </div>

            {/* Dynamic Context Card based on selected provider */}
            {selectedProvider === 'google_meet' ? (
              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <span>Google Integration Status:</span>
                    {googleStatus.connected ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Connected ({googleStatus.email})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold">
                        One-time Connect Recommended
                      </span>
                    )}
                  </span>

                  {googleStatus.connected ? (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 text-[11px] font-semibold text-slate-600 dark:text-slate-400 transition flex items-center space-x-1"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Connect Google Account (1-Click)</span>
                    </button>
                  )}
                </div>

                {googleStatus.connected ? (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-semibold">
                      ✨ Auto-Provisioning Active: When you click <strong>Confirm Schedule</strong>, SparkX will automatically create an authentic Google Meet conference under your connected Google account and send the real link to <strong>{candidate?.name || 'the candidate'}</strong> and <strong>{googleStatus.email}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Optional: Or enter your permanent personal Google Meet link below if you prefer using a recurring room:
                    </p>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={googleMeetUrl}
                        onChange={e => setGoogleMeetUrl(e.target.value)}
                        placeholder="e.g. https://meet.google.com/xyz-abcd-efg (leave blank to auto-create on schedule)"
                        className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="absolute right-2 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="saveDefaultMeet"
                        checked={saveAsDefaultMeet}
                        onChange={e => setSaveAsDefaultMeet(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="saveDefaultMeet" className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Save as my permanent Google Meet room (auto-fills for future candidates)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Jitsi Instant Room Card */
              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <span>Instant Room Link:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      100% Active Now
                    </span>
                  </span>

                  <a
                    href={activeMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                    title="Click to enter and test this room right now"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Test / Enter Room Now ↗</span>
                  </a>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={activeMeetingUrl}
                    className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs cursor-default"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="absolute right-2 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROUND 4: ONSITE / IN-PERSON FINAL INTERVIEW */}
        {roundType === 'onsite' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Onsite Campus / Office Location Details</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Specify office address and room instructions dispatched with the candidate invitation
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                Physical Office Address & Interview Room:
              </label>
              <input
                type="text"
                value={onsiteLocation}
                onChange={e => setOnsiteLocation(e.target.value)}
                placeholder="e.g. SparkX HQ, Building 4, Floor 3, Meeting Room 302 - 500 Tech Boulevard"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Recruiter Instructions Notes */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
            Recruiter Instructions & Notes for Candidate (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={
              roundType === 'technical_assessment'
                ? "e.g. You will have 48 hours to complete the MCQ & Sandbox tests. Ensure stable internet..."
                : roundType === 'ai_interview'
                ? "e.g. Please join in a quiet room with working headset and microphone enabled..."
                : roundType === 'onsite'
                ? "e.g. Please bring government photo ID for security gate check-in at Tower B..."
                : "e.g. Please join 5 mins early with camera enabled; have portfolio or code samples ready..."
            }
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── SUBMIT & DISPATCH BUTTON ── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs sm:text-sm font-bold tracking-wide transition flex items-center justify-center space-x-2.5 shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span>
          {roundType === 'technical_assessment'
            ? 'Dispatch Technical Assessment & MCQ Invitation Email'
            : roundType === 'ai_interview'
            ? 'Schedule AI Technical Voice Screen & Send Invite'
            : roundType === 'onsite'
            ? 'Confirm Onsite Interview & Dispatch Campus Invitation'
            : (initialScheduledAt ? 'Confirm Rescheduled Slot & Dispatch Calendar Invite (.ics + Link)' : 'Confirm Schedule & Dispatch Calendar Invite (.ics + Link)')}
        </span>
      </button>
    </form>
  );
}
