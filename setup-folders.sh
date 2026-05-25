#!/bin/bash
# setup-folders.sh
# Jalankan ini di server Pterodactyl untuk memastikan folder ada

echo "=== Setting up folders ==="

# Buat folder jadwal jika belum ada
if [ ! -d "jadwal" ]; then
    mkdir -p jadwal
    echo "✅ Folder jadwal/ dibuat"
else
    echo "✅ Folder jadwal/ sudah ada"
    ls -la jadwal/
fi

# Buat folder Modul Fisika jika belum ada
if [ ! -d "Modul Fisika" ]; then
    mkdir -p "Modul Fisika"
    echo "✅ Folder Modul Fisika/ dibuat"
else
    echo "✅ Folder Modul Fisika/ sudah ada"
    ls -la "Modul Fisika/"
fi

echo ""
echo "=== Upload file ==="
echo "Upload file jadwal (.jpeg) ke folder jadwal/"
echo "Upload file modul (.pdf) ke folder Modul Fisika/"
echo ""
echo "Setelah upload, restart bot dan test:"
echo "  .jadwal uts"
echo "  .fisika m1"
