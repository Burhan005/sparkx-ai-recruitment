"""
Authoritative Compensation & CTC Service for SparkX
Single Source of Truth for:
- Exact numeric/Decimal comparison logic (zero floating point drift)
- Relationship resolution (within_range, above_range, below_range, partial_overlap, etc.)
- Strict currency mismatch guards
- Standardized human-facing CTC presentation formatting
- Deterministic recruitment pipeline aggregates for Ask SparkX & analytics
"""
from decimal import Decimal, InvalidOperation
from typing import Dict, Any, Optional, List, Tuple, Union

RELATIONSHIP_WITHIN_RANGE = "within_range"
RELATIONSHIP_ABOVE_RANGE = "above_range"
RELATIONSHIP_BELOW_RANGE = "below_range"
RELATIONSHIP_PARTIAL_OVERLAP = "partial_overlap"
RELATIONSHIP_EXPECTATION_UNAVAILABLE = "expectation_unavailable"
RELATIONSHIP_JOB_UNAVAILABLE = "job_compensation_unavailable"
RELATIONSHIP_CURRENCY_MISMATCH = "currency_mismatch"

RELATIONSHIP_LABELS = {
    RELATIONSHIP_WITHIN_RANGE: "Within advertised range",
    RELATIONSHIP_ABOVE_RANGE: "Above advertised budget",
    RELATIONSHIP_BELOW_RANGE: "Below advertised budget",
    RELATIONSHIP_PARTIAL_OVERLAP: "Partial overlap with budget",
    RELATIONSHIP_EXPECTATION_UNAVAILABLE: "Expectation not specified",
    RELATIONSHIP_JOB_UNAVAILABLE: "Compensation not specified",
    RELATIONSHIP_CURRENCY_MISMATCH: "Currency mismatch (Comparison unavailable)"
}


def to_decimal(val: Any) -> Optional[Decimal]:
    """Safely convert any numeric, string or float value into an exact Decimal."""
    if val is None or val == "":
        return None
    try:
        # Stringify to avoid binary float artifacts, e.g., Decimal(str(8.1))
        return Decimal(str(val).strip())
    except (InvalidOperation, TypeError, ValueError):
        return None


def format_ctc_value(val: Optional[Decimal], currency: str = "INR", period: str = "annual") -> str:
    """Format a single Decimal value into standard SparkX display string."""
    if val is None:
        return "Not specified"
    
    # Format whole numbers without trailing zeros, decimals with up to 2 places
    if val == val.to_integral():
        val_str = str(int(val))
    else:
        # Strip trailing zeros: e.g. 8.50 -> 8.5
        val_str = f"{val:.2f}".rstrip("0").rstrip(".")

    curr = (currency or "INR").upper()
    per = (period or "annual").lower()

    if curr == "INR":
        suffix = " LPA" if per == "annual" else " / mo"
        return f"₹{val_str}{suffix}"
    elif curr == "USD":
        suffix = "k/yr" if per == "annual" else "/mo"
        return f"${val_str}{suffix}"
    elif curr == "EUR":
        suffix = "k/yr" if per == "annual" else "/mo"
        return f"€{val_str}{suffix}"
    elif curr == "GBP":
        suffix = "k/yr" if per == "annual" else "/mo"
        return f"£{val_str}{suffix}"
    else:
        return f"{curr} {val_str}"


def format_job_compensation(
    ctc_min: Optional[Any],
    ctc_max: Optional[Any],
    ctc_type: Optional[str] = "range",
    ctc_currency: str = "INR",
    ctc_period: str = "annual",
    variable_min: Optional[Any] = None,
    variable_max: Optional[Any] = None
) -> str:
    """
    Format job compensation into standard SparkX presentation.
    Examples:
    - '₹8–12 LPA' (range)
    - '₹10 LPA' (fixed)
    - 'From ₹8 LPA' (starting_from)
    - 'Compensation not specified'
    """
    d_min = to_decimal(ctc_min)
    d_max = to_decimal(ctc_max)
    ctype = (ctc_type or "range").lower().strip()

    if d_min is None and d_max is None:
        return "Compensation not specified"

    curr = (ctc_currency or "INR").upper()
    per = (ctc_period or "annual").lower()

    def _val_num(d: Decimal) -> str:
        if d == d.to_integral():
            return str(int(d))
        return f"{d:.2f}".rstrip("0").rstrip(".")

    if curr == "INR":
        unit = "LPA" if per == "annual" else "/mo"
        if ctype == "fixed" or (d_max is not None and d_min == d_max) or (d_min is not None and d_max is None and ctype != "starting_from"):
            target_val = d_min if d_min is not None else d_max
            base_str = f"₹{_val_num(target_val)} {unit}"
        elif ctype == "starting_from":
            base_str = f"From ₹{_val_num(d_min)} {unit}"
        else: # range
            if d_min is not None and d_max is not None:
                base_str = f"₹{_val_num(d_min)}–{_val_num(d_max)} {unit}"
            elif d_min is not None:
                base_str = f"From ₹{_val_num(d_min)} {unit}"
            else:
                base_str = f"Up to ₹{_val_num(d_max)} {unit}"
    else:
        # Standard international presentation
        curr_sym = "$" if curr == "USD" else ("€" if curr == "EUR" else ("£" if curr == "GBP" else f"{curr} "))
        unit = "k/yr" if per == "annual" else "/mo"
        if ctype == "fixed" or (d_max is not None and d_min == d_max):
            target_val = d_min if d_min is not None else d_max
            base_str = f"{curr_sym}{_val_num(target_val)} {unit}"
        elif ctype == "starting_from":
            base_str = f"From {curr_sym}{_val_num(d_min)} {unit}"
        else:
            if d_min is not None and d_max is not None:
                base_str = f"{curr_sym}{_val_num(d_min)}–{_val_num(d_max)} {unit}"
            elif d_min is not None:
                base_str = f"From {curr_sym}{_val_num(d_min)} {unit}"
            else:
                base_str = f"Up to {curr_sym}{_val_num(d_max)} {unit}"

    # Add optional variable pay note if present
    v_min = to_decimal(variable_min)
    v_max = to_decimal(variable_max)
    if v_min is not None or v_max is not None:
        if v_min is not None and v_max is not None and v_min != v_max:
            base_str += f" (+₹{_val_num(v_min)}–{_val_num(v_max)} variable)" if curr == "INR" else f" (+{curr_sym}{_val_num(v_min)}–{_val_num(v_max)} variable)"
        else:
            v_val = v_min if v_min is not None else v_max
            base_str += f" (+₹{_val_num(v_val)} variable)" if curr == "INR" else f" (+{curr_sym}{_val_num(v_val)} variable)"

    return base_str


def format_candidate_expectation(
    exp_min: Optional[Any],
    exp_max: Optional[Any],
    exp_type: Optional[str] = "range",
    currency: str = "INR"
) -> str:
    """
    Format candidate's expected compensation.
    Examples:
    - '₹10–12 LPA' (range)
    - '₹11 LPA' (exact)
    - 'Not specified'
    """
    d_min = to_decimal(exp_min)
    d_max = to_decimal(exp_max)
    etype = (exp_type or "range").lower().strip()

    if d_min is None and d_max is None:
        return "Not specified"

    return format_job_compensation(
        ctc_min=d_min,
        ctc_max=d_max,
        ctc_type="fixed" if etype == "fixed" else "range",
        ctc_currency=currency,
        ctc_period="annual"
    )


def calculate_compensation_comparison(
    job_ctc_type: Optional[str],
    job_ctc_min: Optional[Any],
    job_ctc_max: Optional[Any],
    job_currency: Optional[str],
    cand_exp_type: Optional[str],
    cand_exp_min: Optional[Any],
    cand_exp_max: Optional[Any],
    cand_currency: Optional[str],
    cand_current_ctc: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Authoritative, deterministic comparison between Job Budget and Candidate Expectations.
    Pure backend business logic using exact Decimals.
    """
    j_min = to_decimal(job_ctc_min)
    j_max = to_decimal(job_ctc_max)
    c_min = to_decimal(cand_exp_min)
    c_max = to_decimal(cand_exp_max)
    cur_ctc = to_decimal(cand_current_ctc)

    j_curr = (job_currency or "INR").upper().strip()
    c_curr = (cand_currency or "INR").upper().strip()
    j_type = (job_ctc_type or "range").lower().strip()
    c_type = (cand_exp_type or "range").lower().strip()

    job_formatted = format_job_compensation(j_min, j_max, j_type, j_curr)
    exp_formatted = format_candidate_expectation(c_min, c_max, c_type, c_curr)
    cur_formatted = format_ctc_value(cur_ctc, c_curr) if cur_ctc is not None else "Not provided"

    # Base structured payload
    base_result = {
        "job_budget_formatted": job_formatted,
        "candidate_expectation_formatted": exp_formatted,
        "candidate_current_ctc_formatted": cur_formatted,
        "job_currency": j_curr,
        "candidate_currency": c_curr,
        "relationship": RELATIONSHIP_EXPECTATION_UNAVAILABLE,
        "relationship_label": RELATIONSHIP_LABELS[RELATIONSHIP_EXPECTATION_UNAVAILABLE],
        "is_within_budget": False,
        "is_above_budget": False,
        "is_below_budget": False,
        "is_partial_overlap": False,
        "variance_min": None, # (c_min - j_max) if above, or (c_min - j_min)
        "variance_max": None,
        "detail": ""
    }

    # 1. Missing Job Compensation
    if j_min is None and j_max is None:
        base_result["relationship"] = RELATIONSHIP_JOB_UNAVAILABLE
        base_result["relationship_label"] = RELATIONSHIP_LABELS[RELATIONSHIP_JOB_UNAVAILABLE]
        base_result["detail"] = "Job budget has not been specified by recruiter."
        return base_result

    # 2. Missing Candidate Expectation
    if c_min is None and c_max is None:
        base_result["relationship"] = RELATIONSHIP_EXPECTATION_UNAVAILABLE
        base_result["relationship_label"] = RELATIONSHIP_LABELS[RELATIONSHIP_EXPECTATION_UNAVAILABLE]
        base_result["detail"] = "Candidate did not submit compensation expectations."
        return base_result

    # 3. Currency Mismatch Guard
    if j_curr != c_curr:
        base_result["relationship"] = RELATIONSHIP_CURRENCY_MISMATCH
        base_result["relationship_label"] = RELATIONSHIP_LABELS[RELATIONSHIP_CURRENCY_MISMATCH]
        base_result["detail"] = f"Job advertised in {j_curr} but candidate expectation submitted in {c_curr}. Currency conversion is not automatically estimated to avoid financial inaccuracies."
        return base_result

    # Normalize Candidate Effective Range
    # If fixed or single value provided, min and max are identical
    if c_type == "fixed" or c_max is None:
        cand_lower = c_min if c_min is not None else c_max
        cand_upper = cand_lower
    elif c_min is None:
        cand_lower = c_max
        cand_upper = c_max
    else:
        cand_lower = min(c_min, c_max)
        cand_upper = max(c_min, c_max)

    # 4. Handle Starting From Job Budget
    if j_type == "starting_from" or (j_min is not None and j_max is None):
        base_floor = j_min
        if cand_lower >= base_floor:
            rel = RELATIONSHIP_WITHIN_RANGE
            is_within = True
            detail = f"Candidate expectation ({exp_formatted}) meets or exceeds the starting baseline of {job_formatted}."
        elif cand_upper < base_floor:
            rel = RELATIONSHIP_BELOW_RANGE
            detail = f"Candidate expectation ({exp_formatted}) is below the starting baseline of {job_formatted}."
        else: # cand_lower < base_floor <= cand_upper
            rel = RELATIONSHIP_PARTIAL_OVERLAP
            detail = f"Candidate expectation range ({exp_formatted}) overlaps the starting baseline of {job_formatted}."

        base_result.update({
            "relationship": rel,
            "relationship_label": RELATIONSHIP_LABELS[rel],
            "is_within_budget": (rel == RELATIONSHIP_WITHIN_RANGE),
            "is_above_budget": False,
            "is_below_budget": (rel == RELATIONSHIP_BELOW_RANGE),
            "is_partial_overlap": (rel == RELATIONSHIP_PARTIAL_OVERLAP),
            "variance_min": float(cand_lower - base_floor),
            "variance_max": float(cand_upper - base_floor),
            "detail": detail
        })
        return base_result

    # Normalize Job Range
    if j_type == "fixed" or j_max is None:
        job_lower = j_min if j_min is not None else j_max
        job_upper = job_lower
    elif j_min is None:
        job_lower = j_max
        job_upper = j_max
    else:
        job_lower = min(j_min, j_max)
        job_upper = max(j_min, j_max)

    # 5. Core Comparison with Inclusive Boundaries
    # Case A: Candidate is completely contained inside job range [job_lower, job_upper]
    if cand_lower >= job_lower and cand_upper <= job_upper:
        rel = RELATIONSHIP_WITHIN_RANGE
        detail = f"Candidate expected compensation ({exp_formatted}) is completely within the advertised budget ({job_formatted})."
    # Case B: Candidate is strictly above job upper limit
    elif cand_lower > job_upper:
        rel = RELATIONSHIP_ABOVE_RANGE
        detail = f"Candidate expected compensation ({exp_formatted}) exceeds the maximum advertised budget of {format_ctc_value(job_upper, j_curr)}."
    # Case C: Candidate is strictly below job lower limit
    elif cand_upper < job_lower:
        rel = RELATIONSHIP_BELOW_RANGE
        detail = f"Candidate expected compensation ({exp_formatted}) is below the advertised baseline of {format_ctc_value(job_lower, j_curr)}."
    # Case D: Candidate overlaps the job range (e.g. Job 8-10, Candidate 10-12, or Candidate 7-11)
    else:
        rel = RELATIONSHIP_PARTIAL_OVERLAP
        detail = f"Candidate expected compensation ({exp_formatted}) partially overlaps the advertised budget ({job_formatted})."

    var_min = float(cand_lower - job_lower)
    var_max = float(cand_upper - job_upper)

    base_result.update({
        "relationship": rel,
        "relationship_label": RELATIONSHIP_LABELS[rel],
        "is_within_budget": (rel == RELATIONSHIP_WITHIN_RANGE),
        "is_above_budget": (rel == RELATIONSHIP_ABOVE_RANGE),
        "is_below_budget": (rel == RELATIONSHIP_BELOW_RANGE),
        "is_partial_overlap": (rel == RELATIONSHIP_PARTIAL_OVERLAP),
        "variance_min": var_min,
        "variance_max": var_max,
        "detail": detail
    })
    return base_result


def analyze_candidate_application(candidate: Any, job: Optional[Any] = None) -> Dict[str, Any]:
    """Helper to produce structured compensation analysis for a candidate application."""
    if not job and hasattr(candidate, "job"):
        job = candidate.job

    return calculate_compensation_comparison(
        job_ctc_type=getattr(job, "ctc_type", None) if job else None,
        job_ctc_min=getattr(job, "ctc_min", None) if job else None,
        job_ctc_max=getattr(job, "ctc_max", None) if job else None,
        job_currency=getattr(job, "ctc_currency", "INR") if job else "INR",
        cand_exp_type=getattr(candidate, "expected_ctc_type", None),
        cand_exp_min=getattr(candidate, "expected_ctc_min", None),
        cand_exp_max=getattr(candidate, "expected_ctc_max", None),
        cand_currency=getattr(candidate, "ctc_currency", "INR") or "INR",
        cand_current_ctc=getattr(candidate, "current_ctc", None)
    )


def calculate_job_compensation_metrics(candidates: List[Any], job: Optional[Any] = None) -> Dict[str, Any]:
    """
    Deterministic recruitment analytics for a group of candidate applications.
    Used by Ask SparkX and Recruiter Dashboard.
    """
    total = len(candidates)
    provided_cands = []
    expected_values: List[Decimal] = []

    counts = {
        RELATIONSHIP_WITHIN_RANGE: 0,
        RELATIONSHIP_ABOVE_RANGE: 0,
        RELATIONSHIP_BELOW_RANGE: 0,
        RELATIONSHIP_PARTIAL_OVERLAP: 0,
        RELATIONSHIP_EXPECTATION_UNAVAILABLE: 0,
        RELATIONSHIP_CURRENCY_MISMATCH: 0,
    }

    for c in candidates:
        analysis = analyze_candidate_application(c, job)
        rel = analysis["relationship"]
        if rel in counts:
            counts[rel] += 1
        else:
            counts[RELATIONSHIP_EXPECTATION_UNAVAILABLE] += 1

        exp_min = to_decimal(getattr(c, "expected_ctc_min", None))
        exp_max = to_decimal(getattr(c, "expected_ctc_max", None))
        if exp_min is not None or exp_max is not None:
            provided_cands.append(c)
            # Use midpoint for average calculations
            if exp_min is not None and exp_max is not None:
                expected_values.append((exp_min + exp_max) / Decimal("2"))
            elif exp_min is not None:
                expected_values.append(exp_min)
            else:
                expected_values.append(exp_max)

    avg_ctc = (sum(expected_values) / Decimal(str(len(expected_values)))) if expected_values else None
    sorted_values = sorted(expected_values)
    median_ctc = None
    if sorted_values:
        n = len(sorted_values)
        if n % 2 == 1:
            median_ctc = sorted_values[n // 2]
        else:
            median_ctc = (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / Decimal("2")

    min_ctc = sorted_values[0] if sorted_values else None
    max_ctc = sorted_values[-1] if sorted_values else None

    curr = (getattr(job, "ctc_currency", "INR") if job else "INR")

    return {
        "total_applicants": total,
        "provided_count": len(provided_cands),
        "unprovided_count": counts[RELATIONSHIP_EXPECTATION_UNAVAILABLE],
        "within_range_count": counts[RELATIONSHIP_WITHIN_RANGE],
        "above_range_count": counts[RELATIONSHIP_ABOVE_RANGE],
        "below_range_count": counts[RELATIONSHIP_BELOW_RANGE],
        "partial_overlap_count": counts[RELATIONSHIP_PARTIAL_OVERLAP],
        "currency_mismatch_count": counts[RELATIONSHIP_CURRENCY_MISMATCH],
        "average_expected_ctc": float(avg_ctc) if avg_ctc is not None else None,
        "average_expected_ctc_formatted": format_ctc_value(avg_ctc, curr) if avg_ctc is not None else "N/A",
        "median_expected_ctc_formatted": format_ctc_value(median_ctc, curr) if median_ctc is not None else "N/A",
        "min_expected_ctc_formatted": format_ctc_value(min_ctc, curr) if min_ctc is not None else "N/A",
        "max_expected_ctc_formatted": format_ctc_value(max_ctc, curr) if max_ctc is not None else "N/A",
        "job_budget_formatted": format_job_compensation(
            getattr(job, "ctc_min", None) if job else None,
            getattr(job, "ctc_max", None) if job else None,
            getattr(job, "ctc_type", "range") if job else "range",
            curr
        ) if job else "N/A"
    }
