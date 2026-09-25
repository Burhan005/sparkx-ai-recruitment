/**
 * Authoritative Frontend Compensation & CTC Presentation Formatter for SparkX
 * Mirrors backend formatting rules with zero client-side arithmetic drift.
 */

export function formatCTCValue(val, currency = 'INR', period = 'annual') {
  if (val == null || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return null;

  // Format integer vs decimal cleanly
  const formattedNum = Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '');
  const curr = (currency || 'INR').toUpperCase();
  const per = (period || 'annual').toLowerCase();

  if (curr === 'INR') {
    const unit = per === 'annual' ? 'LPA' : '/mo';
    return `₹${formattedNum} ${unit}`;
  } else if (curr === 'USD') {
    const unit = per === 'annual' ? 'k/yr' : '/mo';
    return `$${formattedNum} ${unit}`;
  } else if (curr === 'EUR') {
    const unit = per === 'annual' ? 'k/yr' : '/mo';
    return `€${formattedNum} ${unit}`;
  } else if (curr === 'GBP') {
    const unit = per === 'annual' ? 'k/yr' : '/mo';
    return `£${formattedNum} ${unit}`;
  }
  return `${curr} ${formattedNum}`;
}

export function formatJobCTC(job) {
  if (!job) return 'Compensation not specified';

  // Support both backend formatted string and structured properties
  if (job.formatted_compensation && job.formatted_compensation !== 'Compensation not specified') {
    return job.formatted_compensation;
  }
  if (job.formattedCompensation && job.formattedCompensation !== 'Compensation not specified') {
    return job.formattedCompensation;
  }

  const min = job.ctc_min != null ? job.ctc_min : job.ctcMin;
  const max = job.ctc_max != null ? job.ctc_max : job.ctcMax;
  const type = (job.ctc_type || job.ctcType || 'range').toLowerCase();
  const currency = (job.ctc_currency || job.ctcCurrency || 'INR').toUpperCase();
  const rawPeriod = (job.ctc_period || job.ctcPeriod || 'annual').toLowerCase();
  const isAnnual = rawPeriod === 'annual' || rawPeriod === 'per_annum' || rawPeriod === 'annum' || rawPeriod === 'yearly';

  if (min == null && max == null) {
    return 'Compensation not specified';
  }

  const numMin = min != null ? (Number.isInteger(Number(min)) ? String(Number(min)) : Number(min).toFixed(2).replace(/\.?0+$/, '')) : null;
  const numMax = max != null ? (Number.isInteger(Number(max)) ? String(Number(max)) : Number(max).toFixed(2).replace(/\.?0+$/, '')) : null;

  const sym = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : `${currency} `)));
  const unit = currency === 'INR' ? (isAnnual ? 'LPA' : '/mo') : (isAnnual ? 'k/yr' : '/mo');

  if (type === 'fixed' || (numMax != null && numMin === numMax) || (numMin != null && numMax == null && type !== 'starting_from')) {
    const val = numMin != null ? numMin : numMax;
    return `${sym}${val} ${unit}`;
  }
  if (type === 'starting_from') {
    return `From ${sym}${numMin} ${unit}`;
  }
  // Range
  if (numMin != null && numMax != null) {
    return `${sym}${numMin}–${numMax} ${unit}`;
  } else if (numMin != null) {
    return `From ${sym}${numMin} ${unit}`;
  } else {
    return `Up to ${sym}${numMax} ${unit}`;
  }
}

export function formatCandidateExpectedCTC(cand) {
  if (!cand) return 'Not specified';

  if (cand.candidate_expectation_formatted && cand.candidate_expectation_formatted !== 'Not specified') {
    return cand.candidate_expectation_formatted;
  }
  if (cand.candidateExpectationFormatted && cand.candidateExpectationFormatted !== 'Not specified') {
    return cand.candidateExpectationFormatted;
  }

  const min = cand.expected_ctc_min != null ? cand.expected_ctc_min : cand.expectedCtcMin;
  const max = cand.expected_ctc_max != null ? cand.expected_ctc_max : cand.expectedCtcMax;
  const type = (cand.expected_ctc_type || cand.expectedCtcType || 'range').toLowerCase();
  const currency = (cand.ctc_currency || cand.ctcCurrency || 'INR').toUpperCase();

  if (min == null && max == null) {
    return 'Not specified';
  }

  return formatJobCTC({
    ctcMin: min,
    ctcMax: max,
    ctcType: type,
    ctcCurrency: currency,
    ctcPeriod: 'annual'
  });
}

export function formatCandidateCurrentCTC(cand) {
  if (!cand) return 'Not provided';
  const val = cand.current_ctc != null ? cand.current_ctc : cand.currentCtc;
  if (val == null || val === '') return 'Not provided';
  const currency = cand.ctc_currency || cand.ctcCurrency || 'INR';
  return formatCTCValue(val, currency, 'annual') || 'Not provided';
}

export function getCompensationBadgeConfig(relationship) {
  switch (relationship) {
    case 'within_range':
      return {
        label: 'Within advertised range',
        shortLabel: 'Within Budget',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        iconVariant: 'success'
      };
    case 'above_range':
      return {
        label: 'Above advertised budget',
        shortLabel: 'Above Budget',
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        dotColor: 'bg-rose-500',
        iconVariant: 'danger'
      };
    case 'below_range':
      return {
        label: 'Below advertised budget',
        shortLabel: 'Below Budget',
        badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
        dotColor: 'bg-blue-500',
        iconVariant: 'info'
      };
    case 'partial_overlap':
      return {
        label: 'Partial overlap with budget',
        shortLabel: 'Partial Overlap',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dotColor: 'bg-amber-500',
        iconVariant: 'warning'
      };
    case 'currency_mismatch':
      return {
        label: 'Currency mismatch',
        shortLabel: 'Currency Mismatch',
        badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        dotColor: 'bg-purple-500',
        iconVariant: 'warning'
      };
    case 'job_compensation_unavailable':
      return {
        label: 'Compensation not specified',
        shortLabel: 'Budget Not Set',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotColor: 'bg-slate-400',
        iconVariant: 'neutral'
      };
    case 'expectation_unavailable':
    default:
      return {
        label: 'Expectation not specified',
        shortLabel: 'Not Provided',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotColor: 'bg-slate-400',
        iconVariant: 'neutral'
      };
  }
}
