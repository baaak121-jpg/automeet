/**
 * IndexedDB 기반 회의록 저장소
 * idb 라이브러리 사용 (https://github.com/jakearchibald/idb)
 * localStorage 폴백 포함
 */
import type { MeetingNote } from "../types";

const DB_NAME = "automeet-db";
const STORE_NAME = "meeting-notes";
const DB_VERSION = 1;
const LS_KEY = "automeet-notes";

// idb 동적 임포트 (SSR 방지)
async function getIdb() {
  if (typeof window === "undefined") return null;
  try {
    const { openDB } = await import("idb");
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  } catch {
    return null;
  }
}

// ── localStorage 폴백 ──────────────────────────────────────────────

function lsGetAll(): MeetingNote[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function lsSave(notes: MeetingNote[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

// ── 공개 API ──────────────────────────────────────────────────────

export async function getAllNotes(): Promise<MeetingNote[]> {
  const db = await getIdb();
  if (db) {
    const all = await db.getAll(STORE_NAME);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }
  return lsGetAll().sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveNote(note: MeetingNote): Promise<void> {
  const db = await getIdb();
  if (db) {
    await db.put(STORE_NAME, note);
    return;
  }
  const notes = lsGetAll();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.unshift(note);
  lsSave(notes);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getIdb();
  if (db) {
    await db.delete(STORE_NAME, id);
    return;
  }
  lsSave(lsGetAll().filter((n) => n.id !== id));
}

export async function clearAllNotes(): Promise<void> {
  const db = await getIdb();
  if (db) {
    await db.clear(STORE_NAME);
    return;
  }
  lsSave([]);
}
