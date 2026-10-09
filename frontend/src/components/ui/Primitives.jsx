import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Loader2, 
  X, 
  Check, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  STAGE_CONFIG, 
  ASSESSMENT_STATUS_CONFIG, 
  INTERVIEW_STATUS_CONFIG, 
  HIRING_DECISION_CONFIG,
  normalizeWorkflow
} from '../../utils/workflowContract';
import { formatShortcut } from '../../utils/keyboardShortcut';

export { default as CustomDropdown } from './CustomDropdown';

// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size = 'md',        // 'xs' | 'sm' | 'md' | 'lg'
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:ring-offset-1 transition-all duration-150 active:scale-[0.97]';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-semibold',
    md: 'px-3.5 py-2 text-xs sm:text-sm gap-2 font-semibold',
    lg: 'px-4.5 py-2.5 text-sm gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm border border-brand-600 hover:shadow-md hover:shadow-brand-900/15',
    brand: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm border border-brand-600 hover:shadow-md hover:shadow-brand-900/15',
    secondary: 'bg-stone-50 hover:bg-stone-100 active:bg-stone-200/70 dark:bg-[#1E1B18] dark:hover:bg-[#26221E] text-stone-900 dark:text-stone-100 border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-md hover:shadow-stone-900/5',
    outline: 'bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800',
    ghost: 'bg-transparent hover:bg-stone-100/80 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-transparent',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-subtle border border-rose-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-subtle border border-emerald-600',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
      {!isLoading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}

// ─── IconButton ─────────────────────────────────────────────────────────────
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  disabled = false,
  onClick,
  ...props
}) {
  const sizeMap = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-lg',
    lg: 'w-10 h-10 rounded-lg',
  };
  const iconSizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-colors rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/80 disabled:opacity-40 disabled:cursor-not-allowed ${sizeMap[size] || sizeMap.md} ${className}`}
      {...props}
    >
      <Icon className={iconSizeMap[size] || 'w-4 h-4'} />
    </button>
  );
}

// ─── Input ──────────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  containerClassName = '',
  id,
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-subtle">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-[#151210] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 ${
            Icon ? 'pl-9' : 'pl-3'
          } ${IconRight ? 'pr-9' : 'pr-3'} py-2 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              : 'border-stone-200 dark:border-stone-800 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-600/30'
          } focus:outline-none ${className}`}
          {...props}
        />
        {IconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
            <IconRight className="w-4 h-4" />
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">{helperText}</p>
      ) : null}
    </div>
  );
}

// ─── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 3,
  id,
  ...props
}) {
  const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-lg border text-xs sm:text-sm transition-all duration-150 p-2.5 bg-white dark:bg-[#151210] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
            : 'border-stone-200 dark:border-stone-800 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-600/30'
        } focus:outline-none ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">{helperText}</p>
      ) : null}
    </div>
  );
}

// ─── SearchInput ────────────────────────────────────────────────────────────
export const SearchInput = React.forwardRef(function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  shortcut,
  className = '',
  ...props
}, ref) {
  const displayShortcut = shortcut !== undefined ? shortcut : formatShortcut('K');
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-8 pr-14 py-1.5 bg-stone-50 hover:bg-white dark:bg-[#2B201A] dark:hover:bg-[#352720] border border-stone-200 dark:border-[#423229] rounded-lg text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-brand-600 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-600/30 transition-all shadow-subtle"
        {...props}
      />
      <div className="absolute right-2 flex items-center gap-1.5">
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-3 h-3" />
          </button>
        ) : displayShortcut ? (
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-sans font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded shadow-subtle">
            {displayShortcut}
          </kbd>
        ) : null}
      </div>
    </div>
  );
});

// ─── Badge ──────────────────────────────────────────────────────────────────
export function Badge({
  children,
  variant = 'default', // 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  size = 'sm',        // 'xs' | 'sm' | 'md'
  icon: Icon,
  className = '',
  ...props
}) {
  const variantStyles = {
    default: 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/50',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    info: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.2 text-[11px] gap-1 font-medium',
    sm: 'px-2 py-0.5 text-xs gap-1 font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

// ─── StatusBadge (Comprehensive 4D + Generic) ───────────────────────────────
export function StatusBadge({ status, value, dimension = 'auto', showDot = true, className = '' }) {
  const currentStatus = status || value;
  if (!currentStatus) return null;

  // Check 4D configurations
  let label = currentStatus;
  let colorCls = 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
  let dotColor = 'bg-stone-400';

  const sKey = String(currentStatus).toLowerCase().replace(/[\s-]/g, '_');

  if (dimension === 'stage' || STAGE_CONFIG[sKey]) {
    const cfg = STAGE_CONFIG[sKey];
    if (cfg) {
      label = cfg.label;
      colorCls = cfg.color || cfg.badge || colorCls;
      dotColor = cfg.dotColor || 'bg-brand-500';
    }
  } else if (dimension === 'assessment' || ASSESSMENT_STATUS_CONFIG[sKey]) {
    const cfg = ASSESSMENT_STATUS_CONFIG[sKey];
    if (cfg) {
      label = cfg.label;
      colorCls = cfg.color || cfg.badge || colorCls;
      dotColor = sKey.includes('pass') || sKey.includes('eval') ? 'bg-emerald-500' : 'bg-amber-500';
    }
  } else if (dimension === 'interview' || INTERVIEW_STATUS_CONFIG[sKey]) {
    const cfg = INTERVIEW_STATUS_CONFIG[sKey];
    if (cfg) {
      label = cfg.label;
      colorCls = cfg.color || cfg.badge || colorCls;
      dotColor = sKey.includes('comp') ? 'bg-emerald-500' : sKey.includes('sched') ? 'bg-brand-500' : 'bg-stone-400';
    }
  } else if (dimension === 'decision' || HIRING_DECISION_CONFIG[sKey]) {
    const cfg = HIRING_DECISION_CONFIG[sKey];
    if (cfg) {
      label = cfg.label;
      colorCls = cfg.color || cfg.badge || colorCls;
      dotColor = sKey === 'selected' ? 'bg-emerald-500' : sKey === 'rejected' ? 'bg-rose-500' : 'bg-amber-500';
    }
  } else {
    const legacyMap = {
      shortlisted: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      rejected: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      evaluated: 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800/60',
      screening: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      active: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    };
    colorCls = legacyMap[sKey] || colorCls;
  }

  return (
    <span 
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorCls} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{label}</span>
    </span>
  );
}

export function Card({ children, className = '', hover = false, padding = 'p-5 sm:p-6', ...props }) {
  return (
    <div
      className={`bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-xl shadow-card ${
        hover ? 'interactive-card cursor-pointer' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Panel ──────────────────────────────────────────────────────────────────
export function Panel({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  ...props
}) {
  return (
    <div
      className={`bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-subtle overflow-hidden ${className}`}
      {...props}
    >
      {(title || actions) && (
        <div className="px-5 sm:px-6 py-4 border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <div className="px-5 sm:px-6 py-3.5 bg-stone-50/80 dark:bg-[#13110F] border-t border-[#E8E4DF] dark:border-[#2A2520] text-xs text-stone-500 dark:text-stone-400">
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-lg transition-opacity animate-fade-in-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${maxWidth} bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-depth-elevated overflow-hidden z-10 animate-modal-enter my-8 max-h-[90vh] flex flex-col ${className}`}
      >
        <div className="px-6 py-4.5 border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between shrink-0">
          <div>
            {title && (
              <h2 id="modal-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>
            )}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} size="sm" />
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── Drawer (Slide-Out Panel) ───────────────────────────────────────────────
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-2xl',
  side = 'right',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideAnimation = side === 'right' ? 'animate-drawer-enter' : 'animate-fade-in-up';
  const sidePlacement = side === 'right' ? 'right-0' : 'left-0';

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex">
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 ${sidePlacement} w-full ${width} bg-[#FDFCFA] dark:bg-[#1A1714] border-l border-stone-200 dark:border-stone-800 shadow-popover z-10 flex flex-col ${sideAnimation} ${className}`}
      >
        <div className="px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/80 dark:bg-[#151210]/80 backdrop-blur-sm">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <IconButton icon={X} label="Close drawer" onClick={onClose} size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="p-4 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/80 dark:bg-[#13110F] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────
export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 border-b border-stone-200/80 dark:border-stone-800 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'text-brand-700 dark:text-brand-400'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                isActive
                  ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                {tab.count}
              </span>
            )}
            {/* Active indicator - animated underline */}
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200 ${
                isActive ? 'bg-brand-600 dark:bg-brand-500 opacity-100' : 'opacity-0 scale-x-0'
              }`}
              style={{ transform: isActive ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({
  name = 'User',
  src,
  size = 'md',
  status, // 'online' | 'busy' | 'offline'
  className = '',
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[11px] font-semibold',
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-semibold',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover border border-stone-200 dark:border-stone-700`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700 shadow-subtle`}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-white dark:ring-stone-900 ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-amber-500'
              : 'bg-stone-400'
          }`}
        />
      )}
    </div>
  );
}

// ─── Stat KPI Card ──────────────────────────────────────────────────────────
export function Stat({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  subtitle,
  onClick,
  className = '',
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card select-none ${
        isClickable ? 'interactive-card cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-sans font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-[#E8E4DF] dark:border-stone-700/60 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
        <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              trendDirection === 'up'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                : trendDirection === 'down'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                : 'bg-stone-50 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border-[#E8E4DF] dark:border-stone-700'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-snug">{subtitle}</p>}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Search, title = 'No items found', description = 'Try adjusting your search filters or add a new entry.', actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#13110F] animate-fade-in-up ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200">{title}</h4>
      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1.5 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────
export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-600/90 dark:text-rose-300/80 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export function Progress({
  value = 0,
  max = 100,
  color = 'brand', // 'brand' | 'teal' | 'emerald' | 'amber' | 'rose'
  size = 'md',
  showLabel = false,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorMap = {
    brand: 'bg-brand-600 dark:bg-brand-500',
    teal: 'bg-brand-600 dark:bg-brand-500',
    indigo: 'bg-brand-600 dark:bg-brand-500',
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
  };

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-stone-500 font-medium">
          <span>Progress</span>
          <span className="tabular-nums">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden ${heightMap[size] || heightMap.md}`}>
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${colorMap[color] || colorMap.brand}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800 ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">{title}</h2>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Preserved Existing Animation & Skeleton Components ─────────────────────
export function AnimatedCounter({ value, suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const step = end / (duration / 16);
    const tick = () => {
      start += step;
      if (start >= end) { setDisplay(end); return; }
      setDisplay(Math.floor(start));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-stone-200 dark:border-stone-800 space-y-3 animate-pulse ${className}`}>
      <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-full w-1/3" />
      <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-full w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-stone-200 dark:bg-stone-800 rounded-full" style={{ width: `${85 - i * 15}%` }} />
      ))}
      <div className="flex gap-2 pt-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-5 w-16 bg-stone-200 dark:bg-stone-800 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-stone-200 dark:border-stone-800 animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-full w-1/2" />
            <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-800" />
          </div>
          <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-full w-1/2" />
          <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function FadeInUp({ children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 40);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `transform 0.32s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.32s ease ${delay}ms`,
        transform: visible ? 'none' : 'translateY(12px)',
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

export function SlideIn({ children, from = 'left', delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 40);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const xInit = from === 'left' ? '-16px' : '16px';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `transform 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.4s ease ${delay}ms`,
        transform: visible ? 'none' : `translateX(${xInit})`,
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}
