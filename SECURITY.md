# Güvenlik / Security

## Türkçe

Token, gerçek `.env`, kullanıcı/kanal kimlikleri veya özel rapor içeren issue açma.
Güvenlik açığını GitHub **Security → Report a vulnerability** yoluyla özel bildir;
bu seçenek görünmüyorsa hesap sahibinden özel iletişim yolu iste ve açığı herkese
açık yazma. Yanıt süresi garantisi yoktur. Şu an yalnızca güncel main desteklenir.

Botun Yönetici izni olursa rapor reddedilir. Kanalı Gör dışında izin verme;
sunucunun diğer rollerinden gelen gereksiz izinleri de incele. Bot hiçbir rolü,
kanalı veya izni değiştirmez. Rapor sadece isteyenin mevcut metin kanalı içindir.
Kimlik eşleme, kısa oturumlar ve özel yanıtlar yetkisiz düğme kullanımını sınırlar;
işletmecinin kendisine veya ele geçirilmiş tokena karşı gizlilik sağlamaz.

Discord'un beş API okuması tek bir atomik işlem değildir. Eşzamanlı rol/izin
değişiklikleri raporu anında eskitebilir. Sonuç, erişim veya mesaj teslimi garantisi
değildir ve güvenlik kararı için tek başına kullanılmamalıdır. Bekleme sınırlarında
ve belirsiz bağlantı hatalarında otomatik REST yeniden denemesi yapılmaz.

## English

Never put tokens, real `.env`, identifying metadata or private reports in issues.
Use GitHub **Security → Report a vulnerability** for private disclosure. If absent,
ask the account owner for a private contact route without publishing exploit details.
No response-time guarantee. Only the current main branch is supported.

Reports reject a bot with Administrator. Grant only View Channel and review
unnecessary permissions inherited from other roles. No roles/channels/permissions
are changed. Reports concern only the requester and current text channel. Bound,
short-lived sessions and ephemeral replies limit unauthorized button use; they
cannot protect data from the operator or a stolen token.

Five Discord API reads are not atomic. Concurrent permission changes can make the
report stale immediately. It is neither an access/delivery guarantee nor a sole
basis for security decisions. Rate limits and uncertain transport failures do not
trigger automatic REST retries.
