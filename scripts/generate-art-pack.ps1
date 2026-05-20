param(
  [string]$OutDir = "assets/art"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function C([string]$Hex) {
  $hex = $Hex.TrimStart("#")
  if ($hex.Length -eq 6) {
    return [System.Drawing.Color]::FromArgb(
      [Convert]::ToInt32($hex.Substring(0, 2), 16),
      [Convert]::ToInt32($hex.Substring(2, 2), 16),
      [Convert]::ToInt32($hex.Substring(4, 2), 16)
    )
  }
  return [System.Drawing.Color]::FromArgb(
    [Convert]::ToInt32($hex.Substring(0, 2), 16),
    [Convert]::ToInt32($hex.Substring(2, 2), 16),
    [Convert]::ToInt32($hex.Substring(4, 2), 16),
    [Convert]::ToInt32($hex.Substring(6, 2), 16)
  )
}

function Brush([string]$Hex) {
  return [System.Drawing.SolidBrush]::new((C $Hex))
}

function PenC([string]$Hex, [int]$Width = 1) {
  return [System.Drawing.Pen]::new((C $Hex), $Width)
}

function FillRect($g, [string]$hex, [int]$x, [int]$y, [int]$w, [int]$h) {
  $b = Brush $hex
  $g.FillRectangle($b, $x, $y, $w, $h)
  $b.Dispose()
}

function FillEllipse($g, [string]$hex, [int]$x, [int]$y, [int]$w, [int]$h) {
  $b = Brush $hex
  $g.FillEllipse($b, $x, $y, $w, $h)
  $b.Dispose()
}

function FillPoly($g, [string]$hex, [object[]]$points) {
  $b = Brush $hex
  $pts = $points | ForEach-Object { [System.Drawing.Point]::new($_[0], $_[1]) }
  $g.FillPolygon($b, [System.Drawing.Point[]]$pts)
  $b.Dispose()
}

function DrawLine($g, [string]$hex, [int]$width, [int]$x1, [int]$y1, [int]$x2, [int]$y2) {
  $p = PenC $hex $width
  $g.DrawLine($p, $x1, $y1, $x2, $y2)
  $p.Dispose()
}

function Save-Png($bmp, [string]$path) {
  $dir = Split-Path -Parent $path
  Ensure-Dir $dir
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-Canvas([int]$w, [int]$h) {
  $bmp = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  return @($bmp, $g)
}

function Draw-PixelPortrait([string]$path, [hashtable]$p) {
  $canvas = New-Canvas 256 256
  $bmp = $canvas[0]
  $g = $canvas[1]
  FillRect $g $p.bg 0 0 256 256
  FillRect $g "#07120d" 0 174 256 82
  FillRect $g $p.accent 0 0 256 8
  FillRect $g "#00000055" 18 198 220 34
  FillEllipse $g "#ffffff18" 24 18 208 208

  FillRect $g $p.kit 44 156 168 86
  FillRect $g $p.kit2 110 156 36 86
  FillRect $g "#07120d" 44 228 168 14
  FillRect $g $p.accent 68 164 22 10
  FillRect $g $p.skin 112 136 34 30
  FillRect $g $p.skin 78 58 100 92
  FillRect $g $p.shadow 78 132 100 18
  FillRect $g $p.hair 70 48 116 32

  switch ($p.hairStyle) {
    1 {
      FillRect $g $p.hair 62 62 30 56
      FillRect $g $p.hair 158 62 28 44
    }
    2 {
      FillRect $g $p.hair 68 44 78 22
      FillRect $g $p.hair 74 36 64 16
    }
    3 {
      FillRect $g $p.hair 72 46 108 18
      FillRect $g $p.hair 150 60 36 32
    }
    default {
      FillRect $g $p.hair 78 40 92 20
    }
  }

  FillRect $g "#ffffff" 99 96 13 9
  FillRect $g "#ffffff" 144 96 13 9
  FillRect $g $p.eye 103 98 6 6
  FillRect $g $p.eye 148 98 6 6
  FillRect $g $p.shadow 126 108 8 24
  FillRect $g $p.mouth 111 132 36 7
  FillRect $g "#00000060" 60 242 136 6
  FillRect $g "#ffffff22" 22 22 6 190
  Save-Png $bmp $path
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-Crest([string]$path, [hashtable]$p) {
  $canvas = New-Canvas 256 256
  $bmp = $canvas[0]
  $g = $canvas[1]
  $g.Clear([System.Drawing.Color]::Transparent)
  FillEllipse $g "#00000044" 18 26 220 216
  FillPoly $g $p.border @(@(44,24), @(212,24), @(226,92), @(198,208), @(128,238), @(58,208), @(30,92))
  FillPoly $g $p.primary @(@(56,38), @(200,38), @(212,96), @(188,196), @(128,222), @(68,196), @(44,96))
  FillPoly $g $p.secondary @(@(56,38), @(104,38), @(82,198), @(68,196), @(44,96))
  FillRect $g "#ffffff20" 62 52 132 12
  FillRect $g "#00000028" 60 186 136 12

  switch ($p.symbol) {
    "wing" {
      FillPoly $g "#f8fafc" @(@(76,126), @(126,82), @(178,126), @(144,126), @(128,158), @(110,126))
      FillPoly $g $p.accent @(@(94,126), @(128,100), @(162,126), @(140,126), @(128,144), @(116,126))
    }
    "lion" {
      FillEllipse $g $p.accent 82 74 92 92
      FillEllipse $g "#f8fafc" 102 92 52 54
      FillRect $g "#111827" 108 112 10 10
      FillRect $g "#111827" 138 112 10 10
      FillRect $g "#111827" 124 130 12 8
    }
    "anchor" {
      DrawLine $g "#f8fafc" 12 128 78 128 168
      FillEllipse $g $p.accent 112 58 32 32
      DrawLine $g "#f8fafc" 10 86 164 170 164
      DrawLine $g "#f8fafc" 10 86 164 66 142
      DrawLine $g "#f8fafc" 10 170 164 190 142
    }
    "tower" {
      FillRect $g "#f8fafc" 90 72 76 110
      FillRect $g $p.accent 100 88 18 22
      FillRect $g $p.accent 138 88 18 22
      FillRect $g $p.primary 116 138 24 44
      FillRect $g "#f8fafc" 80 64 96 20
    }
    "bolt" {
      FillPoly $g "#fbbf24" @(@(140,54), @(82,136), @(126,136), @(106,198), @(176,106), @(134,106))
    }
    "wave" {
      FillEllipse $g "#7dd3fc" 62 96 132 58
      FillRect $g $p.primary 60 94 138 30
      FillEllipse $g "#f8fafc" 90 112 76 28
      FillRect $g $p.primary 92 110 78 14
    }
    "crown" {
      FillPoly $g "#fbbf24" @(@(70,132), @(90,82), @(116,126), @(128,78), @(148,126), @(174,82), @(192,132))
      FillRect $g "#f8fafc" 74 132 114 28
    }
    default {
      FillEllipse $g "#f8fafc" 82 82 92 92
      FillEllipse $g $p.accent 104 104 48 48
    }
  }

  Save-Png $bmp $path
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-StoryScene([string]$path, [string]$scene) {
  $canvas = New-Canvas 768 1024
  $bmp = $canvas[0]
  $g = $canvas[1]
  FillRect $g "#07120d" 0 0 768 1024
  FillRect $g "#0f172a" 0 0 768 420
  FillRect $g "#113b25" 0 420 768 604
  for ($i = 0; $i -lt 14; $i++) {
    FillRect $g ($(if ($i % 2 -eq 0) { "#0d2a1d" } else { "#14532d" })) ($i * 58) 420 58 604
  }
  DrawLine $g "#ffffff44" 8 384 420 384 1024
  FillEllipse $g "#ffffff25" 248 620 272 272

  if ($scene -eq "lobby") {
    FillRect $g "#1f2937" 90 120 588 250
    FillRect $g "#fbbf24" 114 146 180 18
    FillRect $g "#0b1827" 362 150 220 160
    FillRect $g "#7dd3fc" 388 176 168 38
    Draw-Person $g 220 500 "#22c55e" "#d8a47f" "#111827" 1
    Draw-Person $g 540 470 "#f8fafc" "#c68662" "#18181b" 2
    FillRect $g "#00000066" 132 820 500 34
  } elseif ($scene -eq "rejection") {
    FillRect $g "#21150b" 76 128 616 292
    FillRect $g "#fbbf24" 136 172 420 18
    FillRect $g "#2a210f" 122 332 524 70
    Draw-Person $g 228 565 "#22c55e" "#d8a47f" "#111827" 1
    Draw-Person $g 506 470 "#f8fafc" "#c68662" "#18181b" 3
    DrawLine $g "#f97316" 10 346 520 430 620
    DrawLine $g "#f97316" 10 430 520 346 620
  } else {
    FillRect $g "#0b1827" 66 120 636 284
    FillRect $g "#7dd3fc" 112 166 524 26
    Draw-Person $g 170 560 "#22c55e" "#d8a47f" "#111827" 1
    Draw-Person $g 360 560 "#38bdf8" "#8d5524" "#2f1b10" 2
    Draw-Person $g 550 560 "#f97316" "#f1c27d" "#111827" 3
    FillRect $g "#fbbf24" 108 792 552 18
    FillRect $g "#00000066" 132 840 500 34
  }

  Save-Png $bmp $path
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-Person($g, [int]$x, [int]$y, [string]$kit, [string]$skin, [string]$hair, [int]$pose) {
  FillRect $g $skin ($x + 34) ($y - 122) 46 34
  FillRect $g $kit ($x + 10) ($y - 86) 92 112
  FillRect $g $hair ($x + 28) ($y - 138) 58 28
  FillRect $g $skin ($x + 22) ($y - 150) 70 64
  FillRect $g "#ffffff" ($x + 40) ($y - 122) 10 8
  FillRect $g "#ffffff" ($x + 66) ($y - 122) 10 8
  FillRect $g "#111827" ($x + 44) ($y - 120) 5 5
  FillRect $g "#111827" ($x + 70) ($y - 120) 5 5
  FillRect $g "#0f172a" ($x + 24) ($y + 24) 30 76
  FillRect $g "#0f172a" ($x + 62) ($y + 24) 30 76
  FillRect $g "#fbbf24" ($x + 16) ($y + 96) 42 14
  FillRect $g "#fbbf24" ($x + 58) ($y + 96) 42 14
  if ($pose -eq 2) {
    DrawLine $g $skin 18 ($x + 10) ($y - 54) ($x - 42) ($y - 96)
    DrawLine $g $skin 18 ($x + 102) ($y - 54) ($x + 154) ($y - 96)
  } elseif ($pose -eq 3) {
    DrawLine $g $skin 18 ($x + 10) ($y - 54) ($x - 30) ($y - 36)
    DrawLine $g $skin 18 ($x + 102) ($y - 54) ($x + 148) ($y - 40)
  } else {
    DrawLine $g $skin 18 ($x + 10) ($y - 54) ($x - 28) ($y - 8)
    DrawLine $g $skin 18 ($x + 102) ($y - 54) ($x + 130) ($y - 4)
  }
}

function Draw-MatchBackground([string]$path) {
  $canvas = New-Canvas 900 1600
  $bmp = $canvas[0]
  $g = $canvas[1]
  FillRect $g "#020617" 0 0 900 1600
  FillRect $g "#0b1827" 0 0 900 360
  for ($i = 0; $i -lt 12; $i++) {
    FillRect $g ($(if ($i % 2 -eq 0) { "#104a2d" } else { "#0b3d27" })) ($i * 75) 360 75 1240
  }
  FillRect $g "#ffffff33" 438 360 8 1240
  FillEllipse $g "#ffffff26" 270 660 360 360
  FillRect $g "#ffffff33" 120 360 660 8
  FillRect $g "#ffffff33" 120 1500 660 8
  FillRect $g "#ffffff33" 240 360 420 140
  FillRect $g "#ffffff33" 240 1360 420 140
  for ($i = 0; $i -lt 8; $i++) {
    FillEllipse $g "#f8fafc33" (80 + $i * 105) 80 48 48
    DrawLine $g "#f8fafc22" 6 (104 + $i * 105) 128 (360 + (($i % 3) * 80)) 520
  }
  FillRect $g "#00000055" 0 0 900 1600
  FillRect $g "#fbbf2444" 0 0 900 10
  Save-Png $bmp $path
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-CardIcon([string]$path, [string]$kind, [string]$primary, [string]$secondary) {
  $canvas = New-Canvas 512 512
  $bmp = $canvas[0]
  $g = $canvas[1]
  FillRect $g "#0f172a" 0 0 512 512
  FillEllipse $g "#ffffff12" 46 46 420 420
  FillRect $g $primary 38 38 436 28
  FillRect $g $secondary 86 380 340 36

  switch ($kind) {
    "media" {
      FillRect $g "#e2e8f0" 210 116 92 184
      FillEllipse $g $secondary 182 86 148 148
      FillRect $g "#111827" 236 290 40 86
    }
    "holiday" {
      FillRect $g "#f8fafc" 150 170 214 160
      FillRect $g $secondary 180 136 154 46
      FillRect $g "#111827" 164 206 28 94
      FillRect $g "#111827" 320 206 28 94
    }
    "secret" {
      FillRect $g "#e2e8f0" 128 244 112 46
      FillRect $g "#e2e8f0" 272 244 112 46
      FillRect $g $secondary 224 226 64 74
    }
    "family" {
      FillPoly $g $secondary @(@(116,250), @(256,126), @(396,250))
      FillRect $g "#f8fafc" 146 246 220 134
      FillRect $g "#111827" 238 302 38 78
    }
    "sponsor" {
      FillPoly $g "#f8fafc" @(@(126,236), @(338,154), @(338,358), @(126,282))
      FillRect $g $secondary 110 226 52 76
      FillRect $g "#111827" 180 300 42 72
    }
    "tournament" {
      FillRect $g "#fbbf24" 204 146 104 170
      FillEllipse $g "#fbbf24" 172 112 168 112
      FillRect $g "#f8fafc" 184 330 144 36
    }
    "legend" {
      FillPoly $g "#fbbf24" @(@(256,92), @(302,202), @(420,212), @(330,290), @(360,404), @(256,340), @(152,404), @(182,290), @(92,212), @(210,202))
    }
    "finance" {
      FillRect $g "#f8fafc" 126 132 42 236
      FillRect $g $secondary 214 214 42 154
      FillRect $g "#fbbf24" 302 162 42 206
      DrawLine $g "#86efac" 14 122 316 220 238
      DrawLine $g "#86efac" 14 220 238 326 144
    }
    "car" {
      FillRect $g $secondary 126 238 260 76
      FillPoly $g "#f8fafc" @(@(178,238), @(220,184), @(316,184), @(358,238))
      FillEllipse $g "#111827" 160 298 58 58
      FillEllipse $g "#111827" 300 298 58 58
    }
    "crisis" {
      FillRect $g "#ef4444" 178 206 156 156
      FillEllipse $g "#fbbf24" 158 106 196 196
      FillRect $g "#111827" 238 164 36 116
      FillRect $g "#111827" 238 302 36 36
    }
    "data" {
      FillRect $g "#f8fafc" 148 112 216 288
      FillPoly $g $secondary @(@(292,112), @(364,184), @(292,184))
      FillRect $g "#111827" 178 222 156 24
      FillRect $g "#111827" 178 272 156 24
    }
    default {
      FillEllipse $g $secondary 154 138 204 204
      FillRect $g "#f8fafc" 224 190 64 132
    }
  }

  Save-Png $bmp $path
  $g.Dispose()
  $bmp.Dispose()
}

$root = Join-Path (Get-Location) $OutDir
Ensure-Dir $root
Ensure-Dir (Join-Path $root "players")
Ensure-Dir (Join-Path $root "clubs")
Ensure-Dir (Join-Path $root "story")
Ensure-Dir (Join-Path $root "backgrounds")
Ensure-Dir (Join-Path $root "cards")

$players = @(
  @{ bg="#10251b"; accent="#86efac"; kit="#166534"; kit2="#bbf7d0"; skin="#d8a47f"; shadow="#b36a4c"; hair="#111827"; eye="#111827"; mouth="#7f1d1d"; hairStyle=0 },
  @{ bg="#0b1827"; accent="#7dd3fc"; kit="#1d4ed8"; kit2="#dbeafe"; skin="#8d5524"; shadow="#6f3f1f"; hair="#0f172a"; eye="#020617"; mouth="#431407"; hairStyle=1 },
  @{ bg="#201631"; accent="#c084fc"; kit="#6d28d9"; kit2="#f5d0fe"; skin="#f1c27d"; shadow="#c68662"; hair="#2f1b10"; eye="#111827"; mouth="#7f1d1d"; hairStyle=2 },
  @{ bg="#261f12"; accent="#fbbf24"; kit="#f97316"; kit2="#fff7ed"; skin="#e0ac69"; shadow="#b36a4c"; hair="#18181b"; eye="#111827"; mouth="#7f1d1d"; hairStyle=3 },
  @{ bg="#24131b"; accent="#fb7185"; kit="#be123c"; kit2="#fecdd3"; skin="#c68662"; shadow="#8d5524"; hair="#111827"; eye="#020617"; mouth="#4c0519"; hairStyle=1 },
  @{ bg="#062b16"; accent="#22c55e"; kit="#052e16"; kit2="#86efac"; skin="#ffdbac"; shadow="#e0ac69"; hair="#3b2416"; eye="#111827"; mouth="#7f1d1d"; hairStyle=2 },
  @{ bg="#10251b"; accent="#38bdf8"; kit="#0f766e"; kit2="#ccfbf1"; skin="#8d5524"; shadow="#6f3f1f"; hair="#0f172a"; eye="#020617"; mouth="#431407"; hairStyle=0 },
  @{ bg="#1e293b"; accent="#f8fafc"; kit="#334155"; kit2="#fbbf24"; skin="#d8a47f"; shadow="#c68662"; hair="#7c2d12"; eye="#111827"; mouth="#7f1d1d"; hairStyle=3 },
  @{ bg="#172554"; accent="#93c5fd"; kit="#1e40af"; kit2="#bfdbfe"; skin="#c68662"; shadow="#8d5524"; hair="#111827"; eye="#020617"; mouth="#431407"; hairStyle=2 },
  @{ bg="#3f2d12"; accent="#fde68a"; kit="#854d0e"; kit2="#fef3c7"; skin="#f1c27d"; shadow="#c68662"; hair="#18181b"; eye="#111827"; mouth="#7f1d1d"; hairStyle=1 },
  @{ bg="#0f172a"; accent="#a7f3d0"; kit="#047857"; kit2="#ecfdf5"; skin="#8d5524"; shadow="#6f3f1f"; hair="#2f1b10"; eye="#020617"; mouth="#431407"; hairStyle=3 },
  @{ bg="#2a1111"; accent="#fca5a5"; kit="#991b1b"; kit2="#fee2e2"; skin="#ffdbac"; shadow="#e0ac69"; hair="#111827"; eye="#111827"; mouth="#7f1d1d"; hairStyle=0 }
)

for ($i = 0; $i -lt $players.Count; $i++) {
  Draw-PixelPortrait (Join-Path $root ("players/portrait-{0:D2}.png" -f ($i + 1))) $players[$i]
}

$crests = @(
  @{ primary="#14532d"; secondary="#86efac"; accent="#fbbf24"; border="#052e16"; symbol="wing" },
  @{ primary="#7f1d1d"; secondary="#fecaca"; accent="#fbbf24"; border="#450a0a"; symbol="lion" },
  @{ primary="#0f766e"; secondary="#ccfbf1"; accent="#38bdf8"; border="#042f2e"; symbol="anchor" },
  @{ primary="#1d4ed8"; secondary="#dbeafe"; accent="#fbbf24"; border="#172554"; symbol="tower" },
  @{ primary="#4c1d95"; secondary="#ddd6fe"; accent="#fbbf24"; border="#2e1065"; symbol="bolt" },
  @{ primary="#064e3b"; secondary="#a7f3d0"; accent="#7dd3fc"; border="#022c22"; symbol="wave" },
  @{ primary="#92400e"; secondary="#fef3c7"; accent="#fbbf24"; border="#451a03"; symbol="crown" },
  @{ primary="#334155"; secondary="#f8fafc"; accent="#38bdf8"; border="#0f172a"; symbol="orb" },
  @{ primary="#9f1239"; secondary="#ffe4e6"; accent="#fb7185"; border="#4c0519"; symbol="wing" },
  @{ primary="#166534"; secondary="#dcfce7"; accent="#22c55e"; border="#052e16"; symbol="tower" }
)

for ($i = 0; $i -lt $crests.Count; $i++) {
  Draw-Crest (Join-Path $root ("clubs/crest-{0:D2}.png" -f ($i + 1))) $crests[$i]
}

Draw-StoryScene (Join-Path $root "story/story-lobby.png") "lobby"
Draw-StoryScene (Join-Path $root "story/story-office-rejection.png") "rejection"
Draw-StoryScene (Join-Path $root "story/story-third-league-prospects.png") "prospects"
Draw-MatchBackground (Join-Path $root "backgrounds/match-night-pixel.png")

$icons = @(
  @("card-media.png", "media", "#38bdf8", "#fbbf24"),
  @("card-holiday.png", "holiday", "#22c55e", "#f97316"),
  @("card-secret.png", "secret", "#64748b", "#fbbf24"),
  @("card-family.png", "family", "#86efac", "#38bdf8"),
  @("card-sponsor.png", "sponsor", "#f59e0b", "#22c55e"),
  @("card-tournament.png", "tournament", "#7dd3fc", "#fbbf24"),
  @("card-legend.png", "legend", "#a855f7", "#fbbf24"),
  @("card-finance.png", "finance", "#14b8a6", "#fbbf24"),
  @("card-car.png", "car", "#ef4444", "#fbbf24"),
  @("card-crisis.png", "crisis", "#ef4444", "#fbbf24"),
  @("card-data.png", "data", "#3b82f6", "#86efac"),
  @("card-agent.png", "agent", "#22c55e", "#7dd3fc")
)

foreach ($icon in $icons) {
  Draw-CardIcon (Join-Path $root ("cards/" + $icon[0])) $icon[1] $icon[2] $icon[3]
}

Write-Host "Generated Football Agent art pack in $root"
