// Anti-Cheating & Interview Integrity Proctor Service

export class ProctorMonitor {
  constructor({ onEvent, onStatusChange }) {
    this.onEvent = onEvent;
    this.onStatusChange = onStatusChange;
    this.events = [];
    this.integrityScore = 100;
    this.startTime = Date.now();
    this.isMonitoring = false;
    this.tabSwitchCount = 0;
    this.faceLostCount = 0;
    this.multiFaceCount = 0;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
  }

  getFormattedTimestamp() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  logEvent(type, description, severity = 'medium') {
    const timestamp = this.getFormattedTimestamp();
    const event = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      timestamp,
      description,
      severity
    };

    // Calculate score penalty
    let penalty = 0;
    if (type === 'TAB_SWITCH') {
      this.tabSwitchCount++;
      penalty = 12;
    } else if (type === 'FACE_LOST') {
      this.faceLostCount++;
      penalty = 8;
    } else if (type === 'MULTIPLE_FACES') {
      this.multiFaceCount++;
      penalty = 25;
    }

    this.integrityScore = Math.max(10, this.integrityScore - penalty);
    this.events.unshift(event);

    if (this.onEvent) {
      this.onEvent(event, this.integrityScore, this.getRiskLevel());
    }

    return event;
  }

  getRiskLevel() {
    if (this.integrityScore >= 80 && this.multiFaceCount === 0) return 'Low';
    if (this.integrityScore >= 60) return 'Medium';
    return 'High';
  }

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.startTime = Date.now();

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);

    this.logEvent('SESSION_STARTED', 'Integrity proctoring activated. Webcam & focus monitoring live.', 'info');
  }

  stop() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.logEvent('TAB_SWITCH', 'Candidate switched away from interview browser tab.', 'high');
      if (this.onStatusChange) this.onStatusChange({ tabActive: false });
    } else {
      if (this.onStatusChange) this.onStatusChange({ tabActive: true });
    }
  }

  handleWindowBlur() {
    // Only log if not already hidden to avoid duplicate counts with visibilitychange
    if (!document.hidden) {
      this.logEvent('FOCUS_LOST', 'Candidate clicked outside browser window or opened secondary application.', 'medium');
      if (this.onStatusChange) this.onStatusChange({ windowFocused: false });
    }
  }

  handleWindowFocus() {
    if (this.onStatusChange) this.onStatusChange({ windowFocused: true });
  }
}
