export type LinkType = 'Dashboard' | 'Application' | 'Website' | 'อื่น ๆ'
export const LINK_TYPES: LinkType[] = ['Dashboard', 'Application', 'Website', 'อื่น ๆ']
export interface KpiLink {
  id: string; department: string; name: string; description: string
  url: string; type: LinkType; icon: string; order: number; enabled: boolean; isSample?: boolean
}
export interface Department { name: string; icon: string }
export interface PortalData { departments: Department[]; links: KpiLink[]; banners: string[] }
