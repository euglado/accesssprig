# AccessSprig

Discord üyelerinin “Bu kanalda neden dosya gönderemiyorum?” sorusunu kendi özel
izin raporlarıyla anlamalarına yardımcı olur. /accesssprig gerçek bir Discord
Gateway botudur; rapor yalnızca komutu kullanan üyeye görünür.

Helps Discord members understand questions such as “Why can't I attach a file
here?” through private reports about their own channel permissions. This is a
real Discord Gateway bot with a slash command and clickable Refresh/Close controls.

[Türkçe](#türkçe) · [English](#english) · [Gizlilik / Privacy](PRIVACY.md) ·
[Güvenlik / Security](SECURITY.md) · [Katkı / Contributing](CONTRIBUTING.md)

## Türkçe

### Amaç ve özellikler

- `/accesssprig` mevcut normal metin kanalında kendi izinlerinin özel raporunu açar.
  İsteğe bağlı `language` seçimi Türkçe/English; seçmezsen Discord dilin kullanılır,
  Türkçe dışındaki diller için İngilizceye düşer.
- Kanalı görme, mesaj gönderme, bağlantı önizlemesi, dosya ekleme, geçmiş okuma ve
  **yeni** tepki ekleme için İZİN VAR/ENGELLİ ve belirleyici izin katmanı gösterilir.
- Sunucu rollerinin birleşimi, everyone kanal geçersiz kılması, birleşik rol kanal
  izinleri ve kişisel kanal izni sırasıyla hesaplanır. En yüksek rolün konumu bu
  altı kanal izninin çakışmasını çözmez. Rol izinlerindeki allow, başka bir rolün
  deny değerini geçebilir; kişisel kanal izni daha sonra uygulanır.
- Sunucu sahibi/Yönetici istisnası, etkin zaman aşımı, üyelik taraması ve görünürlük/
  mesaj gönderme bağımlılıkları açıklanır. Kategori izinleri ikinci kez uygulanmaz;
  Discord'un mevcut kanal geçersiz kılmaları kullanılır.
- **Yenile** beş güncel API okumasıyla tekrar hesaplar; **Kapat** özel yanıtı kapanış
  metnine çevirir ve oturumu siler. Hiçbir rapor paylaşma/yayımlama düğmesi yoktur.

### Yapmadığı işler ve sınırlar

Bot izinleri düzeltmez, rol vermez, kanal yönetmez, başka üyeyi incelemez, DM atmaz
ve mesaj geçmişini okumaz. Thread, forum, duyuru, ses, medya ve özel mesaj kanalları
desteklenmez. Rapor altı izinle sınırlıdır; tam sunucu güvenlik denetimi değildir.
Yeni tepki ekleme, var olan tepkiye katılma ile aynı değildir; yeni tepki geçmiş
okuma gerektirir. Yavaş mod, AutoMod, hesap/telefon doğrulaması, uygulamaya özel
komut kuralları, dosya boyutu ve Discord'un başka kısıtlamaları değerlendirilmez.

“İZİN VAR” mesajın teslim edileceğini garanti etmez. API okumaları atomik değildir;
eşzamanlı insan değişiklikleri raporu eskitebilir. Yenile sonucu da anlık bir
hesaplamadır. Rapor kullanarak sunucu kurallarını aşmaya çalışma; bir yöneticiye danış.

### Gereksinimler

1. [Node.js](https://nodejs.org/en/download) **24.13 veya üzeri 24.x**, beraberindeki
   npm; Windows, macOS veya Linux. Node 22/25/26 bu proje için desteklenmez.
2. Kendi Discord hesabınla oluşturacağın **ayrı bot uygulaması ve bot tokenı**.
   Kişisel hesap tokenı/self-bot kullanma. Sunucuya uygulama ekleme yetkin olmalı.
3. Botun çalışacağı tek bir sunucu ve botun görebileceği normal metin kanalı.
4. Discord HTTPS ve Gateway WebSocket bağlantılarını açabilen, sürekli çalışan
   bilgisayar/host. Gelen port veya etkileşim web sunucusu gerekmez.

Depoyu yayımlamak botu çevrimiçi yapmaz. Token veya barındırma hizmeti sağlanmaz;
operatör hesabı ve canlı Discord kurulumu gerekir. Bir token için tek işlem çalıştır.

### Developer Portal ve güvenli davet

1. [Discord Developer Portal](https://discord.com/developers/applications) →
   **New Application**; bir ad ver. **General Information → Application ID**'yi al.
2. **Bot** bölümünde botu oluştur/incele. **Reset Token** ile tokenı al; bu paroladır.
   Sohbete, issue'ya, ekran görüntüsüne veya GitHub'a koyma. Sızarsa hemen sıfırla.
3. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message
   Content anahtarlarını **kapalı** bırak. Kod yalnızca standart **Guilds** intent ister.
4. **Installation** bölümünde **Guild Install** kullan. **User Install** gerekmez;
   yalnızca kendi sunucun için kullanacaksan Public Bot'u kapatabilirsin. Etkileşimleri
   Gateway alır: **Interactions Endpoint URL** boş olsun.
5. Guild Install kapsamları **bot** ve **applications.commands**; bot izinleri yalnızca
   **View Channels / Kanalı Gör** (sayısal izin `1024`). Send Messages, Read Message
   History, Manage Roles, Manage Server veya Administrator isteme. İzin raporları
   normal kanal mesajı değil, özel etkileşim yanıtlarıdır.
6. Portal'ın davet bağlantısını açıp sunucuyu seç. Alternatif olarak **OAuth2 → URL
   Generator** içinde aynı kapsam/izinleri seç. Yetki ekranında gereksiz izin varsa
   iptal edip bağlantıyı düzelt. Kullanıcı kurulumunu seçme.
7. Discord **User Settings → Advanced → Developer Mode**'u aç. Sunucu simgesine
   sağ tık/uzun bas → **Copy Server ID**. Kanalın sunucu ayarlarında bot rolü için
   Kanalı Gör iznini ve diğer rollerden Yönetici izni gelmediğini doğrula.

### Kurulum: kaynak kod düzenlemeden

1. GitHub **Code → Download ZIP** ile indir, ZIP'i çıkar. Kişisel ve eşitlenmeyen
   bir klasör kullan; gerçek `.env` OneDrive/Dropbox/paylaşılan klasöre girmesin.
   Git biliyorsan `git clone https://github.com/euglado/accesssprig.git` kullanabilirsin.
2. Node.js 24'ü kur. Yeni terminalde `node --version` çıktısı `v24.x` olmalı.
3. **Windows:** çıkarılan klasörde `setup.cmd` çift tıkla; ardından `register.cmd`,
   sonra `start.cmd`. **macOS/Linux:** Terminal'i klasörde aç; sırasıyla
   `bash setup.sh`, `bash register.sh`, `bash start.sh` çalıştır.
4. Kurulum uygulama kimliğini, sunucu kimliğini ve gizli token girişini sorar.
   Token yazarken ekranda görünmemesi normaldir. Yerel `.env` oluşturur; mevcut
   `.env` üzerine yazmaz. Register yalnızca `/accesssprig` komutunu oluşturur/günceller;
   diğer komutları topluca silmez. Start penceresini açık bırak.

Terminal ile aynı adımlar:

```sh
npm ci --ignore-scripts
npm run setup
npm run register
npm start
```

PowerShell npm betiğini engelliyorsa `npm.cmd ci --ignore-scripts`,
`npm.cmd run setup`, `npm.cmd run register`, `npm.cmd start` kullan veya yardımcı
`.cmd` dosyalarını aç. Sistem genelinde script güvenliğini kapatman gerekmez.

### Yapılandırma ve çalışır tutma

Üç gerekli değer: `DISCORD_TOKEN` (gizli bot tokenı), `DISCORD_APPLICATION_ID`
(aynı uygulamanın ID'si), `DISCORD_GUILD_ID` (tek sunucu). Etkileşimli kurulum
bunları yazar; kaynak kod değiştirme. Tecrübeli host operatörü aynı ortam
değişkenlerini secret store üzerinden verebilir; mevcut ortam `.env` değerinden
önceliklidir. `.env.example` boş bir alan listesidir, token örneği içermez.

Değer değiştirmek için botu durdur, gerçek `.env` dosyasını özel klasöründen sil,
kurulumu yeniden çalıştır; sonra komutu kaydet ve başlat. Token sızması halinde
önce Portal'da tokenı sıfırla. `.env` yedeklerini Git'e ekleme. Unix'te 0600,
Windows'ta yalnızca işletmecinin erişebildiği klasör ACL'si kullan.

Terminal kapandığında, bilgisayar uyuduğunda veya ağ kesildiğinde bot çalışmaz.
Sürekli kullanımda Node 24 destekli bir hostta projenin klasörünü çalışma dizini
yap; bağımlılık kurulumu `npm ci --ignore-scripts`, başlatma komutu `npm start`.
Host panelinde üç secretı tanımla ve yeniden başlatmayı etkinleştir. Secretları build
loglarına yazma. Bir işlem kullan; dağıtık oturumlar desteklenmez. Ücretler, uptime,
güncelleme ve host güvenliği işletmecinin sorumluluğudur. Durdurma: Ctrl+C.

### Kullanım ve izinler

Normal metin kanalında `/accesssprig` yaz ve dilini seç. Önce özel bir anlık rapor
görürsün; kanala hiçbir şey gönderilmez. Örneğin “ENGELLİ — Dosya ekle: Mesaj Gönder
gerekli”, dosya izni tek başına açık olsa da mesaj gönderme olmadığını anlatır.
**Yenile** ile değişiklik sonrası tekrar oku. Okumalar üye/sunucu başına, kanallar
arasında ortak **5 saniye** aralıklı; **Kapat** okuma beklemesini gerektirmez.

Oturum **5 dakika** sürer ve Yenile bu süreyi uzatmaz. Aynı kanalda yeniden komut
önceki kendi düğmelerini geçersiz kılar. Yeniden başlatma veya süre dolunca eski
rapor/düğmeler Discord'da kalabilir; yeni komut kullan. Kontroller kullanıcı,
sunucu, kanal, bot ve özel mesaj kimliğine bağlıdır. En fazla 100 oturum, 50 aynı
anda okuma ve 1000 bekleme kaydı; yükte kibar hata döner.

Üyenin Kanalı Gör ve uygulama komutlarını kullanma erişimi olmalı; yöneticiler
**Server Settings → Integrations** üzerinden komutu kısıtlayabilir. Botun Yönetici
izni raporu reddettirir. Rol hiyerarşisini yükseltmek gerekmez. Botun göremediği
kanalı raporlamak veya başka üyeyi seçmek mümkün değildir.

### Güvenlik ve gizlilik

[PRIVACY.md](PRIVACY.md) veri akışı ve saklamayı; [SECURITY.md](SECURITY.md) sınırları
ve özel bildirim yolunu anlatır. Beş okuma: sunucu, roller, mevcut kanal, isteyen
üye ve bot üyeliği. Üye listesi veya mesaj uç noktası kullanılmaz. RAM oturumunda
kimlikler/dil/zaman/kontrol bilgisi tutulur; rapor, ad veya rol listesi saklanmaz.
Veritabanı, telemetri ve üçüncü taraf API yoktur. Discord/işletmeci veri işler;
ephemeral yanıt işletmeciye karşı gizlilik veya kalıcı silinme garantisi değildir.

### Sorun giderme

- **Komut yok:** register yardımcısını çalıştır; uygulama/sunucu ID'si ve Guild Install
  davetini kontrol et; Discord'u yenile. Integrations izinlerine bak. Developer
  Portal'da HTTP Interactions Endpoint tanımlıysa kaldırıp Gateway kullan.
- **Bot çevrimdışı:** start penceresini ve Node sürümünü kontrol et. Token sızmadan
  Portal'da sıfırlayıp yeniden kur; hostun dış HTTPS/WebSocket erişimini doğrula.
- **Kontrol yapılamadı:** normal metin kanalına geç; botun Kanalı Gör erişimini ve
  Yönetici olmadığını kontrol et. Rol silinmesi/eşzamanlı değişiklik, API beklemesi,
  meşgul düğme veya kapasite sınırı olabilir. 5 saniye sonra yeni komut dene.
- **Rapor “izin var” ama işlem yok:** yavaş mod, AutoMod, doğrulama, dosya sınırı ve
  Discord istemcisinin gösterdiği hatayı bir yöneticiyle incele; rapor teslim garantisi değildir.
- **Düğme çalışmıyor:** 5 dakika veya restart sonrası yeni komut; aynı kanalda daha
  yeni rapor açtıysan eski düğme geçersizdir. Başkasının düğmesi kullanılamaz.
- **`.env already exists`:** mevcut dosya kasıtlı olarak korunur. Botu durdurup dosyayı
  yerelde sil ve setup çalıştır. Tokenı destek kanalına kopyalama.
- **npm/Node bulunamadı:** Node 24'ü kurup yeni terminal aç; ZIP'in tamamını çıkardığını
  ve komutları `package.json` olan klasörde çalıştırdığını doğrula.
- **İki kopya yanıt veriyor:** tek tokenla çalışan diğer işlemi durdur.

### Testler, katkı ve lisans

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

Check: önerilen Biome lint/format, sıkı TypeScript, Node testleri ve bağımlılık
lisans/kaynak/SHA-512/install-script kontrolleri ile kaynaklarda gizli bilgi
örüntüsü taraması. CI ayrıca Node yardımcılarını ve Bash sözdizimini, temiz diff'i
Ubuntu, Windows ve macOS 15 Intel'de doğrular. Testler sahte etkileşim/API verileri
kullanır; gerçek token istemez. 4096 bağımsız izin kombinasyonu, izin sırası,
zaman aşımı, oturum bağlama, eşzamanlılık, API hataları ve yapılandırmasız gerçek
giriş noktaları kapsanır. Örüntü taraması tüm sırları bulma garantisi değildir.

Canlı Discord kurulumu, gerçek özel yanıt/düğmeler, gizli terminal girişi, mobil/
ekran okuyucu kullanımı ve sürekli barındırma operatörce doğrulanmalıdır. Bu depodaki
otomatik testler bunları doğruladığı iddiasında değildir. VDS testi yapılmadı.
Katkı için [CONTRIBUTING.md](CONTRIBUTING.md); açık kaynak [MIT lisansı](LICENSE).

## English

### Purpose and features

`/accesssprig` explains six of **your own** permissions in the current ordinary
server text channel: View Channel, Send Messages, Embed Links, Attach Files,
Read Message History and **adding a new reaction**. Each private row shows
ALLOWED/BLOCKED plus the deciding layer. Choose the optional `language` field;
otherwise Turkish Discord locales use Turkish and other locales use English.

The calculation applies server role union, everyone channel overwrite, combined
role overwrites and personal overwrite in that order. Highest role position does
not resolve conflicts between these channel permissions; a combined role allow
can beat a different role deny. Owner/Administrator exemptions, active timeouts,
pending screening and visibility/sending dependencies are explained. Categories
are not applied twice: current channel overwrites already reflect Discord syncing.

**Refresh** rereads five API resources; **Close** replaces the report with a
closing notice and removes controls. Reports are private from the first response;
there is no public share or publish action.

### What it does not do; limits

No permission/role/channel changes, other-member lookup, message-history reads,
DMs, voice, database or telemetry. Only ordinary guild text channels are supported;
threads, forums, announcements, media channels and DMs are rejected. These six
permissions are not a complete server security audit. New reactions differ from
joining an existing reaction; new reactions also require history access.

Slowmode, AutoMod, account/phone verification, app-specific command restrictions,
file size and other Discord restrictions are not evaluated. ALLOWED is not a
delivery guarantee. Five reads are not atomic, and concurrent human changes may
make the report stale immediately. Ask a server manager about access; this bot
does not bypass server rules or provide an enforcement decision.

### Requirements

- [Node.js](https://nodejs.org/en/download) **24.13 or newer 24.x** and its npm;
  Windows/macOS/Linux. Node 22, 25 and 26 are outside this project's supported range.
- Your own separate Discord bot application/token and permission to install it
  in one server. Never use a personal account token or self-bot.
- A normal server text channel the bot can view, and an always-on computer/host
  with outbound Discord HTTPS/Gateway WebSocket connectivity. No inbound port
  or interaction web server is needed.

Publishing this repository does not host the bot. You supply credentials and
hosting; run only one process per token. Live installation still requires validation.

### Developer Portal and least-permission installation

1. Open the [Developer Portal](https://discord.com/developers/applications), create
   a **New Application**, and copy **General Information → Application ID**.
2. In **Bot**, create/review the bot and use **Reset Token** to obtain its secret.
   Do not paste it into chat/issues/screenshots/GitHub. Reset any leaked token.
3. Keep all three **Privileged Gateway Intents** switches off: Presence, Server
   Members and Message Content. Code requests only the standard **Guilds** intent.
4. Under **Installation**, choose **Guild Install**. User Install is unnecessary.
   You can disable Public Bot for your own server. Leave **Interactions Endpoint
   URL** empty because this bot receives interactions over Gateway.
5. Select **bot** + **applications.commands** scopes and only **View Channels**
   permission (`1024`). Do not select Administrator, Send Messages, Read Message
   History, Manage Roles or Manage Server. Reports are ephemeral interaction
   replies rather than ordinary channel messages.
6. Open the portal's install link and choose your server. Alternatively use
   **OAuth2 → URL Generator** with those exact scopes/permission. Cancel if the
   authorization page requests unnecessary permissions; fix the link first.
7. In Discord enable **User Settings → Advanced → Developer Mode**. Right-click/
   long-press the server icon and **Copy Server ID**. Allow the bot's role to
   View Channel in the target channel; ensure no inherited role grants Administrator.

### Install without editing source code

Download **Code → Download ZIP**, extract everything to a private, unsynced folder,
and install Node 24. Keep `.env` out of cloud/shared folders. Git users can run
`git clone https://github.com/euglado/accesssprig.git`. In a fresh terminal,
`node --version` should show `v24.x`.

- **Windows:** double-click `setup.cmd`, then `register.cmd`, then `start.cmd`.
- **macOS/Linux:** open Terminal in the extracted folder; run `bash setup.sh`,
  `bash register.sh`, then `bash start.sh`.

Setup asks for Application ID, Server ID and hidden bot token input. No characters
appearing while you enter the token is expected. It creates local `.env` and
never overwrites an existing one. Registration upserts only the named command;
it does not bulk-delete other commands. Leave the start terminal open.

Equivalent commands:

```sh
npm ci --ignore-scripts
npm run setup
npm run register
npm start
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` or the provided
`.cmd` helpers. You need not disable system-wide script protections.

### Configuration and keeping it online

Required values are `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` (same application's
ID) and `DISCORD_GUILD_ID` (one server). Interactive setup writes them; source
edits are unnecessary. Experienced operators can supply environment variables
through a host secret store. Existing environment values take precedence over
`.env`. `.env.example` contains blank field names only.

To change settings, stop the process, delete only your local `.env`, rerun setup,
register and start. For a leaked token, reset it in the portal first. Never commit
configuration backups. Unix setup uses mode 0600; Windows folder ACLs should allow
only the operator. Avoid shared/cloud-synced folders.

Closing the terminal, sleep or losing network stops availability. For continuous
use, select a Node 24 host, set the project folder as the working directory,
install using `npm ci --ignore-scripts`, and start using `npm start`. Configure
the three secrets and automatic process restart in your host panel. Do not print
secrets in build logs. Distributed sessions are unsupported; use one process.
Hosting cost, uptime, updates and security belong to the operator. Ctrl+C stops it.

### Usage and permissions

Run `/accesssprig` in a normal text channel, optionally select a language, and
read the private report. For example, “BLOCKED — Attach files: Send Messages
required” explains why an Attach Files bit alone is insufficient. After a change,
click **Refresh**. Reads share a **5-second** cooldown per member/server across
channels. **Close** does not require waiting out that cooldown.

Sessions expire after **5 minutes**; Refresh does not extend expiry. A new command
in the same channel invalidates your previous controls. Restart/expiry can leave
old Discord responses visible with inactive buttons; run the command again.
Controls bind the requester, guild, channel, bot and private message. Limits:
100 sessions, 50 in-flight reads and 1000 cooldown records; overload fails safely.

Members need channel visibility and access to application commands. Managers may
restrict the command through **Server Settings → Integrations**. The bot needs
only View Channel; Administrator makes it refuse reports. Moving its role higher
is unnecessary. Inaccessible channels and other-member reports are unsupported.

### Security and privacy

Read [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md). API reads cover guild,
roles, current channel, requester and bot member; no member-list/message endpoints.
RAM sessions hold IDs, language, time and control state, not reports/names/role
lists. No database, telemetry or third-party API. Discord and the operator process
data. Ephemeral does not mean secrecy from the operator or guaranteed erasure.

### Troubleshooting

- **Missing command:** run register, check Application/Server IDs and Guild Install,
  refresh Discord, and inspect Integrations permissions. Remove any HTTP interaction
  endpoint configured in the portal so Gateway receives events.
- **Offline bot:** keep start running, verify Node 24 and outbound HTTPS/WebSocket
  access. Reset/reconfigure a token privately; never share it for support.
- **Could not check:** use a normal text channel; verify View Channel and absence
  of Administrator for the bot. Deleted roles, concurrent changes, rate limits,
  busy controls or capacity can cause failure. Wait 5 seconds and retry the command.
- **ALLOWED but action fails:** ask a manager about slowmode, AutoMod, account
  verification, upload size and the client's actual error. Reports do not guarantee delivery.
- **Stale buttons:** use a new command after 5 minutes, restart, or a newer report
  in that channel. Another member cannot use your report controls.
- **Existing `.env`:** setup intentionally refuses to overwrite it. Stop the bot,
  delete that local file, then rerun setup without sharing its contents.
- **Node/npm missing:** install Node 24, reopen the terminal, extract the whole ZIP,
  and run commands from the folder containing `package.json`.
- **Duplicate replies:** stop extra processes using the same token.

### Tests, contribution and license

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

Check runs recommended Biome lint/format, strict TypeScript, Node tests, dependency
license/registry/SHA-512/install-script review and source credential-pattern scans.
CI also checks Node helper syntax, Bash syntax and a clean diff on Ubuntu, Windows
and macOS 15 Intel. Fixtures and fake transports require no token. Tests cover
4096 independently evaluated permission combinations, overwrite precedence,
timeouts, bound sessions, concurrency, API failures and real unconfigured entrypoints.
Pattern scans cannot guarantee finding every secret.

Live Discord installation, actual ephemeral controls, hidden terminal input,
mobile/screen-reader usability and continuous hosting need operator validation;
automated tests do not claim to verify these. No VDS test was used.
See [CONTRIBUTING.md](CONTRIBUTING.md); licensed under [MIT](LICENSE).

### Official references / Resmi kaynaklar

- [Discord permissions and overwrite rules](https://docs.discord.com/developers/topics/permissions)
- [Interactions and ephemeral responses](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Gateway intents](https://docs.discord.com/developers/events/gateway)
- [Guild resources and individual member reads](https://docs.discord.com/developers/resources/guild)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)
