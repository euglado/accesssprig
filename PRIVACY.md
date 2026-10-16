# Gizlilik / Privacy

## Türkçe

AccessSprig kendin barındırdığın bir bottur. İşletmeci kimliğini ve iletişim yolunu
sunucunda duyur; bu depo merkezi bir hizmet veya veri sorumlusu değildir.

- Komut veya Yenile sırasında Discord'dan sunucu sahibi kimliği, sunucunun rol
  izinleri, yalnızca mevcut kanalın izin geçersiz kılmaları ve komutu isteyen
  üye ile botun üyelik nesneleri okunur. Tam API yanıtlarında kullanıcı/rol/kanal
  adları ve başka metadata gelebilir; hesaplama bunları saklamaz veya raporlamaz.
- RAM oturumlarında sunucu, kanal, kullanıcı, bot ve özel mesaj kimlikleri,
  dil, rastgele düğme anahtarı, bitiş zamanı ve meşgul bilgisi bulunur. Rapor,
  rol listesi, üyelik nesnesi veya adlar oturuma kaydedilmez.
- En çok 100 oturum, 50 eşzamanlı okuma ve 1000 bekleme kaydı tutulur. Oturumlar
  5 dakika geçerlidir; 30 saniyelik temizlik, yeni istekler, Kapat veya yeniden
  başlatma RAM kayıtlarını siler. Etkin okuma kaydı istek bitene kadar tutulur.
- Raporlar ephemeral etkileşim yanıtıdır: kanala yayımlanmaz, yalnızca isteyen
  kullanıcıya görünür. Ephemeral, uçtan uca şifreli veya işletmeciye karşı gizli
  demek değildir. Discord ve bot işlemini yöneten kişi yanıtı işleyebilir.
- Kapat, erişilebilen özel yanıtı kapanış metniyle değiştirir ve düğmeleri kaldırır;
  Discord'dan kalıcı silme veya ekran görüntülerini silme garantisi vermez.
  Süre dolunca/yeniden başlatınca eski yanıt Discord'da kalabilir, düğmeler çalışmaz.
- Veritabanı, dosya raporu, mesaj geçmişi okuma, DM, analitik veya harici servis yoktur.
  Discord bağlantı/Gateway olayları SDK tarafından işlenir. Mesaj, üye ve kullanıcı
  önbellekleri kapalıdır; sunucu/rol/kanal metadata SDK RAM'inde kalabilir.
- Token yerel `.env` dosyasında veya işletmecinin ortamında bulunur. Unix'te kurulum
  dosyayı 0600 ile oluşturur; Windows'ta klasörün ACL izinleri geçerlidir. Paylaşımlı,
  eşitlenen veya yedeklenen klasörlerden kaçın. Çıktılar tokenı/API hata nesnelerini
  kaydetmez; hosting sağlayıcısının log/veri politikasını ayrıca incele.

Silme için Kapat'ı kullan, gerekirse bot işlemini durdur. Sunucudan botu kaldırmak
Discord erişimini durdurur; token sızdıysa Developer Portal'da sıfırla. Discord'un
kendi veri saklama kuralları ayrıca geçerlidir.

## English

AccessSprig is self-hosted. Announce the operator's identity and contact route in
your server; this repository is not a central hosted service or data controller.

- A command or Refresh reads the guild owner ID, guild role permission bits,
  current channel overwrites, and member objects for the requester and bot only.
  Raw API replies can contain names and other metadata; the calculation does not
  retain or report those names.
- RAM sessions contain guild/channel/requester/bot/private-message IDs, language,
  random control key, expiry and busy state. Reports, role lists and member objects
  are not retained in sessions.
- Limits are 100 five-minute sessions, 50 in-flight reads and 1000 cooldown records.
  A 30-second sweeper, new requests, Close or restart remove RAM records. In-flight
  records remain until their request finishes.
- Reports are ephemeral interaction responses visible to the requesting member,
  never channel posts. This is not end-to-end encryption or secrecy from Discord
  or the operator controlling the bot process.
- Close replaces the reachable report with a closing notice and removes controls.
  It does not promise permanent deletion from Discord or removal of screenshots.
  Expired/restarted reports may remain visible with unusable controls.
- No database, report files, message-history reads, DMs, analytics or external
  services. The SDK processes Discord Gateway metadata; message/member/user caches
  are disabled, while guild/role/channel metadata can remain in SDK memory.
- The token lives in local `.env` or operator-managed environment variables.
  Setup uses 0600 on Unix; Windows directory ACLs apply. Avoid shared, synced or
  backed-up folders. Output omits API error objects and tokens; review your host's
  own logging and retention policies separately.

Use Close to remove a reachable report, or stop the process to clear RAM. Removing
the bot ends guild access. Reset leaked tokens in the Developer Portal. Discord's
own retention rules also apply.
