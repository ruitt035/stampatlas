import { uid } from "./utils.js"

const DB_NAME = "stamp-atlas"
const DB_VERSION = 1

let dbp = null

function open() {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("records")) {
        const s = db.createObjectStore("records", { keyPath: "id" })
        s.createIndex("createdAt", "createdAt", { unique: false })
        s.createIndex("updatedAt", "updatedAt", { unique: false })
      }
      if (!db.objectStoreNames.contains("images")) {
        const s = db.createObjectStore("images", { keyPath: "id" })
        s.createIndex("recordId", "recordId", { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}

async function tx(store, mode, run) {
  const db = await open()
  return await new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const s = t.objectStore(store)
    Promise.resolve(run(s, t))
      .then((v) => resolve(v))
      .catch((e) => reject(e))
    t.onerror = () => reject(t.error)
  })
}

function reqp(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function listRecords() {
  const records = await tx("records", "readonly", (s) => reqp(s.getAll()))
  records.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
  return records
}

export async function getRecord(id) {
  return await tx("records", "readonly", (s) => reqp(s.get(id)))
}

export async function putRecord(partial) {
  const now = new Date().toISOString()
  const record = {
    id: partial.id ?? uid(),
    lng: partial.lng,
    lat: partial.lat,
    title: partial.title ?? "未命名",
    note: partial.note ?? "",
    address: partial.address ?? "",
    country: partial.country ?? "",
    province: partial.province ?? "",
    theme: partial.theme ?? "blue",
    imageIds: Array.isArray(partial.imageIds) ? partial.imageIds : [],
    firstSavedAt: partial.firstSavedAt ?? "",
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  }
  await tx("records", "readwrite", (s) => reqp(s.put(record)))
  return record
}

export async function deleteRecord(id) {
  const imageIds = await tx("images", "readonly", (s) =>
    reqp(s.index("recordId").getAllKeys(id)),
  )
  await tx("records", "readwrite", (s) => reqp(s.delete(id)))
  if (imageIds?.length) {
    await tx("images", "readwrite", (s) => Promise.all(imageIds.map((k) => reqp(s.delete(k)))))
  }
}

export async function addImage(recordId, blob, mime) {
  const img = {
    id: uid(),
    recordId,
    mime: mime || blob.type || "image/jpeg",
    size: blob.size ?? 0,
    createdAt: new Date().toISOString(),
    blob,
  }
  await tx("images", "readwrite", (s) => reqp(s.put(img)))
  return img
}

export async function getImages(recordId) {
  const list = await tx("images", "readonly", (s) => reqp(s.index("recordId").getAll(recordId)))
  list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
  return list
}

export async function getImage(id) {
  return await tx("images", "readonly", (s) => reqp(s.get(id)))
}

export async function deleteImage(id) {
  await tx("images", "readwrite", (s) => reqp(s.delete(id)))
}

export async function clearAll() {
  await tx("records", "readwrite", (s) => reqp(s.clear()))
  await tx("images", "readwrite", (s) => reqp(s.clear()))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",")
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || "application/octet-stream"
  const bin = atob(data)
  const a = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i)
  return new Blob([a], { type: mime })
}

export async function exportJson() {
  const records = await listRecords()
  const images = []
  for (const r of records) {
    const imgs = await getImages(r.id)
    for (const it of imgs) {
      images.push({
        id: it.id,
        recordId: it.recordId,
        mime: it.mime,
        size: it.size,
        createdAt: it.createdAt,
        dataUrl: await blobToDataUrl(it.blob),
      })
    }
  }
  return {
    type: "stamp-atlas-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    images,
  }
}

export async function importJson(data, { mode = "merge" } = {}) {
  if (!data || data.type !== "stamp-atlas-export") throw new Error("文件格式不正确")
  if (mode === "replace") await clearAll()

  const existing = new Map((await listRecords()).map((r) => [r.id, r]))

  for (const r of data.records || []) {
    if (mode === "merge" && existing.has(r.id)) continue
    const record = {
      id: r.id ?? uid(),
      lng: r.lng,
      lat: r.lat,
      title: r.title ?? "未命名",
      note: r.note ?? "",
      address: r.address ?? "",
      country: r.country ?? "",
      province: r.province ?? "",
      theme: r.theme ?? "blue",
      imageIds: Array.isArray(r.imageIds) ? r.imageIds : [],
      firstSavedAt: r.firstSavedAt ?? "",
      createdAt: r.createdAt ?? new Date().toISOString(),
      updatedAt: r.updatedAt ?? r.createdAt ?? new Date().toISOString(),
    }
    await tx("records", "readwrite", (s) => reqp(s.put(record)))
  }

  const existingImages = new Set(
    await tx("images", "readonly", (s) => reqp(s.getAllKeys())).then((ks) => ks || []),
  )
  for (const it of data.images || []) {
    if (!it?.id || !it?.recordId || !it?.dataUrl) continue
    if (mode === "merge" && existingImages.has(it.id)) continue
    const blob = dataUrlToBlob(it.dataUrl)
    const img = {
      id: it.id,
      recordId: it.recordId,
      mime: it.mime || blob.type,
      size: it.size || blob.size,
      createdAt: it.createdAt || new Date().toISOString(),
      blob,
    }
    await tx("images", "readwrite", (s) => reqp(s.put(img)))
  }
}
