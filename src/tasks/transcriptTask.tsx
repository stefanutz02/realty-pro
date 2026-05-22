// src/tasks/transcriptTask.tsx

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSCRIPT_TASK = 'property-assistant-transcript-task';
const API_URL = "https:

interface PendingSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  consentGiven: boolean;
  messageCount: number;
  transcriptSent: boolean;
}

const PENDING_SESSIONS_KEY = '@assistant_pending_sessions';

TaskManager.defineTask(TRANSCRIPT_TASK, async () => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;

    const sessions: PendingSession[] = JSON.parse(raw);
    const now = Date.now();
    const INACTIVITY_MS = 2 * 60 * 1000;
    let updated = false;

    for (const session of sessions) {
      if (session.transcriptSent || !session.consentGiven || session.messageCount < 2) continue;

      const inactiveTime = now - session.lastActivity;
      if (inactiveTime >= INACTIVITY_MS) {
        try {
          await fetch(`${API_URL}/chat/transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              trigger: 'background_inactivity',
            }),
          });
          session.transcriptSent = true;
          updated = true;
          console.log(`[BG] Transcript sent for session ${session.sessionId}`);
        } catch (err) {
          console.log('[BG] Transcript send failed:', err);
        }
      }
    }

    if (updated) {
      await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(sessions));
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.log('[BG] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerTranscriptTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TRANSCRIPT_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(TRANSCRIPT_TASK, {
    minimumInterval: 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterTranscriptTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TRANSCRIPT_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(TRANSCRIPT_TASK);
  }
}

export async function addPendingSession(session: PendingSession): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  const sessions: PendingSession[] = raw ? JSON.parse(raw) : [];
  
  const filtered = sessions.filter(s => s.sessionId !== session.sessionId);
  filtered.push(session);
  
  await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(filtered));
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  if (!raw) return;
  
  const sessions: PendingSession[] = JSON.parse(raw);
  const session = sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = Date.now();
    await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export async function markSessionTranscriptSent(sessionId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  if (!raw) return;
  
  const sessions: PendingSession[] = JSON.parse(raw);
  const session = sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.transcriptSent = true;
    await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export async function removePendingSession(sessionId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  if (!raw) return;
  
  const sessions: PendingSession[] = JSON.parse(raw);
  const filtered = sessions.filter(s => s.sessionId !== sessionId);
  await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(filtered));
}

export async function cleanupOldSessions(): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  if (!raw) return;
  
  const sessions: PendingSession[] = JSON.parse(raw);
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const filtered = sessions.filter(s => now - s.startTime < ONE_DAY);
  await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(filtered));
}
