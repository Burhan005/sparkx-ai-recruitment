import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, ShieldCheck, Globe, 
  AlertCircle, CheckCircle2, Loader2, Coffee, Video, 
  CalendarCheck, User, Sparkles, X, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC' }
];

export default function RecruiterAvailabilityManager({ activeJobId = null }) {
  const [availabilities, setAvailabilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('availability'); // 'availability' | 'bookings'
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [availableDate, setAvailableDate] = useState(tomorrowStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('17:00');
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; } catch { return 'UTC'; }
  });
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(15);
  const [blocks, setBlocks] = useState([{ start_time: '13:00', end_time: '14:00', reason: 'Lunch Break' }]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [availRes, bookRes] = await Promise.all([
        api.getRecruiterAvailabilities({ jobId: activeJobId }),
        api.getMyInterviews()
      ]);
      setAvailabilities(availRes || []);
      setBookings(bookRes || []);
    } catch (err) {
      console.error('[RecruiterAvailabilityManager] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeJobId]);

  const handleAddBlock = () => {
    setBlocks(prev => [...prev, { start_time: '12:00', end_time: '12:30', reason: 'Focus Time' }]);
  };

  const handleRemoveBlock = (idx) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBlockChange = (idx, field, val) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const handleCreateAvailability = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      await api.createRecruiterAvailability({
        available_date: availableDate,
        start_time: startTime,
        end_time: endTime,
        timezone: timezone,
        slot_duration_minutes: Number(duration),
        buffer_minutes: Number(buffer),
        job_id: activeJobId,
        blocks: blocks
      });
      setSuccessMessage('Availability window published successfully!');
      setIsAddOpen(false);
      refreshData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create availability window');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this availability window?')) return;
    try {
      await api.deleteRecruiterAvailability(id);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to delete availability');
    }
  };

  const handleCancelBooking = async (id) => {
    const reason = window.prompt('Please enter the reason for cancelling this interview:');
    if (reason === null) return;
    try {
      await api.cancelInterview({ booking_id: id, reason: reason || 'Cancelled by recruiter' });
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to cancel interview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interview Availability & Scheduling</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">
            Recruiter Availability & Bookings
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Define your working interview hours and blocked periods. SparkX derives collision-free slots for candidates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex p-1 rounded-xl bg-stone-100 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'availability'
                  ? 'bg-white dark:bg-[#1A1714] text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Availability ({availabilities.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'bookings'
                  ? 'bg-white dark:bg-[#1A1714] text-stone-900 dark:text-white shadow-subtle'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Bookings ({bookings.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Add Availability</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span>Loading schedules and bookings...</span>
        </div>
      ) : activeTab === 'availability' ? (
        availabilities.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] space-y-3">
            <Clock className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No Availability Defined</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Publish your first working window to allow shortlisted candidates to self-schedule their technical interviews.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition shadow-subtle inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Define Hours</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availabilities.map(avail => (
              <div 
                key={avail.id}
                className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#14110F] text-xs font-bold font-mono text-stone-800 dark:text-stone-200">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{avail.available_date}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(avail.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Deactivate window"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-lg font-bold font-mono text-stone-900 dark:text-white">
                      {avail.start_time} – {avail.end_time}
                    </div>
                    <div className="text-xs text-stone-500 flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-stone-400" />
                      <span>{avail.timezone}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-stone-600 dark:text-stone-300">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#14110F] border border-stone-200 dark:border-stone-800">
                      Duration: <strong>{avail.slot_duration_minutes}m</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#14110F] border border-stone-200 dark:border-stone-800">
                      Buffer: <strong>{avail.buffer_minutes}m</strong>
                    </span>
                  </div>

                  {avail.blocks && avail.blocks.length > 0 && (
                    <div className="pt-2 border-t border-[#E8E4DF] dark:border-[#2A2520] space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                        <Coffee className="w-3 h-3 text-amber-500" />
                        <span>Blocked Periods ({avail.blocks.length})</span>
                      </div>
                      <div className="space-y-1">
                        {avail.blocks.map(b => (
                          <div 
                            key={b.id}
                            className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between"
                          >
                            <span>{b.start_time} – {b.end_time}</span>
                            <span className="text-[10px] opacity-80 truncate max-w-[120px]">{b.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Bookings Tab */
        bookings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] space-y-2">
            <Video className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">No Scheduled Interviews</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Candidate bookings will appear here in real-time once candidates reserve available slots.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => {
              const isScheduled = b.status === 'scheduled';
              const isCancelled = b.status === 'cancelled';
              const isCompleted = b.status === 'completed';

              return (
                <div 
                  key={b.id}
                  className="p-4 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isScheduled ? 'bg-brand-500/10 text-brand-600 border border-brand-500/20' :
                        isCancelled ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                        isCompleted ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {b.status}
                      </span>
                      <span className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                        {b.candidate_name} ({b.candidate_email})
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                      {b.local_date} at {b.local_start_time} – {b.local_end_time} ({b.timezone})
                    </div>
                    <div className="text-xs text-stone-500">
                      Role: {b.job_title} • Slot ID: <span className="font-mono text-[10px]">{b.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    {isScheduled && (
                      <>
                        <a
                          href={b.meeting_url || `/interview/${b.candidate_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-subtle"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Room</span>
                        </a>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 font-semibold text-xs transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Availability Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md" onClick={() => setIsAddOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-depth-elevated p-6 z-10 space-y-5 animate-modal-spring">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF] dark:border-[#2A2520]">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-stone-900 dark:text-white">Publish Interview Availability</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateAvailability} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Availability Date
                </label>
                <input
                  type="date"
                  required
                  value={availableDate}
                  onChange={e => setAvailableDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Slot Duration
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Buffer Between Slots
                  </label>
                  <select
                    value={buffer}
                    onChange={e => setBuffer(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                  >
                    <option value={0}>0 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200"
                >
                  {COMMON_TIMEZONES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Blocked periods */}
              <div className="pt-2 border-t border-[#E8E4DF] dark:border-[#2A2520] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Blocked / Unavailable Intervals (e.g. Lunch)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Block</span>
                  </button>
                </div>

                {blocks.map((blk, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={blk.start_time}
                      onChange={e => handleBlockChange(idx, 'start_time', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]"
                    />
                    <span className="text-xs text-stone-400">to</span>
                    <input
                      type="time"
                      value={blk.end_time}
                      onChange={e => handleBlockChange(idx, 'end_time', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]"
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      value={blk.reason}
                      onChange={e => handleBlockChange(idx, 'reason', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-subtle flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publish Window</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
