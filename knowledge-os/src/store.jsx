// ============================================================
// Knowledge OS — Document store (localStorage backed)
// This is the Phase 1 persistence layer: create / edit / delete /
// search documents that survive a refresh.
// ============================================================
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { SEED_DOCS } from './data.js';
import { uid, relativeTime, wordCount, excerpt } from './util.js';
import { wikiLinks } from './markdown.js';

// v4: integration layer — 5 synthesis docs + connective passages woven into
// pivotal docs ("세계의 맥락"), tying the two eras into one world.
const KEY = 'logia.docs.v4';

// Worldbuilding seed is generated locally and gitignored, so it may be absent
// on a fresh clone — import.meta.glob resolves to {} in that case (no error).
const wbModules = import.meta.glob('./seed-worldbuilding.local.js', { eager: true });
const WORLDBUILDING_DOCS = Object.values(wbModules)[0]?.WORLDBUILDING_DOCS ?? [];

// Turn the seed list (relative `ago`) into real, timestamped documents.
function seed() {
  const now = Date.now();
  return [...SEED_DOCS, ...WORLDBUILDING_DOCS].map(({ ago = 0, ...rest }) => {
    const ts = new Date(now - ago * 60000).toISOString();
    return { ...rest, tags: rest.tags ?? [], createdAt: ts, updatedAt: ts };
  });
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch { /* ignore corrupt storage */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

const DocsContext = createContext(null);

export function DocsProvider({ children }) {
  const [raw, setRaw] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(raw)); } catch { /* ignore quota */ }
  }, [raw]);

  const createDoc = useCallback((partial = {}) => {
    const id = uid();
    const ts = new Date().toISOString();
    const doc = {
      id,
      title: partial.title ?? '제목 없는 문서',
      tags: partial.tags ?? [],
      content: partial.content ?? '',
      createdAt: ts,
      updatedAt: ts,
    };
    setRaw((prev) => [doc, ...prev]);
    return id;
  }, []);

  const updateDoc = useCallback((id, patch) => {
    setRaw((prev) => prev.map((d) =>
      d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
  }, []);

  const deleteDoc = useCallback((id) => {
    setRaw((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Decorated, recent-first view of the documents. Derives excerpt, word
  // count, and the link graph ([[wikilinks]] resolved by title).
  const docs = useMemo(() => {
    const titleToId = {};
    raw.forEach((d) => { titleToId[d.title.trim()] = d.id; });

    const backlinks = {};
    raw.forEach((d) => {
      wikiLinks(d.content).forEach((t) => {
        const tid = titleToId[t];
        if (tid && tid !== d.id) (backlinks[tid] ||= []).push(d.id);
      });
    });

    return raw
      .map((d) => {
        const outgoing = [...new Set(
          wikiLinks(d.content).map((t) => titleToId[t]).filter(Boolean),
        )];
        const back = backlinks[d.id] || [];
        return {
          ...d,
          tag: d.tags[0] || 'note',
          excerpt: excerpt(d.content),
          words: wordCount(d.content),
          outgoing,
          backlinks: back,
          links: new Set([...outgoing, ...back]).size,
          updated: relativeTime(d.updatedAt),
          updatedSort: Date.now() - new Date(d.updatedAt).getTime(),
        };
      })
      .sort((a, b) => a.updatedSort - b.updatedSort);
  }, [raw]);

  const getDoc = useCallback((id) => docs.find((d) => d.id === id), [docs]);

  const value = useMemo(
    () => ({ docs, getDoc, createDoc, updateDoc, deleteDoc }),
    [docs, getDoc, createDoc, updateDoc, deleteDoc],
  );

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export function useDocs() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error('useDocs must be used within DocsProvider');
  return ctx;
}
