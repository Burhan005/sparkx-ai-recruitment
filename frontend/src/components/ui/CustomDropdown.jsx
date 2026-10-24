import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomDropdown — Refined Espresso Stone Dropdown Component
 * Accessible, tactile popover menu with warm surfaces and roasted amber accents.
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
      className={`relative block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`}
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
            ? 'bg-[#FDFBF7] dark:bg-[#201814] border-brand-600 dark:border-amber-500 text-stone-900 dark:text-[#EDE8E3] ring-2 ring-brand-500/20'
            : 'bg-[#FDFBF7] dark:bg-[#201814] hover:bg-[#F4EFEB] dark:hover:bg-[#281D17] border-[#E8DFD8] dark:border-[#3D2C22] text-stone-800 dark:text-[#EDE8E3] hover:border-[#D5C7BC] dark:hover:border-[#523B2F]'
        } border disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {PrefixIcon && (
            <PrefixIcon className="w-3.5 h-3.5 text-stone-400 dark:text-amber-400/80 shrink-0" />
          )}
          <span className="truncate flex-1 min-w-0">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#F4EFEB] dark:bg-[#2A1E17] text-stone-600 dark:text-amber-300/80 border border-[#E8DFD8] dark:border-[#3D2C22] font-sans text-[10px] shrink-0 hidden sm:inline">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-600 dark:text-amber-400' : ''
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
          } bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] rounded-xl shadow-depth-elevated p-1 overflow-hidden focus:outline-none animate-modal-enter`}
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
                      ? 'bg-brand-50 dark:bg-[#2C1D14] text-brand-800 dark:text-amber-300 font-semibold border border-brand-200/50 dark:border-[#523725]'
                      : isHighlighted
                        ? 'bg-[#F4EFEB] dark:bg-[#281D17] text-stone-900 dark:text-[#FAF8F5]'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-[#F4EFEB]/60 dark:hover:bg-[#281D17]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {OptIcon && (
                      <OptIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-brand-600 dark:text-amber-400' : 'text-stone-400'}`} />
                    )}
                    <div className="min-w-0 flex-1 truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {opt.badge && (
                      <span className={`px-1.5 py-0.2 rounded font-sans text-[10px] ${
                        isSelected 
                          ? 'bg-brand-200/60 dark:bg-[#3E281A] text-brand-900 dark:text-amber-200' 
                          : 'bg-[#F4EFEB] dark:bg-[#251A14] text-stone-500 dark:text-stone-400'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400 shrink-0 font-bold" />
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
