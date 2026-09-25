import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomDropdown — World-Class Obsidian Dropdown Component
 * Replaces native OS <select> with a sleek, accessible, obsidian-themed popover menu.
 */
export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  icon: PrefixIcon = null,
  className = '',
  menuWidth = 'min-w-[220px]',
  align = 'left',
  title = '',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options to { value, label, badge, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label ?? String(opt.value),
        badge: opt.badge,
        icon: opt.icon,
        description: opt.description
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  ) || normalizedOptions[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % normalizedOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(normalizedOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + normalizedOptions.length) % normalizedOptions.length);
      }
    } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        const chosen = normalizedOptions[highlightedIndex];
        onChange(chosen.value);
        setIsOpen(false);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`}
      onKeyDown={handleKeyDown}
      title={title}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`h-9 w-full min-w-0 px-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2.5 transition-all duration-150 select-none shadow-subtle ${
          isOpen
            ? 'bg-white dark:bg-[#0E121E] border-brand-500 text-slate-900 dark:text-white ring-2 ring-brand-500/20'
            : 'bg-white dark:bg-[#0E121E] hover:bg-slate-50 dark:hover:bg-[#131826] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
        } border disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {PrefixIcon && (
            <PrefixIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
          )}
          <span className="truncate flex-1 min-w-0">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] shrink-0 hidden sm:inline">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`} 
        />
      </button>

      {/* Flyout Menu */}
      {isOpen && (
        <div 
          ref={menuRef}
          role="listbox"
          className={`absolute top-full mt-1.5 z-50 ${menuWidth} ${
            align === 'right' ? 'right-0' : 'left-0'
          } bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1 overflow-hidden focus:outline-none animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
            {normalizedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;
              const OptIcon = opt.icon;

              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors duration-100 ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                      : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {OptIcon && (
                      <OptIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    )}
                    <div className="min-w-0 flex-1 truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {opt.badge && (
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                        isSelected 
                          ? 'bg-brand-200/50 dark:bg-brand-900/60 text-brand-800 dark:text-brand-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 font-bold" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
