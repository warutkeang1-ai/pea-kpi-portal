import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// base './' ทำให้ deploy บน GitHub Pages (โฟลเดอร์ย่อย) ได้
export default defineConfig({ plugins: [react()], base: './' })
