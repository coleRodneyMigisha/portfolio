'use client';

import { useEffect, useState } from 'react';

export interface HeartbeatPayload {
  updated_at: string;
  latest_repo: string;
  latest_event: string;
  run_status: string;
}

const STORAGE_KEY = 'cole-portfolio-heartbeat-good';
// Treat data older than 24 hours as stale
const MAX_STALE_AGE_MS = 24 * 60 * 60 * 1000;

const REMOTE_DATA_URLS = [
  'https://raw.githubusercontent.com/coleRodneyMigisha/portfolio/data/heartbeat.json',
];

function isValidFreshPayload(raw: unknown): raw is HeartbeatPayload {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return false;
  }

  const record = raw as Record<string, unknown>;
  const { updated_at, latest_repo, latest_event, run_status } = record;

  if (
    typeof updated_at !== 'string' ||
    typeof latest_repo !== 'string' ||
    typeof latest_event !== 'string' ||
    typeof run_status !== 'string'
  ) {
    return false;
  }

  if (
    !updated_at.trim() ||
    !latest_repo.trim() ||
    !latest_event.trim() ||
    run_status.trim().toLowerCase() !== 'ok'
  ) {
    return false;
  }

  const timestampMs = Date.parse(updated_at);
  if (Number.isNaN(timestampMs)) {
    return false;
  }

  const ageMs = Date.now() - timestampMs;
  if (ageMs < -10 * 60 * 1000 || ageMs > MAX_STALE_AGE_MS) {
    return false;
  }

  return true;
}

function readCachedGoodValue(): HeartbeatPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidFreshPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedGoodValue(payload: HeartbeatPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}

function formatUtcTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
}

export default function HeartbeatStatus() {
  const [heartbeat, setHeartbeat] = useState<HeartbeatPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedGoodValue();
    if (cached && !cancelled) {
      setHeartbeat(cached);
    }

    async function fetchHeartbeat() {
      for (const url of REMOTE_DATA_URLS) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
          });
          if (!response.ok) continue;

          const data: unknown = await response.json();
          if (isValidFreshPayload(data)) {
            writeCachedGoodValue(data);
            if (!cancelled) {
              setHeartbeat(data);
            }
            return;
          }
        } catch {
          // Silently try next source or retain last good cached value
        }
      }
    }

    fetchHeartbeat();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!heartbeat) {
    return null;
  }

  const timeLabel = formatUtcTime(heartbeat.updated_at);

  return (
    <p className="heartbeat-line">
      <a href="#projects" className="heartbeat-status-link">
        heartbeat: last run {timeLabel}
      </a>
    </p>
  );
}
