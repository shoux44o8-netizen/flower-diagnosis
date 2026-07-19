# Vercel Environment Variables

このファイルには**環境変数の名前と取得方法のみ**を記録します。
実際の値（URL・キー・シークレット）は保存しません。

## Required Variables

### SUPABASE_URL
取得先：Supabase → Settings → API → Project URL

### SUPABASE_ANON_KEY
取得先：Supabase → Settings → API → Publishable (anon) key

### SUPABASE_SERVICE_ROLE_KEY
取得先：Supabase → Settings → API → service_role key

### ADMIN_SECRET
用途：管理画面（admin.html）の認証用シークレット
設定先：Vercel → Project Settings → Environment Variables
