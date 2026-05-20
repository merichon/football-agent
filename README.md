# Football Agent

Mobil odakli futbol ajanligi simulasyonu. Scout, pazarlik, sayginlik, yasam faaliyetleri, etkinlik kartlari, haftalik simulasyon, offline kayit ve fan data pack import akislarini icerir.

## Kurulum

```bash
npm install
npm run start
```

Android, iOS veya web icin Expo ekranindaki yonergeleri izleyin.

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

`release:check` engine testlerini, TypeScript kontrolunu ve GitHub Pages web export akislarini calistirir. `npm audit` ayri tutulur; Expo/React Native guvenlik guncellemeleri bazen SDK yukseltmesi gerektirebilir.

## Web Build

Normal web export:

```bash
npm run build:web
```

GitHub Pages icin export:

```bash
npm run build:web:pages
```

`build:web:pages`, Expo export sonrasi `dist/` icindeki asset yollarini GitHub Pages repo adreslerinde calisacak sekilde relative path'e cevirir ve `.nojekyll` dosyasi ekler.

## GitHub Pages Deploy

Repo GitHub'a gonderildikten sonra `.github/workflows/deploy-web.yml` otomatik calisir.

GitHub tarafinda:

1. Repository Settings ac.
2. Pages bolumune gir.
3. Source olarak `GitHub Actions` sec.
4. `main` branch'e push yap.
5. Actions bittikten sonra Pages URL'i deploy job icinde gorunur.

## Fan Data Pack

Oyun resmi takim, oyuncu, logo veya fotograf verisi dagitmaz. Kullanicilar kendi data pack dosyalarini `.zip` olarak ice aktarabilir.

Zip icinde en az su dosyalar olmali:

- `manifest.json`
- `database.json`

Opsiyonel gorseller daha sonra `assets/` altinda desteklenecek sekilde genisletilebilir.
