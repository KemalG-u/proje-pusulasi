# Proje Pusulası — inceleme adayı

> **Yayınlanmadı.** Yayın kapalıdır: hak zinciri ve son değişikliklerin tam testi tamamlanmamıştır.

## Türkçe

Proje, iş, karar, risk ve kanıt notlarını gösteren yerel bir HTML/JavaScript panosu. Başlangıçtaki bahçe projesi tamamen sentetik, kurgusal bir örnektir; gerçek proje verisi veya canlı demo değildir. Hermes, Claude, Codex ya da başka bir ajana entegrasyon, otomatik izleme veya gerçek veriden çıkarım yoktur.

`python -m http.server 8000 --bind 127.0.0.1` komutunu bu klasörde çalıştırıp `http://127.0.0.1:8000/` adresini açın. `file://` üzerinde güvenli sekmeler arası kilit sağlanamadığından yazma kapalıdır. Eski file:// verisi farklı bir alandadır; oradan Dışa Aktar ile yedek alıp localhost üzerinde İçe Aktar ile taşıyın. Kayıtlar tarayıcının localStorage alanındadır; tarayıcı verilerinin silinmesi kayıtları silebilir. Yedek indirme JSON dosyası oluşturur: dosya gizli bilgiler içerebilir, güvenli yerde tutun. İçe aktarma tüm mevcut kayıtların üzerine yazar ve onay ister. Bozuk yerel veri algılandığında üzerine yazılması engellenir ve ham veri kurtarma amaçlı indirilebilir. Kanıt bağlantıları kaydedilir ama tıklanabilir bağlantı olarak sunulmaz.

Kontrol: Windows, Node.js ve Chrome gerektirir. `python test/kilitli-test.py` portföy işçi kilidini bekler ve güvenli ağır iş kapısını kullanır. Test kendi boş Chrome profilini açar; sentetik veriler kullanır. Gerçek kullanıcı kabulü, erişilebilirlik, tüm güvenlik ve tüm yedek senaryoları doğrulanmış değildir. Web Locks veya güvenli revizyon üretimi desteklenmiyorsa yazma engellenir. Başka sekmede değişmiş kayıt reddedilir; sayfayı yenileyin. Önemli kayıtlar için yedek alın.

## English

A local HTML/JavaScript dashboard for projects, tasks, decisions, risks and evidence notes. The initial garden project is entirely synthetic and fictional; it is not real project data or a live demo. There is no integration with Hermes, Claude, Codex, or any other agent; there is no automatic monitoring or extraction from real data.

Run `python -m http.server 8000 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8000/`. Writes are disabled on `file://` because safe cross-tab locking is not available there. Export old file:// data and import it on localhost; the origins have separate storage. Records are stored in that browser's localStorage and can disappear when browser data is cleared. Export creates a JSON backup which may contain sensitive information; keep it safe. Import asks for confirmation and replaces all current records. Invalid local data is preserved against overwriting and can be exported for recovery. Evidence URLs are stored, but are not rendered as clickable links.

On Windows, run `python test/kilitli-test.py` with Node.js and Chrome installed. It uses the shared worker lock and execution gate, and a separate disposable Chrome profile with synthetic data. Real-user acceptance, accessibility, comprehensive security and all backup scenarios remain unverified. Writes are disabled without Web Locks or secure revision generation. Conflicting tabs must reload. Keep backups.

## Rights / Haklar

Kemal has approved open-sourcing his own project code for projects 1–7. This candidate derives from that code; third-party provenance remains to be established. The owner licenses their own contribution under the MIT terms below; this does not grant third-party rights. Do not publish before the Astra final review. See `INCELEME.md`.

Kemal 1–7 numaralı kendi proje kodlarının açık kaynak yapılmasını onayladı. Bu aday o koddan türetilmiştir; üçüncü taraf hakları henüz belirlenmedi. Kendi katkısı aşağıdaki MIT koşullarıyla lisanslanmıştır; bu, üçüncü taraf haklarını kapsamaz. Astra son denetiminden önce yayımlamayın. `INCELEME.md` dosyasına bakın.


## Test kapısı / Test gate

TR: Boş ve dolu form iptali, gerçek indirilen JSON içeriği ve aynı dosyadan geri yükleme ile bozuk verinin gerçek kurtarma dosyası Chrome'da sınandı. Sayfa ağı gözlemi pozitif engelleme kontrolüyle doğrulandı; bu, Chrome sürecinin tüm ağ trafiğini kapsamaz. Ayrıntı ve kalan riskler `INCELEME.md` içindedir.

EN: Chrome checks cancellation, actual downloaded JSON and import from that file, plus the downloaded recovery file. Page network observation includes a positive blocking control; it does not cover all Chrome process traffic. See `INCELEME.md` for limitations.

## MIT License (owner contribution / sahibinin katkısı)

Copyright (c) 2026 KemalG-u

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Portable tests / Taşınabilir testler

Node.js (built-in test runner, fetch and WebSocket) and Chrome required. From the project root: `node --test test/app.test.js test/e2e.test.js`. Set `CHROME_BIN` to the Chrome executable if it is not at the default path. This public command does not use the local coordination gate. On the owner's machine the coordinated command remains `python test/kilitli-test.py`.
