import { SessionState, AppMode } from '@/types';

let panelEl: HTMLElement | null = null;
let timerInterval: number | null = null;
let sessionStartedAt: number | null = null;
let sessionDurationMs: number = 25 * 60 * 1000;
let stopCallback: (() => void) | null = null;

export function injectPanel(mode: AppMode, durationMin?: number, onStop?: () => void) {
  if (document.getElementById('lbp-panel')) return;

  if (durationMin) sessionDurationMs = durationMin * 60 * 1000;
  if (onStop) stopCallback = onStop;

  const style = document.createElement('style');
  style.id = 'lbp-panel-styles';
  style.textContent = `
    #lbp-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #0f172a;
      border-radius: 14px;
      padding: 10px 14px;
      width: 220px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.05);
      font-family: system-ui, -apple-system, sans-serif;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s;
      cursor: default;
      user-select: none;
    }
    #lbp-panel.visible { opacity: 1; transform: translateY(0); }
    #lbp-panel .lbp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    #lbp-panel .lbp-title {
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    #lbp-panel .lbp-mode-badge {
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 999px;
      font-weight: 600;
    }
    #lbp-panel .lbp-mode-assist { background: rgba(10, 102, 194, 0.15); color: #0A66C2; }
    #lbp-panel .lbp-mode-agent { background: rgba(244, 177, 131, 0.2); color: #C97C5D; }
    #lbp-panel .lbp-timer {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      margin: 4px 0;
      letter-spacing: 1px;
    }
    #lbp-panel .lbp-status {
      text-align: center;
      font-size: 10px;
      color: #64748B;
      margin-bottom: 6px;
    }
    #lbp-panel .lbp-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      text-align: center;
    }
    #lbp-panel .lbp-stat-value {
      font-size: 15px;
      font-weight: 700;
    }
    #lbp-panel .lbp-stat-label {
      font-size: 9px;
      color: #9CA3AF;
      margin-top: 1px;
    }
    #lbp-panel .lbp-close {
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
      background: none;
      border: none;
      color: #64748B;
      font-size: 14px;
      padding: 0;
      line-height: 1;
    }
    #lbp-panel .lbp-close:hover { opacity: 1; }
    #lbp-panel .lbp-stop-btn {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 5px;
      border: none;
      border-radius: 8px;
      background: #DC2626;
      color: white;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    #lbp-panel .lbp-stop-btn:hover { background: #B91C1C; }
    #lbp-panel .lbp-minimized { display: none; }
    #lbp-panel.mini { width: auto; padding: 6px 12px; }
    #lbp-panel.mini .lbp-expanded { display: none; }
    #lbp-panel.mini .lbp-minimized { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
  `;
  document.head.appendChild(style);

  panelEl = document.createElement('div');
  panelEl.id = 'lbp-panel';
  panelEl.innerHTML = `
    <div class="lbp-expanded">
      <div class="lbp-header">
        <div class="lbp-title">
          <span>\u2728 Lama</span>
          <span class="lbp-mode-badge ${mode === 'agent' ? 'lbp-mode-agent' : 'lbp-mode-assist'}">
            ${mode === 'agent' ? 'Agent' : 'Assisté'}
          </span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="lbp-close" id="lbp-panel-mini" title="Réduire">_</button>
          <button class="lbp-close" id="lbp-panel-close" title="Fermer">&times;</button>
        </div>
      </div>
      <div class="lbp-timer" id="lbp-timer">25:00</div>
      <div class="lbp-status" id="lbp-status">En cours...</div>
      <div class="lbp-stats">
        <div>
          <div class="lbp-stat-value" id="lbp-likes" style="color:#0A66C2">0</div>
          <div class="lbp-stat-label">Likes</div>
        </div>
        <div>
          <div class="lbp-stat-value" id="lbp-comments" style="color:#C97C5D">0</div>
          <div class="lbp-stat-label">Coms</div>
        </div>
        <div>
          <div class="lbp-stat-value" id="lbp-total" style="color:#374151">0</div>
          <div class="lbp-stat-label">Total</div>
        </div>
      </div>
      <button class="lbp-stop-btn" id="lbp-panel-stop">Stop</button>
    </div>
    <div class="lbp-minimized" id="lbp-mini-content">
      <span>\u2728</span>
      <span id="lbp-mini-timer">25:00</span>
      <span id="lbp-mini-stats" style="color:#9CA3AF;font-size:10px">0/0/0</span>
    </div>
  `;
  document.body.appendChild(panelEl);

  document.getElementById('lbp-panel-close')?.addEventListener('click', () => {
    if (panelEl) panelEl.classList.remove('visible');
  });
  document.getElementById('lbp-panel-mini')?.addEventListener('click', () => {
    panelEl?.classList.toggle('mini');
  });
  document.getElementById('lbp-mini-content')?.addEventListener('click', () => {
    panelEl?.classList.remove('mini');
  });
  document.getElementById('lbp-panel-stop')?.addEventListener('click', () => {
    if (stopCallback) stopCallback();
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panelEl?.classList.add('visible');
    });
  });

  sessionStartedAt = Date.now();
  startTimer();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    if (!sessionStartedAt) return;
    const elapsed = Date.now() - sessionStartedAt;
    const remaining = Math.max(0, sessionDurationMs - elapsed);
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const timerEl = document.getElementById('lbp-timer');
    if (timerEl) timerEl.textContent = timeStr;
    const miniTimerEl = document.getElementById('lbp-mini-timer');
    if (miniTimerEl) miniTimerEl.textContent = timeStr;
  }, 1000);
}

export function updatePanel(session: SessionState, _mode: AppMode) {
  const statusEl = document.getElementById('lbp-status');
  const likesEl = document.getElementById('lbp-likes');
  const commentsEl = document.getElementById('lbp-comments');
  const totalEl = document.getElementById('lbp-total');
  const miniStatsEl = document.getElementById('lbp-mini-stats');

  if (statusEl) {
    statusEl.textContent = `${session.likesThisSession}/${session.targetLikes} likes \u00B7 ${session.commentsThisSession}/${session.targetComments} coms`;
  }
  if (likesEl) likesEl.textContent = String(session.likesThisSession);
  if (commentsEl) commentsEl.textContent = String(session.commentsThisSession);
  if (totalEl) totalEl.textContent = String(session.actionsDone);
  if (miniStatsEl) miniStatsEl.textContent = `${session.likesThisSession}/${session.commentsThisSession}/${session.actionsDone}`;
}

export function updatePanelTimer(startedAt: number, durationMin: number) {
  sessionStartedAt = startedAt;
  sessionDurationMs = durationMin * 60 * 1000;
}

export function updatePanelStatus(text: string) {
  const statusEl = document.getElementById('lbp-status');
  if (statusEl) statusEl.textContent = text;
}

export function removePanel() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  document.getElementById('lbp-panel')?.remove();
  document.getElementById('lbp-panel-styles')?.remove();
  panelEl = null;
  sessionStartedAt = null;
  stopCallback = null;
}
