import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Sparkles } from 'lucide-react';

/**
 * FancyStudioDropdown — Luxury Glassmorphic Studio Dropdown Component
 * Designed specifically for ARETE luxury aesthetic:
 * - Fluid sizing with zero awkward truncation
 * - Top gold/amber hairline gradient
 * - Rich option cards with custom icons, color swatches, font samples, and badges
 * - Built-in search filtering for long lists (e.g. 800+ job requisitions)
 * - Tactile keyboard navigation and smooth fade-in animations
 */
export default function FancyStudioDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: PrefixIcon = null,
  className = '',
  menuWidth = 'w-72',
  align = 'left',
  title = '',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search options...',
  showBadgeInTrigger = false,
  dropUp = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to rich structure
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? opt.id,
          label: opt.label ?? opt.name ?? String(opt.value),
          badge: opt.badge,
          icon: opt.icon,
          description: opt.description ?? opt.desc,
          colorHex: opt.colorHex ?? opt.hex,
          sample: opt.sample,
          fontFamily: opt.fontFamily,
          disabled: opt.disabled ?? false,
        };
      }
      return { value: opt, label: String(opt) };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    const valStr = String(value || '');
    const found = normalizedOptions.find(
      (opt) => String(opt.value).toLowerCase() === valStr.toLowerCase()
    );
    if (found) return found;
    if (valStr.startsWith('#')) {
      return {
        value: valStr,
        label: `Custom (${valStr.toUpperCase()})`,
        badge: 'Custom',
        colorHex: valStr,
        description: 'Bespoke custom color value'
      };
    }
    return normalizedOptions[0] || null;
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Auto-focus search input if searchable
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if ((e.key === 'Enter') && isOpen) {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const chosen = filteredOptions[highlightedIndex];
        onChange(chosen.value);
        setIsOpen(false);
        setSearchQuery('');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative block w-full min-w-0 text-left ${isOpen ? 'z-50' : 'z-0'} ${className}`}
      onKeyDown={handleKeyDown}
      title={title}
    >
      {/* Trigger Button: Luxury Glass Pill */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`h-9 w-full min-w-0 max-w-full px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all duration-200 select-none shadow-xs border cursor-pointer overflow-hidden ${
          isOpen
            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-stone-900 dark:text-stone-100 ring-2 ring-amber-500/25'
            : 'bg-[#FDFBF7] dark:bg-[#1E1510] hover:bg-[#F7F2EC] dark:hover:bg-[#281D17] border-[#E8DFD8] dark:border-[#3D2C22] text-stone-800 dark:text-[#EDE8E3] hover:border-amber-500/40 dark:hover:border-amber-500/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {/* Prefix Icon */}
          {PrefixIcon && (
            <PrefixIcon className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400 shrink-0" />
          )}

          {/* Color Swatch Preview if applicable */}
          {selectedOption?.colorHex && (
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/20 shadow-xs"
              style={{ backgroundColor: selectedOption.colorHex }}
            />
          )}

          {/* Main Label: Generous truncation only when required */}
          <span className="truncate flex-1 min-w-0 text-left font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* Badge (only when explicitly requested on trigger) */}
          {showBadgeInTrigger && selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-[#C27803] dark:text-amber-300 border border-amber-500/20 font-mono text-[9px] shrink-0 font-bold hidden sm:inline">
              {selectedOption.badge}
            </span>
          )}
        </div>

        {/* Chevron with smooth rotation */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#C27803] dark:text-amber-400' : ''
          }`}
        />
      </button>

      {/* Flyout Popover Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className={`absolute ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[9999] ${menuWidth} ${
            align === 'right' ? 'right-0' : 'left-0'
          } bg-white dark:bg-[#1A120E] border-2 border-stone-200 dark:border-[#382820] rounded-2xl shadow-2xl p-2.5 overflow-hidden focus:outline-none animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10 dark:ring-white/10`}
        >
          {/* Top Amber Gold Hairline Gradient */}
          <div className="h-[2px] bg-gradient-to-r from-amber-500/20 via-[#C27803] to-amber-500/20 rounded-full mb-2" />

          {/* Optional Search Filter Bar for Long Lists */}
          {(searchable || normalizedOptions.length > 8) && (
            <div className="relative mb-2 px-0.5">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-[#241A14] border border-stone-200 dark:border-[#3D2C22] text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          )}

          {/* Options Scrollable Container */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-500 italic">
                No matching options found.
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
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
                      setSearchQuery('');
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-start justify-between p-2.5 rounded-xl text-xs text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/40 text-stone-900 dark:text-white shadow-2xs font-semibold'
                        : isHighlighted
                        ? 'bg-stone-100 dark:bg-[#281D17] text-stone-900 dark:text-white'
                        : 'text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#241A14]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                      {/* Option Icon / Swatch */}
                      {OptIcon && (
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#C27803] text-white shadow-xs' : 'bg-stone-100 dark:bg-[#2A1E17] text-stone-600 dark:text-stone-400'
                        }`}>
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {opt.colorHex && (
                        <span
                          className={`w-4.5 h-4.5 rounded-full shrink-0 mt-0.5 border-2 shadow-xs ${
                            isSelected ? 'border-[#C27803] ring-2 ring-amber-500/30' : 'border-stone-200 dark:border-[#3D2C22]'
                          }`}
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      )}

                      {opt.sample && (
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 text-[#C27803] dark:text-amber-400 font-mono">
                          {opt.sample}
                        </span>
                      )}

                      {/* Text info with maximum contrast */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold ${isSelected ? 'text-[#C27803] dark:text-amber-400' : 'text-stone-900 dark:text-stone-100'}`} style={opt.fontFamily ? { fontFamily: opt.fontFamily } : {}}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/20 text-[9px] font-mono text-[#C27803] dark:text-amber-300 font-semibold">
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        {opt.description && (
                          <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-snug">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active checkmark */}
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#C27803] dark:text-amber-400 shrink-0 mt-0.5 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
