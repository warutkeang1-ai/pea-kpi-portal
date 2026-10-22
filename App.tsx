import { useEffect, useMemo, useState } from 'react'
import * as L from 'lucide-react'
import { LINK_TYPES, type KpiLink, type PortalData } from './types'
import { loadData, saveData, resetData, isSafeUrl } from './storage'

const ICONS: Record<string, L.LucideIcon> = {
  LayoutDashboard: L.LayoutDashboard, AppWindow: L.AppWindow, Globe: L.Globe, Package: L.Package,
  ClipboardList: L.ClipboardList, BarChart3: L.BarChart3, Users: L.Users, Gauge: L.Gauge,
  HardHat: L.HardHat, Building2: L.Building2, Zap: L.Zap, Link2: L.Link2,
  MessageCircle: L.MessageCircle, FolderOpen: L.FolderOpen,
}
const Icon = ({ name, size = 22 }: { name: string; size?: number }) => {
  const C = ICONS[name] ?? L.Link2
  return <C size={size} aria-hidden />
}
const tcls = (t: string) => ({ Dashboard: 'dash', Website: 'web', Application: 'app' } as Record<string, string>)[t] ?? 'oth'
const blank = (dept: string): KpiLink => ({ id: '', department: dept, name: '', description: '', url: '', type: 'Dashboard', icon: 'LayoutDashboard', order: 0, enabled: true })

export default function App() {
  const [data, setData] = useState<PortalData>(loadData)
  const [q, setQ] = useState(''); const [dept, setDept] = useState(''); const [type, setType] = useState('')
  const [grid, setGrid] = useState(false)
  // โหมดผู้ดูแล: เปิดด้วย #admin (เป็นเพียงการซ่อนปุ่ม ไม่ใช่ระบบความปลอดภัย)
  const [adminOn, setAdminOn] = useState(location.hash === '#admin')
  const [reorder, setReorder] = useState(false)
  const [edit, setEdit] = useState<KpiLink | null>(null)
  const [err, setErr] = useState('')
  const [delId, setDelId] = useState<string | null>(null)
  const [bnr, setBnr] = useState<string | null>(null)
  const [slide, setSlide] = useState(0)
  const [logoOk, setLogoOk] = useState(true)
  const [saveFail, setSaveFail] = useState(false)

  useEffect(() => { const f = () => setAdminOn(location.hash === '#admin'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  useEffect(() => { setSaveFail(!saveData(data)) }, [data])
  const nb = data.banners.length
  useEffect(() => { if (nb < 2) return; const t = setInterval(() => setSlide(s => (s + 1) % nb), 5000); return () => clearInterval(t) }, [nb])

  const sorted = useMemo(() => [...data.links].sort((a, b) => a.order - b.order), [data.links])
  const deptNames = useMemo(() => [...new Set([...data.departments.map(d => d.name), ...data.links.map(l => l.department)])], [data])
  const deptIcon = (n: string) => data.departments.find(d => d.name === n)?.icon ?? 'FolderOpen'
  const showAdminView = adminOn && reorder

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return sorted.filter(l => (l.enabled || showAdminView) && (!dept || l.department === dept) && (!type || l.type === type) &&
      (!s || [l.name, l.description, l.department].some(t => t.toLowerCase().includes(s))))
  }, [sorted, q, dept, type, showAdminView])
  const groups = deptNames.map(n => ({ n, items: shown.filter(l => l.department === n) })).filter(g => g.items.length)

  const update = (links: KpiLink[]) => setData(d => ({ ...d, links: links.map((l, i) => ({ ...l, order: i + 1 })) }))
  const move = (id: string, dir: -1 | 1) => { // เลื่อนภายในแผนกเดียวกัน
    const a = [...sorted], i = a.findIndex(l => l.id === id)
    let j = i + dir
    while (j >= 0 && j < a.length && a[j].department !== a[i].department) j += dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; update(a)
  }
  const submit = () => {
    if (!edit) return
    if (!edit.name.trim() || !edit.department.trim()) return setErr('กรุณากรอกชื่อแผนกและชื่อระบบ')
    if (edit.url.trim() && !isSafeUrl(edit.url.trim())) return setErr('URL ต้องขึ้นต้นด้วย http:// หรือ https:// และมีรูปแบบถูกต้อง')
    const item = { ...edit, name: edit.name.trim(), department: edit.department.trim(), url: edit.url.trim() }
    if (item.id) update(sorted.map(l => (l.id === item.id ? item : l)))
    else update([...sorted, { ...item, id: 'l' + Date.now().toString(36), isSample: false }])
    setEdit(null); setErr('')
  }
  const addBanner = () => {
    const u = (bnr ?? '').trim()
    if (!isSafeUrl(u)) return setErr('URL รูปแบนเนอร์ต้องขึ้นต้นด้วย http:// หรือ https://')
    setData(d => ({ ...d, banners: [...d.banners, u] })); setBnr(''); setErr('')
  }
  const clear = () => { setQ(''); setDept(''); setType('') }
  const logout = () => { setReorder(false); history.replaceState(null, '', location.pathname); setAdminOn(false) }

  const Card = ({ l }: { l: KpiLink }) => {
    const body = (<>
      <span className="ico"><Icon name={l.icon} /></span>
      <span className="txt"><b>{l.name}{l.isSample && <em className="sample">ตัวอย่าง</em>}</b><small>{l.description}</small>
        {!l.url && <small className="nolink">ยังไม่ได้กำหนดลิงก์</small>}</span>
      <span className="side"><span className={'badge ' + tcls(l.type)}>{l.type}</span>{l.url && <L.ExternalLink size={14} className="ext" aria-label="เปิดเว็บไซต์ในแท็บใหม่" />}</span></>)
    if (showAdminView) return (
      <div className={'card' + (l.enabled ? '' : ' dim')}>{body}
        <span className="acts">
          <button className="ib" aria-label="เลื่อนขึ้น" onClick={() => move(l.id, -1)}><L.ArrowUp size={16} /></button>
          <button className="ib" aria-label="เลื่อนลง" onClick={() => move(l.id, 1)}><L.ArrowDown size={16} /></button>
          <button className="ib" aria-label={l.enabled ? 'ซ่อน' : 'แสดง'} onClick={() => update(sorted.map(x => x.id === l.id ? { ...x, enabled: !x.enabled } : x))}>{l.enabled ? <L.Eye size={16} /> : <L.EyeOff size={16} />}</button>
          <button className="ib" aria-label="แก้ไข" onClick={() => { setEdit(l); setErr('') }}><L.Pencil size={16} /></button>
          <button className="ib red" aria-label="ลบ" onClick={() => setDelId(l.id)}><L.Trash2 size={16} /></button></span></div>)
    return isSafeUrl(l.url)
      ? <a className="card" href={l.url} target="_blank" rel="noopener noreferrer">{body}</a>
      : <div className="card off">{body}</div>
  }

  return (<>
    <header className="top"><div className="wrap hd">
      {logoOk ? <img className="logoimg" src="./logo.png" alt="PEA" onError={() => setLogoOk(false)} /> : <div className="logo" aria-label="PEA">PEA</div>}
      <div className="ttl"><h1>PEA Chumphae</h1><p>รวมลิงก์สำคัญการไฟฟ้าส่วนภูมิภาคสาขาชุมแพ</p></div>
      <button className="pill round" onClick={() => setGrid(g => !g)} aria-label={grid ? 'มุมมองรายการ' : 'มุมมองการ์ด'}>{grid ? <L.List size={17} /> : <L.LayoutGrid size={17} />}</button>
      {adminOn && <>
        <button className={'pill' + (reorder ? ' on' : '')} onClick={() => setReorder(r => !r)}><L.ArrowDownWideNarrow size={17} /><span className="hide-s">จัดลำดับ</span></button>
        <button className="pill" onClick={() => { setBnr(''); setErr('') }}><L.Image size={17} /><span className="hide-s">แบนเนอร์</span></button>
        <button className="pill main" onClick={() => { setEdit(blank(dept || deptNames[0] || '')); setErr('') }}><L.Plus size={18} /><span className="hide-s">เพิ่มลิงก์</span></button>
        <button className="pill round out" onClick={logout} aria-label="ออกจากโหมดผู้ดูแล"><L.LogOut size={17} /></button></>}
    </div></header>

    <main className="wrap">
      {nb > 0 && <div className="banner" aria-label="แบนเนอร์">
        <img src={data.banners[slide % nb]} alt={`แบนเนอร์ ${slide % nb + 1}`} />
        {nb > 1 && <div className="dots">{data.banners.map((_, i) => <button key={i} aria-label={`แบนเนอร์ ${i + 1}`} className={i === slide % nb ? 'cur' : ''} onClick={() => setSlide(i)} />)}</div>}</div>}

      <section className="filters" aria-label="ค้นหาและกรอง">
        <label className="srch"><L.Search size={18} aria-hidden /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อระบบ คำอธิบาย หรือแผนก" aria-label="ค้นหา" /></label>
        <select value={dept} onChange={e => setDept(e.target.value)} aria-label="เลือกแผนก"><option value="">ทุกแผนก</option>{deptNames.map(n => <option key={n}>{n}</option>)}</select>
        <select value={type} onChange={e => setType(e.target.value)} aria-label="ประเภทระบบ"><option value="">ทุกประเภท</option>{LINK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <button className="pill" onClick={clear}>ล้างตัวกรอง</button>
      </section>
      <p className="count" role="status">พบ {shown.length} รายการ</p>

      {showAdminView && <div className="toolbar">
        <p className="note">โหมดจัดลำดับ: ใช้ปุ่มลูกศรเลื่อนภายในแผนก · ข้อมูลเก็บใน LocalStorage ของเครื่องนี้ ไม่ซิงก์ข้ามเครื่อง</p>
        {saveFail && <p className="error">บันทึกลงเบราว์เซอร์ไม่ได้</p>}
        <button className="pill" onClick={() => navigator.clipboard?.writeText(JSON.stringify(data, null, 1))}><L.Copy size={16} />คัดลอก JSON</button>
        <button className="pill" onClick={() => { if (confirm('คืนค่าข้อมูลเริ่มต้น? ข้อมูลที่แก้ไขจะหายทั้งหมด')) { resetData(); setData(loadData()) } }}>คืนค่าเริ่มต้น</button></div>}

      {groups.length === 0 && <div className="empty"><L.SearchX size={36} /><p>ไม่พบรายการที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p></div>}
      {groups.map(g => (
        <section key={g.n} className="group"><h2><span className="fold"><Icon name={deptIcon(g.n)} size={20} /></span>{g.n}</h2>
          <div className={grid ? 'list grid' : 'list'}>{g.items.map(l => <Card key={l.id} l={l} />)}</div></section>))}
      <footer>รายการที่มีป้าย “ตัวอย่าง” เป็นข้อมูลสาธิต · พอร์ทัลนี้รวมลิงก์เท่านั้น ไม่ตรวจสอบสถานะเว็บไซต์ปลายทาง</footer>
    </main>

    {bnr !== null && <div className="ov" role="dialog" aria-modal="true" aria-label="จัดการแบนเนอร์"><div className="modal">
      <h3>แบนเนอร์</h3>
      <ul className="adm">{data.banners.map((b, i) => <li key={i}><span className="an">{b}</span>
        <button className="ib red" aria-label="ลบแบนเนอร์" onClick={() => setData(d => ({ ...d, banners: d.banners.filter((_, k) => k !== i) }))}><L.Trash2 size={16} /></button></li>)}
        {nb === 0 && <li>ยังไม่มีแบนเนอร์</li>}</ul>
      <label>URL รูปภาพ (https://...)<input type="url" value={bnr} onChange={e => setBnr(e.target.value)} /></label>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="row end"><button className="pill" onClick={() => { setBnr(null); setErr('') }}>ปิด</button><button className="pill main" onClick={addBanner}>เพิ่มรูป</button></div>
    </div></div>}

    {edit && <div className="ov" role="dialog" aria-modal="true" aria-label="แบบฟอร์มลิงก์"><div className="modal">
      <h3>{edit.id ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์'}</h3>
      <label>ชื่อแผนก<input list="depts" value={edit.department} onChange={e => setEdit({ ...edit, department: e.target.value })} /></label>
      <datalist id="depts">{deptNames.map(n => <option key={n} value={n} />)}</datalist>
      <label>ชื่อระบบ KPI<input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></label>
      <label>คำอธิบาย<textarea rows={2} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} /></label>
      <label>URL เว็บไซต์ปลายทาง (เว้นว่างได้)<input type="url" placeholder="https://" value={edit.url} onChange={e => setEdit({ ...edit, url: e.target.value })} /></label>
      <div className="two"><label>ประเภท<select value={edit.type} onChange={e => setEdit({ ...edit, type: e.target.value as KpiLink['type'] })}>{LINK_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label>ไอคอน<select value={edit.icon} onChange={e => setEdit({ ...edit, icon: e.target.value })}>{Object.keys(ICONS).map(k => <option key={k}>{k}</option>)}</select></label></div>
      <label className="chk"><input type="checkbox" checked={edit.enabled} onChange={e => setEdit({ ...edit, enabled: e.target.checked })} />เปิดใช้งาน (แสดงในหน้าหลัก)</label>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="row end"><button className="pill" onClick={() => { setEdit(null); setErr('') }}>ยกเลิก</button><button className="pill main" onClick={submit}>บันทึก</button></div>
    </div></div>}

    {delId && <div className="ov" role="alertdialog" aria-modal="true"><div className="modal">
      <h3>ยืนยันการลบ</h3><p>ต้องการลบรายการนี้ใช่หรือไม่? (หากต้องการเก็บไว้ ให้ใช้ปุ่มซ่อนแทน)</p>
      <div className="row end"><button className="pill" onClick={() => setDelId(null)}>ยกเลิก</button>
        <button className="pill redfill" onClick={() => { update(sorted.filter(l => l.id !== delId)); setDelId(null) }}>ลบ</button></div>
    </div></div>}
  </>)
}
