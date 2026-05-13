import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  env: {
    PROJECT_ROOT: path.resolve(process.cwd(), '..'),
  },
}

export default nextConfig
