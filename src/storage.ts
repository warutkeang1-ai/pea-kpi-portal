// ชั้นข้อมูล: แยกจาก UI — ถ้าจะใช้ฐานข้อมูลจริง ให้แก้เฉพาะ 2 ฟังก์ชันนี้
import seed from './data/links.json'
import type { PortalData } from './types'
   const h = (s: string) => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x.toString(36) }
   const KEY = 'pea-kpi-portal:' + h(JSON.stringify(seed))
export function loadData(): PortalData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const d = JSON.parse(raw); if (Array.isArray(d?.links)) return { banners: [], ...d } }
  } catch { /* ใช้ข้อมูลเริ่มต้น */ }
  return seed as PortalData
}
export function saveData(d: PortalData): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(d)); return true } catch { return false }
}
export function resetData() { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }
export function isSafeUrl(u: string): boolean {
  try { const p = new URL(u); return p.protocol === 'https:' || p.protocol === 'http:' } catch { return false }
}
