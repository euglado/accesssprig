# Katkı / Contributing

Türkçe veya İngilizce issue/PR açabilirsin. Gerçek token, üye adları, kimlikler veya
özel rapor yerine hayali veriler kullan. Önce mevcut issue'ları incele. İzin
hesaplaması değiştiğinde resmi Discord dokümanına bağlantı ve bağımsız test örneği
ekle. Başka üyeleri sorgulama, herkese açık rapor, ayrıcalıklı intent veya yeni veri
saklama ekleyen değişiklikler önce gizlilik ve kapsam tartışması gerektirir.

Issues and PRs in Turkish or English are welcome. Use fictional fixtures instead
of real tokens, names, IDs or reports. Check existing issues first. Permission
changes should cite official Discord documentation and include an independent
test case. Discuss privacy and scope before adding other-member queries, public
reports, privileged intents or new retention.

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-supply.mjs
bash -n setup.sh register.sh start.sh
git diff --check
```

Node.js 24 kullan / Use Node.js 24. Testler Discord hesabı veya token istemez /
Tests require no Discord account or token. CI Ubuntu, Windows ve macOS 15 Intel'de
çalışır / runs on Ubuntu, Windows and macOS 15 Intel. MIT lisansı geçerlidir /
Contributions use MIT. Güvenlik bildirimleri için SECURITY.md'yi izle /
Follow SECURITY.md for vulnerability reports.
