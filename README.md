# Agent Kariyeri

Mobil odaklı futbol ajanlığı simülasyonu. Scout, pazarlık, saygınlık, yaşam faaliyetleri, etkinlik kartları, haftalık simülasyon, offline kayıt ve fan data pack import akışını içerir.

## Kurulum

```bash
npm install
npm run start
```

Android veya iOS için Expo ekranındaki yönergeleri izleyin.

## Test

```bash
npm run test:engine
npm run test:platform
npm run test:datapack
npm run test:save
npm run test:smoke
npm run test:all
npx tsc --noEmit
```

Full local release check:

```bash
npm run release:check
npm audit --audit-level=moderate
```

`release:check` runs the engine test, TypeScript check, and GitHub Pages web export. `npm audit` is kept separate because Expo/React Native security fixes can require breaking SDK upgrades.

## Web Build

Normal web export:

```bash
npm run build:web
```

GitHub Pages için export:

```bash
npm run build:web:pages
```

`build:web:pages`, Expo export sonrası `dist/` içindeki asset yollarını GitHub Pages repo adreslerinde çalışacak şekilde relative path'e çevirir ve `.nojekyll` dosyası ekler.

## GitHub Pages Deploy

Repo GitHub'a gönderildikten sonra `.github/workflows/deploy-web.yml` otomatik çalışır.

GitHub tarafında:

1. Repository Settings aç.
2. Pages bölümüne gir.
3. Source olarak `GitHub Actions` seç.
4. `main` branch'e push yap.
5. Actions bittikten sonra Pages URL'i deploy job içinde görünür.

Bu bilgisayarda şu an proje klasörü git repo değilse önce Git kurulu olmalı ve repo başlatılmalı:

```bash
git init
git branch -M main
git add .
git commit -m "Initial Football Agent web build"
git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
git push -u origin main
```

## Fan Data Pack

Oyun gerçek takım/oyuncu verisi dağıtmaz. Kullanıcılar kendi data pack dosyalarını `.zip` olarak içe aktarabilir.

Zip içinde en az şu dosyalar olmalı:

- `manifest.json`
- `database.json`

Opsiyonel görseller daha sonra `assets/` altında desteklenecek şekilde genişletilebilir.
