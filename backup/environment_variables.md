# Vercel Environment Variables

このファイルには**環境変数の名前と取得方法のみ**を記録します。
実際の値（URL・キー・シークレット）は保存しません。

## Required Variables

### SUPABASE_URL
取得先：Supabase → Settings → API → Project URL

### SUPABASE_PUBLISHABLE_KEY
取得先：Supabase → Settings → API → Publishable (anon) key

互換名：`SUPABASE_ANON_KEY`でも動作します。

### SUPABASE_SECRET_KEY
取得先：Supabase → Settings → API → service_role key

互換名：`SUPABASE_SERVICE_ROLE_KEY`でも動作します。

### LOTTERY_ADMIN_PIN
用途：管理画面（admin.html）の認証用シークレット
設定先：Vercel → Project Settings → Environment Variables

互換名：`ADMIN_SECRET`でも動作します。

## Security

- 実際の値はGitHubやこのバックアップへ保存しないでください。
- `SUPABASE_SECRET_KEY`または`SUPABASE_SERVICE_ROLE_KEY`を、ブラウザ側のHTML・CSS・JavaScriptへ記載しないでください。
