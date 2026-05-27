import { UNITS } from "./curriculum";
import { GENERATORS } from "./generators";
import { canUseCloudLearningDb } from "./cloudLearningDb";
import type { LearningArea, LearningLevel, Problem, Unit } from "./types";

export interface ContentCatalogRecord {
  id: string;
  subject: "math" | "english";
  schoolLevel: "elementary" | "middle";
  category: "operation" | "concept" | "type" | "challenge" | "word" | "grammar" | "publisher-exam";
  publisher?: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentTopicRecord {
  id: string;
  databaseId: string;
  topicId: string;
  unitId: string;
  unitNo: number;
  unitTitle: string;
  title: string;
  desc: string;
  learningLevel?: LearningLevel;
  learningArea?: LearningArea;
  generatorId: string;
  order: number;
  updatedAt: string;
}

export interface ContentUnitRecord {
  id: string;
  databaseId: string;
  unitKey: string;
  subject: "math" | "english";
  schoolLevel: "elementary" | "middle";
  gradeLabel?: string;
  no: number;
  label?: string;
  course?: string;
  month?: string;
  title: string;
  subtitle: string;
  accent: string;
  topicIds: string[];
  order: number;
  updatedAt: string;
}

export interface LearningContentSnapshot {
  storage: "cloudflare" | "indexedDB" | "localStorage";
  units: Unit[];
  catalogRecords: ContentCatalogRecord[];
  unitRecords: ContentUnitRecord[];
  topicRecords: ContentTopicRecord[];
  syncedAt: string;
}

type ContentMetaRecord = {
  id: string;
  syncedAt: string;
  version: number;
  unitCount: number;
  topicCount: number;
};

type SerializedContent = {
  catalogRecords: ContentCatalogRecord[];
  unitRecords: ContentUnitRecord[];
  topicRecords: ContentTopicRecord[];
  syncedAt: string;
};

const DB_NAME = "kang-taehoon-math-content-db";
const DB_VERSION = 2;
const UNIT_STORE = "units";
const TOPIC_STORE = "topics";
const META_STORE = "meta";
const META_KEY = "content-catalog";
const FALLBACK_KEY = "kang-math-content-db:snapshot";
const CLOUD_CONTENT_ENDPOINT = "/api/learning/content";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openContentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UNIT_STORE)) {
        db.createObjectStore(UNIT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(TOPIC_STORE)) {
        const store = db.createObjectStore(TOPIC_STORE, { keyPath: "id" });
        store.createIndex("unitId", "unitId", { unique: false });
        store.createIndex("generatorId", "generatorId", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function topicRecordId(unitId: string, topicId: string) {
  return `${unitId}:${topicId}`;
}

function contentCatalogSeeds(now: string): ContentCatalogRecord[] {
  return [
    {
      id: "elementary-math",
      subject: "math",
      schoolLevel: "elementary",
      category: "operation",
      title: "초등 수학 데이터베이스",
      description: "초등 연산과 앞으로 추가할 초등 개념서 콘텐츠를 저장합니다.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "middle-math",
      subject: "math",
      schoolLevel: "middle",
      category: "concept",
      title: "중등 수학 데이터베이스",
      description: "중등 연산, 개념, 유형, 고난이도 문제를 초등 수학과 분리 저장합니다.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "elementary-english",
      subject: "english",
      schoolLevel: "elementary",
      category: "word",
      title: "초등 영어 데이터베이스",
      description: "초등 영단어와 초등 영문법 콘텐츠를 저장합니다.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "middle-english",
      subject: "english",
      schoolLevel: "middle",
      category: "word",
      title: "중등 영어 데이터베이스",
      description: "중등 영단어와 중등 영문법 콘텐츠를 저장합니다.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "publisher-exam",
      subject: "english",
      schoolLevel: "middle",
      category: "publisher-exam",
      title: "내신 대비 출판사별 데이터베이스",
      description: "출판사별 내신 대비 자료를 과목 콘텐츠 DB와 분리해 관리합니다.",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function inferCatalogForUnit(unit: Unit) {
  const marker = `${unit.id} ${unit.label ?? ""} ${unit.course ?? ""} ${unit.title}`.toLowerCase();
  const subject: "math" | "english" = marker.includes("english") || marker.includes("영어") ? "english" : "math";
  const schoolLevel: "elementary" | "middle" = marker.includes("middle") || marker.includes("중등") ? "middle" : "elementary";
  const databaseId = `${schoolLevel}-${subject}`;
  return { databaseId, subject, schoolLevel };
}

function serializeUnits(units: Unit[]): SerializedContent {
  const syncedAt = new Date().toISOString();
  const catalogRecords = contentCatalogSeeds(syncedAt);
  const topicRecords: ContentTopicRecord[] = [];
  const unitRecords = units.map((unit, unitOrder) => {
    const catalog = inferCatalogForUnit(unit);
    const topics = unit.topics.map((topic, topicOrder) => {
      const id = topicRecordId(unit.id, topic.id);
      const record: ContentTopicRecord = {
        id,
        databaseId: catalog.databaseId,
        topicId: topic.id,
        unitId: unit.id,
        unitNo: unit.no,
        unitTitle: unit.title,
        title: topic.title,
        desc: topic.desc,
        learningLevel: topic.learningLevel ?? "beginner",
        learningArea: topic.learningArea,
        generatorId: topic.id,
        order: topicOrder,
        updatedAt: syncedAt,
      };
      topicRecords.push(record);
      return record;
    });

    return {
      id: unit.id,
      databaseId: catalog.databaseId,
      unitKey: unit.id,
      subject: catalog.subject,
      schoolLevel: catalog.schoolLevel,
      gradeLabel: unit.label ?? unit.course,
      no: unit.no,
      label: unit.label,
      course: unit.course,
      month: unit.month,
      title: unit.title,
      subtitle: unit.subtitle,
      accent: unit.accent,
      topicIds: topics.map((topic) => topic.id),
      order: unitOrder,
      updatedAt: syncedAt,
    };
  });

  return { catalogRecords, unitRecords, topicRecords, syncedAt };
}

function hydrateUnits(unitRecords: ContentUnitRecord[], topicRecords: ContentTopicRecord[]): Unit[] {
  const topicMap = new Map(topicRecords.map((topic) => [topic.id, topic]));
  return [...unitRecords]
    .sort((a, b) => a.order - b.order)
    .map((unit): Unit | null => {
      const topics = unit.topicIds
        .map((topicId) => topicMap.get(topicId))
        .filter((topic): topic is ContentTopicRecord => Boolean(topic))
        .sort((a, b) => a.order - b.order)
        .map((topic): Unit["topics"][number] | null => {
          const generate = GENERATORS[topic.generatorId] as (() => Problem) | undefined;
          if (!generate) return null;
          return {
            id: topic.topicId,
            title: topic.title,
            desc: topic.desc,
            learningLevel: topic.learningLevel ?? "beginner",
            ...(topic.learningArea ? { learningArea: topic.learningArea } : {}),
            generate,
          };
        })
        .filter((topic): topic is Unit["topics"][number] => topic !== null);

      if (!topics.length) return null;
      return {
        id: unit.id,
        no: unit.no,
        ...(unit.label ? { label: unit.label } : {}),
        ...(unit.course ? { course: unit.course } : {}),
        ...(unit.month ? { month: unit.month } : {}),
        title: unit.title,
        subtitle: unit.subtitle,
        accent: unit.accent,
        topics,
      };
    })
    .filter((unit): unit is Unit => unit !== null);
}

function snapshotFromSerialized(
  serialized: SerializedContent,
  storage: LearningContentSnapshot["storage"],
): LearningContentSnapshot {
  return {
    storage,
    units: hydrateUnits(serialized.unitRecords, serialized.topicRecords),
    catalogRecords: serialized.catalogRecords ?? contentCatalogSeeds(serialized.syncedAt),
    unitRecords: serialized.unitRecords,
    topicRecords: serialized.topicRecords,
    syncedAt: serialized.syncedAt,
  };
}

function getLocalStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readFallbackSnapshot() {
  try {
    const storage = getLocalStorage();
    if (!storage) return null;
    const raw = storage.getItem(FALLBACK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SerializedContent;
  } catch {
    return null;
  }
}

function writeFallbackSnapshot(serialized: SerializedContent) {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(FALLBACK_KEY, JSON.stringify(serialized));
}

async function loadCloudContentSnapshot(): Promise<SerializedContent | null> {
  if (!canUseCloudLearningDb()) return null;
  const response = await fetch(CLOUD_CONTENT_ENDPOINT, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await response.text());
  const payload = (await response.json()) as Partial<SerializedContent>;
  if (!payload.unitRecords?.length || !payload.topicRecords?.length) return null;
  return {
    catalogRecords: payload.catalogRecords ?? contentCatalogSeeds(payload.syncedAt ?? new Date().toISOString()),
    unitRecords: payload.unitRecords,
    topicRecords: payload.topicRecords,
    syncedAt: payload.syncedAt ?? new Date().toISOString(),
  };
}

async function saveCloudContentSnapshot(serialized: SerializedContent) {
  if (!canUseCloudLearningDb()) return false;
  const response = await fetch(CLOUD_CONTENT_ENDPOINT, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(serialized),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  return true;
}

export async function syncLearningContentDb(units: Unit[] = UNITS): Promise<LearningContentSnapshot> {
  const serialized = serializeUnits(units);

  try {
    const db = await openContentDb();
    const transaction = db.transaction([UNIT_STORE, TOPIC_STORE, META_STORE], "readwrite");
    const unitStore = transaction.objectStore(UNIT_STORE);
    const topicStore = transaction.objectStore(TOPIC_STORE);
    const metaStore = transaction.objectStore(META_STORE);
    unitStore.clear();
    topicStore.clear();

    for (const unit of serialized.unitRecords) unitStore.put(unit);
    for (const topic of serialized.topicRecords) topicStore.put(topic);
    metaStore.put({
      id: META_KEY,
      syncedAt: serialized.syncedAt,
      version: DB_VERSION,
      unitCount: serialized.unitRecords.length,
      topicCount: serialized.topicRecords.length,
    } satisfies ContentMetaRecord);

    await transactionDone(transaction);
    db.close();
    if (await saveCloudContentSnapshot(serialized).catch(() => false)) {
      return snapshotFromSerialized(serialized, "cloudflare");
    }
    return snapshotFromSerialized(serialized, "indexedDB");
  } catch {
    writeFallbackSnapshot(serialized);
    if (await saveCloudContentSnapshot(serialized).catch(() => false)) {
      return snapshotFromSerialized(serialized, "cloudflare");
    }
    return snapshotFromSerialized(serialized, "localStorage");
  }
}

export async function loadLearningContentSnapshot(): Promise<LearningContentSnapshot> {
  const cloudSnapshot = await loadCloudContentSnapshot().catch(() => null);
  if (cloudSnapshot) return snapshotFromSerialized(cloudSnapshot, "cloudflare");

  try {
    const db = await openContentDb();
    const transaction = db.transaction([UNIT_STORE, TOPIC_STORE, META_STORE], "readonly");
    const unitRequest = transaction.objectStore(UNIT_STORE).getAll();
    const topicRequest = transaction.objectStore(TOPIC_STORE).getAll();
    const metaRequest = transaction.objectStore(META_STORE).get(META_KEY);
    const [unitRecords, topicRecords, meta] = await Promise.all([
      requestToPromise<ContentUnitRecord[]>(unitRequest),
      requestToPromise<ContentTopicRecord[]>(topicRequest),
      requestToPromise<ContentMetaRecord | undefined>(metaRequest),
    ]);
    db.close();

    if (unitRecords.length && topicRecords.length) {
      return snapshotFromSerialized(
        {
          unitRecords,
          topicRecords,
          catalogRecords: contentCatalogSeeds(meta?.syncedAt ?? new Date().toISOString()),
          syncedAt: meta?.syncedAt ?? new Date().toISOString(),
        },
        "indexedDB",
      );
    }
  } catch {
    const fallback = readFallbackSnapshot();
    if (fallback) return snapshotFromSerialized(fallback, "localStorage");
  }

  return syncLearningContentDb(UNITS);
}
