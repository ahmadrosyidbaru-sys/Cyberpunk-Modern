function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('WA Scheduler Pro - Ahmad')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function jadwalkanPesan(data) {
  const sekarang = new Date();
  const [jam, menit] = data.jam.split(':');
  const waktuTarget = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate(), jam, menit);

  // Jika jam sudah lewat, atur untuk besok
  if (waktuTarget < sekarang) {
    waktuTarget.setDate(waktuTarget.getDate() + 1);
  }

  // Membuat Trigger Otomatis (Inilah yang membuat sistem jalan di latar belakang)
  ScriptApp.newTrigger('eksekusiKirim')
    .timeBased()
    .at(waktuTarget)
    .create();
    
  // Simpan data pesan ke database internal Google (PropertiesService)
  // Kita gunakan ID unik agar bisa dipakai banyak orang bersamaan
  const userKey = 'MSG_' + waktuTarget.getTime();
  PropertiesService.getScriptProperties().setProperty(userKey, JSON.stringify(data));
  
  return "Berhasil Dijadwalkan! Pesan akan terkirim pada: " + waktuTarget.toLocaleString();
}

function eksekusiKirim(e) {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys();
  
  // Cari data pesan yang waktunya paling mendekati sekarang
  keys.forEach(key => {
    if (key.startsWith('MSG_')) {
      const data = JSON.parse(props.getProperty(key));
      
      // LOGIKA KIRIM: Menggunakan API Gateway (Contoh: CallMeBot atau Fonnte)
      // Karena Google Script tidak bisa buka browser WA Web secara fisik, 
      // kita gunakan API pihak ketiga yang stabil.
      const url = "https://api.callmebot.com/whatsapp.php?phone=" + data.tujuan + "&text=" + encodeURIComponent(data.pesan) + "&apikey=GANTI_DENGAN_APIKEY_MU";
      
      try {
        UrlFetchApp.fetch(url);
        props.deleteProperty(key); // Hapus data jika sudah terkirim
      } catch(err) {
        console.log("Gagal mengirim: " + err);
      }
    }
  });

  // Hapus trigger yang sudah selesai agar limit Google tidak penuh
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}