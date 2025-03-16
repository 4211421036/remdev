document.addEventListener('DOMContentLoaded', function () {
    const deviceInfo = document.getElementById('device-info');
    const qrCodeElement = document.getElementById('qr-code');
    const shareDeviceButton = document.getElementById('share-device');
    const playSoundButton = document.getElementById('play-sound');
    const mapElement = document.getElementById('map');

    let deviceData = {
        name: 'Perangkat Saya',
        battery: null,
        location: null,
        qrCode: null
    };

    // Meminta izin lokasi
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                deviceData.location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateDeviceInfo();
                showMap(deviceData.location.lat, deviceData.location.lng);
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
    }

    // Mendapatkan status baterai
    if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
            deviceData.battery = `${Math.round(battery.level * 100)}%`;
            updateDeviceInfo();
        });
    } else {
        console.error('Battery Status API is not supported by this browser.');
    }

    // Membuat QR Code
    function generateQRCode(data) {
        qrCodeElement.innerHTML = '';
        new QRCode(qrCodeElement, {
            text: JSON.stringify(data),
            width: 200,
            height: 200
        });
    }

    // Memperbarui informasi perangkat
    function updateDeviceInfo() {
        deviceInfo.innerHTML = `
            <h3>${deviceData.name}</h3>
            <p>Baterai: ${deviceData.battery || 'Tidak tersedia'}</p>
            <p>Lokasi: ${deviceData.location ? `${deviceData.location.lat}, ${deviceData.location.lng}` : 'Tidak tersedia'}</p>
        `;
        generateQRCode(deviceData);
    }

    // Menampilkan peta
    function showMap(lat, lng) {
        const map = L.map(mapElement).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        L.marker([lat, lng]).addTo(map)
            .bindPopup('Lokasi Perangkat')
            .openPopup();
    }

    // Membunyikan perangkat
    playSoundButton.addEventListener('click', function () {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frekuensi 440 Hz
        oscillator.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 1000); // Bunyi selama 1 detik
    });

    // Membagikan perangkat
    shareDeviceButton.addEventListener('click', function () {
        if (navigator.share) {
            navigator.share({
                title: 'Bagikan Perangkat',
                text: `Perangkat: ${deviceData.name}, Baterai: ${deviceData.battery}, Lokasi: ${deviceData.location ? `${deviceData.location.lat}, ${deviceData.location.lng}` : 'Tidak tersedia'}`,
                url: window.location.href
            }).then(() => {
                console.log('Perangkat berhasil dibagikan.');
            }).catch((error) => {
                console.error('Error sharing:', error);
            });
        } else {
            console.error('Web Share API is not supported by this browser.');
        }
    });
});
