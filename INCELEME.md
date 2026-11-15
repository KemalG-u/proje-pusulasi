# Bağımsız inceleme notu

**Güncel durum: kaynak kodu herkese açık yayımlandı; Astra ile bağımsız kaynak ve yayın incelemesi yapıldı.** Bağımsız insan/uzman güvenlik denetimi yapılmadı, üçüncü taraf hak zinciri doğrulanmadı. Bu klasör başlangıçta Git deposu kurulmadan yerel inceleme için hazırlanmış adaydı. Aşağıdaki önceki yayın kararları ilgili aşamaların tarihsel kayıtlarıdır.

## Köken ve izin

- `app.js`, `index.html`, `test/app.test.js` ve `test/e2e.test.js` yerel Proje Pusulası uygulamasından alınarak yalnız bu adayda değiştirildi. Demo ve testlerdeki kişi adı çıkarıldı; sentetik bahçe örneği yazıldı. Boş hedef ve boş karar gerekçesinin kayıtları yeniden açılmaz hale getirmesi iki birim testiyle önce gösterildi, sonra reddedilmeleri sağlandı.
- Kemal, 1–7 numaralı kendi proje kodlarının açık kaynak yapılmasını onayladı; bu izin kendi kodunu kapsar, üçüncü taraf haklarını devretmez. Kaynakta incelenen kök listesinde lisans dosyası yoktu; belirli bir lisans henüz seçilmedi. Katkıcılar ve üçüncü taraf materyal için hak zinciri tamamlanmış değildir. Atıf gerektiren üçüncü taraf kodun bulunmadığı ispatlanmış değildir; belirsiz materyal yayına alınmamalıdır.
- Uygulama dosyalarında dış script, harici URL veya paket bağımlılığı görülmedi; sistem yazı tipleri tarayıcıdan gelir. İncelenen tarayıcı testi yerel Chrome'u kullanır, Chrome paketlenmez ve hakları ayrıca geçerlidir. Çevrimdışı kod taraması köken/lisans denetimi yerine geçmez.
- Yetki: yalnız bu E: aday köküne yazma ve yerel test; kaynak dosyaları değiştirme, kullanıcı tarayıcısına/verisine erişme, ağ, GitHub ve yayın yetkisi yok. Kapı kilidi, verilen çalışma kuralının zorunlu mekanizmasıdır; kapının dotnet sunucularını kapatan sonlandırma çağrısı işlev gölgelemesiyle etkisizleştirildi, başkasının süreçleri kapatılmadı.

## Tarihsel doğrulama ve sınırlamalar

- `node --check app.js && node --test` ağır iş kapısı üzerinden: 11 geçti, 0 başarısız, 1 atlandı. Sentetik nesneler üzerinde şema reddi, döngü, dışa aktarılan JSON ile mağazayı yeniden kurma ve reddedilen içe aktarımın değişiklik yapmaması sınandı. Kullanıcı arayüzünde gerçek indirme, gerçek dosya içe aktarma ve yeniden açma **sınanmadı**.
- Kaçış testinde güvensiz dizgenin kontrol tarafından yakalandığı pozitif kontrol vardır; bu bir DOM veya tarayıcı XSS denetimi değildir. Öznitelik işleme ve olay çalışması gerçek tarayıcıda doğrulanmadı.
- Tarayıcı testinin kullandığı Chrome DevTools yerel ağ bağlantısı ve Chrome'un ağ davranışı, mutlak ağ yasağı altında çalıştırılmadı. Test `test.skip` olarak bırakıldı. Boş profil, arayüzün görünümü ve gerçek tarayıcı üzerinden kullanıcı etkileşimi doğrulanmadı.
- Statik düzeltme: `app.js:66,83-89` yalnız eksik kayıtta demoyu açar; boş kayıt JSON doğrulamasına ve kurtarma korumasına gider. `app.js:104,107` seçenek metnini kimlikten ayırır, kimliği bölmeden taşır; boş seçenek değeri, doğrulayıcının boş kimliği reddetmesi sayesinde geçerli bir kimlikle çakışmaz (`app.js:23,28,40`). Sentetik regresyonlar `test/app.test.js` ve atlanmış `test/e2e.test.js` içine yazıldı; çalıştırılmadılar. Gerçek tarayıcı ve kurtarma indirmesi doğrulanmadı.
- Gizli dosyalar, özel oturumlar ve mevcut localStorage açılmadı veya kopyalanmadı. Kaynak kökünden dört uygulama/test dosyası seçildi; proje durum belgeleri ve diğer dosyalar adayın dışında bırakıldı. Araçla düzenleme sırasında sır taraması tamamlanamadığı uyarısı alındı; kapsamlı bağımsız gizlilik/sır ve lisans taraması yapılmadı.

## İzinli içerik listesi

Sadece `app.js`, `index.html`, `test/app.test.js`, `test/e2e.test.js`, `README.md`, `INCELEME.md` ve `SHA256SUMS.txt`. Liste dosyası kendi özetini içermez. Kaynak çalışma alanındaki kayıtlar, özel durum, `.env`, bağımlılık klasörleri ve tarayıcı profilleri dahil değildir. `SHA256SUMS.txt` değişiklik tespiti içindir; hak veya güvenlik kanıtı değildir.

## Tarihsel sonraki çalışma sınırı

Kapı betiği son yuva çıkışında `dotnet build-server shutdown` çağırabiliyor; bu, başkasının sürecini kapatmama koşuluyla çatışabilir. Kapı değiştirilmedi veya koruması atlanmadı. Bu nedenle düzeltme sonrası test veya derleme çalıştırılmadı; iki düzeltmenin davranışı henüz doğrulanmadı. O aşamada Astra son denetiminden önce yayın yasaktı.


## Tarihsel sonraki hazırlık — o aşamada doğrulanmamış

- Kurtarma modunda formun `persist` reddinden önce bellekte veri değiştirebildiği kaynak akışında görüldü: `submit` önce, `persist` sonra çağrılıyordu. Kurtarma koruması `submit` öncesine taşındı; sentetik tarayıcı senaryosuna yeniden çizim kontrolü eklendi. Gerçek hata tekrar üretimi ve düzeltme çalıştırılmadı. `localStorage.setItem` kota/izin hatasında bellekteki değişikliğin geri alınması ayrı açık risktir.
- Boş kayıt ve `|` içeren kimlikler için birim ve tarayıcı senaryoları hazır; son değişiklikler çalıştırılmadı. Form iptali, depolama erişim hataları, gerçek indirme/içe aktarma, küçük ekran ve erişilebilirlik ayrıca sınanmalı.
- Ağ kontrolü henüz kurulup kanıtlanmadı: yalnız yeni boş test profili, yerel CDP ve yerel pozitif kontrol hedefi kullanın; önce kontrol hedefinin yakalandığını/engellendiğini gösterin, sonra uygulamanın isteklerini ölçün. Tarayıcının arka plan trafiği için süreç düzeyinde dış ağı engelleyen ve yerel döngüye izin veren bağımsız kontrol gerekir; CDP sayfa olayları tek başına kapsamlı kanıt değildir. Mevcut atlanmış test gerçek dosya indirmesini veya tüm ağ trafiğini ölçmez. Ağ için çalışma yetkisi ayrıca netleştirilmelidir.
- Kaynakta lisans ve katkıcı hakları bağımsız doğrulanamadı. Kemal'in kendi kodu için izni vardır; üçüncü taraf olduğu belirlenen ve izni/atıf koşulları doğrulanamayan içerik ayrıca dışlanmalıdır. Lisans seçimi uydurulmadı.
- O aşamada bu aday Git deposu değildi. Aday proje sözleşme algılayıcısı `TYPE_MISSING` döndürdü; kaynak sözleşmesi okundu, aday inceleme paketi olduğundan yeni proje/rehber dosyaları veya kaynakta değişiklik oluşturulmadı.

- Adaydaki altı metin dosyası anahtar belirteçleri, parola/token atamaları ve uzun yüksek entropili dizgeler için tarandı; yedi sentetik pozitif kontrolden yedisi algılandı, eşleşme yok. Özet dosyası yalnız sağlama toplamı olduğundan içerik taramasına katılmadı. Bu özel kural kümesi tüm sır biçimlerini veya özel verileri yakaladığını kanıtlamaz; bağımsız uzman aracı ve insan incelemesi hâlâ gereklidir.


## Yeni Chrome doğrulaması — 14 Kasım 2026

- İptal kusuru önce gerçek Chrome testinde görüldü: boş zorunlu alanla Vazgeç, tarayıcı form doğrulamasına takıldığı için pencereyi açık bıraktı. İptal düğmesine `formnovalidate` eklendi; boş ve dolu formda pencerenin kapanması ve kayıtların değişmemesi doğrulandı. Kaydet doğrulaması korunur.
- Ayrı sentetik Chrome profilinde indirilen JSON diskten okundu, depolamayla karşılaştırıldı ve gerçek aynı dosya geri yüklendi; yeniden açmada doğrulandı. Bozuk JSON kurtarma dosyası da diskten okunup karşılaştırıldı. İçe aktarmanın iptali, bağımlılıklar, boş bozuk veri ve kurtarma koruması sınandı.
- CDP pozitif kontrolde sentetik yerel istek gözlendi ve engellendi. Ardından testin gözlemlediği senaryo bölümünde, yerel uygulama URL’siyle başlamayan sayfa kaynaklı HTTP(S) isteği saptanmadı. Bu kontrol ilk sayfa yüklemesinin tamamını, yerel uygulama isteklerini veya Chrome’un arka plan/süreç düzeyi ağ trafiğini kapsamaz; ağsızlık garantisi değildir.
- Güncel kontrol `python test/kilitli-test.py`: `test/kilitli-test.py` msvcrt kilidiyle bekler, `AGIR_KAPATMA=0 AGIR_BAYAT_TEMIZLE=0 AGIR_SURE=0 AGIR_ANAHTAR=portfoy-seri-proje-pusulasi` ile ortak kapıyı çalıştırır. Önceki bölümlerdeki atlandı/çalıştırılmadı ifadeleri o aşamaya aittir.
- Hak durumu: MIT yaygın izinli bir seçenek, lisans ve telif bildiriminin korunmasını ister: https://choosealicense.com/licenses/mit/ . Lisanssız üçüncü taraf kodun kullanımı ve yeniden dağıtımı otomatik olarak serbest sayılmaz: https://github.com/github/choosealicense.com/blob/gh-pages/no-permission.md . Klasörde dış bağımlılık görünmemesi, yazar ve üçüncü taraf hak zincirini kanıtlamaz; telif sahibi ve köken belirsizliğinden MIT dosyası eklenmedi. O aşamada Astra ve hak denetimi öncesi yayın yapılmaması kararlaştırılmıştı.
- Kalan risk: `localStorage.setItem` kota/izin hatası sonrası uygulama belleğinde değişiklik geri alınmayabilir. Kapsamlı güvenlik ve kullanıcı kabulü doğrulanmadı.

- Son tam kontrol: `python test/kilitli-test.py` → 14 geçti, 0 başarısız, 0 atlandı; 13 birim, 1 Chrome senaryosu. Önce `node --test` genel keşfi, `test` altında sahipliği belirlenemeyen iki profil klasöründeki Chrome eklenti dosyalarını test sanıp 4 kez başarısız oldu. Çalıştırıcı şimdi yalnız iki test dosyasını seçer ve yeni profili `test` dışına kurar. Bu iki eski klasöre dokunulmadı; **yayın paketine alınmamalı**, sahipliği yayın yöneticisince doğrulanmalı.
- İzinli listeye `test/kilitli-test.py` eklendi; SHA listesi yalnız açıkça listelenmiş aday dosyaları kapsar, profil klasörlerini kapsamaz.


## Tarihsel Astra sonrası çalışma — o aşamada tamamlanmadı

- Sentinel gerçek Chrome testi, yazma hatası ve iptal sonrası başarısız projenin sonraki kayda sızdığını gösterdi (`python test/kilitli-test.py node --test test/e2e.test.js`, rc=1, `başarısız kayıt sonraki kayda sızmamalı`). Ardından işlemsel aday eklendi.
- file:// iki sekme testi iki sekmenin de başarılı mesajı verdiğini gösterdi; Chrome'da Web Locks kapsamı localStorage ile aynı sayılmamalı. Bu nedenle file:// yazması kapatıldı, localhost/HTTPS üzerinde kilit ve revizyon denetimi eklendi. İlk localhost testi geçti; sonraki revizyon değişikliklerinin tam testi henüz doğrulanmadı.
- İçe aktarmada doğrulama ve onaydan sonra kilitli yazma ve başarılıysa bellek güncellemesi uygulandı; kurtarma ham veri indirmesi kaydı silmez. İndirme bildirimi dosyanın gerçekten indiğini iddia etmez.
- `python test/kilitli-test.py` son çalıştırması 180 saniyede zaman aşımına uğradı; sonuç alınamadı. Önceki başarılı localhost testi sonraki değişiklikleri kapsamaz. İki sekme ve tüm kurtarma senaryoları güncel adayda yeniden çalıştırılmalıdır.
- Hak zinciri kanıtlanmış değil. README'deki MIT bildirimi yalnız Kemal'in yetki verdiği katkıları kapsar; üçüncü tarafların hakları hakkında kesin iddia yok. O aşamada bağımsız hak incelemesi ve tam regresyon geçmeden yayın yapılmaması kararlaştırılmıştı. Eski Chrome profil klasörleri paket dışındadır ve değiştirilmedi.


### Önceki kontrol — 14 Kasım 2026

`python test/kilitli-test.py` → 14 geçti, 0 başarısız, 0 atlandı; gerçek Chrome localhost testi dahil. Bu sonuç yukarıdaki tamamlanmadı ve son test bekliyor ifadelerinin test durumunu günceller; o aşamada hak zinciri doğrulanmamış ve yayın kapalıydı. Sentetik yazma hatası → vazgeç → sonraki kayıt sızıntısız; normal içe aktarma yazma hatası belleği korudu. İki sekmede eşzamanlı yazmada biri kaydedildi, eskimiş diğeri reddedildi; Web Locks yokken yazma kapandı. Gerçek indirmelerde bozuk JSON ve boş metin ayrı dosyalardan okundu; kurtarmada iptal ve yazma hatası bozuk kaydı korudu, onaylı geçerli yedek geri yüklendi. İçe aktarmada yeni revizyon üretilir; veri karşılaştırmasında revizyon ayrıdır.

`file://` senaryosunda iki sekme aynı anda başarılı göründüğünden yazma yasaklandı; localhost güvenli bağlamında sınandı. Koruma bu uygulamanın Web Locks protokolünü kullanan aynı origin sekmeleri içindir; eski sürüm veya farklı kod depoyu kilidi kullanmadan değiştirebilir. Geriye dönük dosya verisinin localhost'a aktarımı kullanıcı eliyle yedekten yapılır. Gerçek kullanıcı kabulü, diğer tarayıcılar, bağımsız güvenlik ve hak denetimi yapılmadı.


## Son doğrulama — 14 Kasım 2026

- `python test/kilitli-test.py` iki ardışık tam çalıştırmada sırasıyla 22:48:27 ve 22:49:48 başlangıcıyla 14 geçti, 0 başarısız, 0 atlandı, rc=0 verdi. Kapı `AGIR_KAPATMA=0`, `AGIR_BAYAT_TEMIZLE=0`, `AGIR_SURE=0`, `AGIR_ANAHTAR=portfoy-seri-proje-pusulasi` ile seri kilit altında çalıştı.
- İkinci sekmede başlık HTML ayrıştırılırken betik ve DOMContentLoaded işleyicisi henüz kurulmamış olabilir: eski test yalnız başlığı bekliyor, ardından işleyicisi olmayan düğmeye tıklayabiliyordu. Şimdi iki sekmede işleyici hazır olması ve iki formun gerçekten açık olması doğrulanıyor; başarısız olursa test açık hata veriyor. Bu kaynak akışı önceki aralıklı null hatasıyla tutarlıdır; hatanın o koşulda yeniden üretildiği iddia edilmez. Kilit ve reddedilen yarış doğrulamaları korunmuştur.
- Eski temizlik Chrome'a sonlandırma gönderip süreç çıkışını beklemeden sabit 800 ms sonra profili siliyordu; Windows'ta dosyalar hâlâ kilitli kalabilir. Test artık yalnız kendi başlattığı Chrome'un çıkış olayını bekler, sonra yalnız kendi oluşturduğu profili sınırlı yeniden denemeyle siler. Sınır aşımı veya silme hatası gizlenmez. Browser.close ile ayrı bir deneme süreç zamanında çıkmadığından başarısız oldu (13/14); bu yaklaşım kullanılmadı ve yalnız o denemenin kendi profili süreç çıktıktan sonra temizlendi. Eski profillere dokunulmadı.
- Önceki bölümlerdeki çalıştırılmadı, atlandı ve bellek geri alma riski ifadeleri tarihsel aşamalardır. Güncel test sentetik başarısız yazma ve iptal sonrası sonraki kayda sızıntı olmadığını, içe aktarma yazma hatasında belleğin korunduğunu ve kurtarma indirmelerini sınar; bu bütün depolama hatalarını ve tarayıcıları kapsamaz. Astra ile bağımsız kaynak ve yayın incelemesi yapıldı; bağımsız insan/uzman güvenlik denetimi ve gerçek kullanıcı kabulü yapılmadı, üçüncü taraf hak zinciri doğrulanmadı. Sayfa ağı gözlemi Chrome'un süreç düzeyi ağ trafiğini kapsamaz; kaynak kodu sonradan herkese açık yayımlandı.
