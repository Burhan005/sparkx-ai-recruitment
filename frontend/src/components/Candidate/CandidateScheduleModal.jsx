import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Calendar, Clock, Globe, Sparkles, CheckCircle2, 
  AlertCircle, Loader2, ArrowRight, Video, CalendarCheck 
} from 'lucide-react';
import api from '../../services/api';

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export default function CandidateScheduleModal({
  isOpen,
  onClose,
  application,
  isReschedule = false,
  existingBooking = null,
  onSuccess
}) {
  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [timezone, setTimezone] = useState(detectedTz);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  // Fetch slots whenever modal opens or timezone changes
  useEffect(() => {
    if (!isOpen || !application) return;

    let isMounted = true;
    async function loadSlots() {
      setLoadingSlots(true);
      setErrorMessage('');
      try {
        const fetched = await api.getInterviewSlots({
          candidateId: application.id,
          jobId: application.jobId || application.job_id,
          timezone: timezone
        });
        if (isMounted) {
          setSlots(fetched || []);
          // Auto-select first date with available slots
          if (fetched && fetched.length > 0) {
            const firstDate = fetched[0].local_date;
            setSelectedDate(firstDate);
          }
        }
      } catch (err) {
        if (isMounted) setErrorMessage(err.message || 'Failed to fetch interview availability');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => { isMounted = false; };
  }, [isOpen, application, timezone]);

  // Group slots by local_date
  const groupedSlots = useMemo(() => {
    const map = {};
    for (const s of slots) {
      if (!map[s.local_date]) map[s.local_date] = [];
      map[s.local_date].push(s);
    }
    return map;
  }, [slots]);

  const uniqueDates = useMemo(() => Object.keys(groupedSlots).sort(), [groupedSlots]);
  const activeDateSlots = useMemo(() => (selectedDate ? groupedSlots[selectedDate] || [] : []), [groupedSlots, selectedDate]);

  if (!isOpen || !application) return null;

  const handleBook = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      let result;
      if (isReschedule && (existingBooking?.id || application.id)) {
        result = await api.rescheduleInterview({
          booking_id: existingBooking?.id,
          candidate_id: application.id,
          new_start_time_utc: selectedSlot.start_time_utc,
          new_end_time_utc: selectedSlot.end_time_utc,
          timezone: timezone,
          reason: notes
        });
      } else {
        result = await api.bookInterviewSlot({
          candidate_id: application.id,
          job_id: application.jobId || application.job_id,
          start_time_utc: selectedSlot.start_time_utc,
          end_time_utc: selectedSlot.end_time_utc,
          timezone: timezone,
          availability_id: selectedSlot.availability_id,
          notes: notes
        });
      }

      setSuccessBooking(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('[CandidateScheduleModal] Booking error:', err);
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('Conflict')) {
        setErrorMessage('This slot was just booked by another candidate. Please choose another slot.');
        // Refresh available slots
        setSelectedSlot(null);
        api.getInterviewSlots({
          candidateId: application.id,
          jobId: application.jobId || application.job_id,
          timezone: timezone
        }).then(fresh => setSlots(fresh || []));
      } else {
        setErrorMessage(err.message || 'Failed to schedule interview. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in">
      <div 
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity"
        onClick={() => { if (!isSubmitting) onClose(); }}
      />
      <div 
        className="relative w-full max-w-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-depth-elevated overflow-hidden my-auto flex flex-col max-h-[92vh] text-stone-900 dark:text-stone-100 z-10 animate-modal-spring"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-50/90 dark:bg-[#14110F] border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {isReschedule ? 'Reschedule AI Interview' : 'Self-Schedule AI Interview'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {application.jobTitle} • {application.companyName || 'SparkX Technologies'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {successBooking ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                  Interview Confirmed!
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                  Your session is confirmed for <strong className="text-stone-900 dark:text-white">{successBooking.local_date} at {successBooking.local_start_time} ({successBooking.timezone})</strong>.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition shadow-subtle"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Timezone picker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                <div className="flex items-center space-x-2 text-xs text-stone-600 dark:text-stone-300">
                  <Globe className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="font-medium">Displaying times in:</span>
                </div>
                <select
                  value={timezone}
                  onChange={e => {
                    setTimezone(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {!COMMON_TIMEZONES.some(tz => tz.value === detectedTz) && (
                    <option value={detectedTz}>{detectedTz} (Local Device)</option>
                  )}
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Chips */}
              {loadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-stone-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  <span>Calculating live recruiter availability...</span>
                </div>
              ) : uniqueDates.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] space-y-2">
                  <Clock className="w-8 h-8 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">No Slots Currently Available</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    The recruiting team has not published open availability for this role yet. Please check back soon or contact the hiring manager.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                      1. Select Interview Date
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueDates.map(dateKey => {
                        const isSel = selectedDate === dateKey;
                        const count = groupedSlots[dateKey]?.length || 0;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateKey);
                              setSelectedSlot(null);
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex flex-col items-start ${
                              isSel 
                                ? 'bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                                : 'bg-white dark:bg-[#1A1714] border-[#E8E4DF] dark:border-[#2A2520] text-stone-600 dark:text-stone-300 hover:border-stone-400'
                            }`}
                          >
                            <span className="font-semibold">{dateKey}</span>
                            <span className="text-[10px] text-stone-400">{count} {count === 1 ? 'slot' : 'slots'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots Grid */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                      2. Choose Time Slot ({timezone})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activeDateSlots.map(slot => {
                        const isChosen = selectedSlot?.slot_id === slot.slot_id;
                        return (
                          <button
                            key={slot.slot_id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                              isChosen
                                ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                                : 'bg-white dark:bg-[#1A1714] border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 hover:border-brand-500'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold font-mono">
                                {slot.local_start_time} – {slot.local_end_time}
                              </div>
                              <div className={`text-[10px] mt-0.5 ${isChosen ? 'text-brand-100' : 'text-stone-400'}`}>
                                {slot.duration_minutes} mins
                              </div>
                            </div>
                            {isChosen && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Slot Summary & Notes */}
                  {selectedSlot && (
                    <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] space-y-3 animate-fade-in">
                      <div className="flex items-center space-x-2 text-xs text-stone-800 dark:text-stone-200">
                        <Video className="w-4 h-4 text-brand-500" />
                        <span>
                          Confirmed Slot: <strong>{selectedSlot.local_date} at {selectedSlot.local_start_time} – {selectedSlot.local_end_time}</strong> ({timezone})
                        </span>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Optional notes or questions for the interviewer..."
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!successBooking && (
          <div className="p-4 sm:p-6 bg-stone-50/90 dark:bg-[#14110F] border-t border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleBook}
              disabled={!selectedSlot || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-subtle"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <span>{isReschedule ? 'Confirm Reschedule' : 'Confirm & Reserve Slot'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
