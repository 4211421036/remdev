document.addEventListener('DOMContentLoaded', function () {
    const deviceInfo = document.getElementById('device-info');
    const qrCodeElement = document.getElementById('qr-code');
    const shareDeviceButton = document.getElementById('share-device');
    const playSoundButton = document.getElementById('play-sound');
    const addDeviceButton = document.getElementById('add-device');
    const deviceIdInput = document.getElementById('device-id-input');
    const connectedDevicesElement = document.getElementById('connected-devices');
    const mapElement = document.getElementById('map');

    let deviceData = {
        name: 'Perangkat Saya',
        battery: null,
        location: null,
        id: generateUniqueId()
    };

    let connectedDevices = JSON.parse(localStorage.getItem('connectedDevices')) || [];
    let map = null;

    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                deviceData.location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateDeviceInfo();
                initMap();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Tidak dapat mendapatkan lokasi. Pastikan izin lokasi diberikan.');
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
        alert('Browser Anda tidak mendukung fitur lokasi.');
    }

    if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
            deviceData.battery = `${Math.round(battery.level * 100)}%`;
            updateDeviceInfo();
            battery.addEventListener('levelchange', () => {
                deviceData.battery = `${Math.round(battery.level * 100)}%`;
                updateDeviceInfo();
            });
        });
    } else {
        console.error('Battery Status API is not supported by this browser.');
        deviceData.battery = 'Tidak tersedia';
        updateDeviceInfo();
    }

    function initMap() {
        if (!deviceData.location) return;
        if (map) map.remove();
        map = L.map(mapElement).setView([deviceData.location.lat, deviceData.location.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        L.marker([deviceData.location.lat, deviceData.location.lng])
            .addTo(map)
            .bindPopup(`${deviceData.name} (Perangkat Ini)`)
            .openPopup();
        connectedDevices.forEach(device => {
            if (device.location) {
                L.marker([device.location.lat, device.location.lng])
                    .addTo(map)
                    .bindPopup(device.name);
            }
        });
    }

    function generateQRCode(data) {
        qrCodeElement.innerHTML = '';
        new QRCode(qrCodeElement, {
            text: JSON.stringify(data),
            width: 200,
            height: 200
        });
    }

    function updateDeviceInfo() {
        deviceInfo.innerHTML = `
            <h3>${deviceData.name}</h3>
            <p>Baterai: ${deviceData.battery || 'Tidak tersedia'}</p>
            <p>Lokasi: ${deviceData.location ? `${deviceData.location.lat.toFixed(4)}, ${deviceData.location.lng.toFixed(4)}` : 'Tidak tersedia'}</p>
            <p>ID Perangkat: ${deviceData.id}</p>
        `;
        generateQRCode(deviceData);
    }

    function playSound(deviceId = null) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        let counter = 0;
        const beepInterval = setInterval(() => {
            if (counter % 2 === 0) gainNode.gain.value = 0.5;
            else gainNode.gain.value = 0;
            counter++;
            if (counter >= 10) {
                clearInterval(beepInterval);
                oscillator.stop();
            }
        }, 300);
    }

    playSoundButton.addEventListener('click', function() {
        if (connectedDevices.length > 0) {
            const deviceSelection = confirm('Bunyikan semua perangkat terhubung?');
            if (deviceSelection) {
                playSound();
                alert('Membunyikan semua perangkat terhubung');
            }
        } else {
            alert('Tidak ada perangkat yang terhubung.');
        }
    });

    shareDeviceButton.addEventListener('click', function () {
        if (navigator.share) {
            navigator.share({
                title: 'Bagikan Perangkat',
                text: `Perangkat: ${deviceData.name}, Baterai: ${deviceData.battery}, Lokasi: ${deviceData.location ? `${deviceData.location.lat.toFixed(4)}, ${deviceData.location.lng.toFixed(4)}` : 'Tidak tersedia'}`,
                url: window.location.href
            }).then(() => {
                console.log('Perangkat berhasil dibagikan.');
            }).catch((error) => {
                console.error('Error sharing:', error);
            });
        } else {
            const url = `${window.location.href}?device=${encodeURIComponent(JSON.stringify(deviceData))}`;
            prompt('Salin URL ini untuk membagikan perangkat:', url);
        }
    });

    addDeviceButton.addEventListener('click', function () {
        const deviceId = deviceIdInput.value.trim();
        if (deviceId) {
            const newDevice = {
                id: deviceId,
                name: `Perangkat ${deviceId}`,
                battery: 'Tidak tersedia',
                location: null
            };
            connectedDevices.push(newDevice);
            localStorage.setItem('connectedDevices', JSON.stringify(connectedDevices));
            renderConnectedDevices();
            initMap();
            alert(`Perangkat "${newDevice.name}" berhasil ditambahkan.`);
        } else {
            alert('Masukkan ID perangkat yang valid.');
        }
    });

    function renderConnectedDevices() {
        connectedDevicesElement.innerHTML = '<h2>Perangkat Terhubung</h2>';
        if (connectedDevices.length === 0) {
            connectedDevicesElement.innerHTML += '<p>Tidak ada perangkat terhubung. Masukkan ID perangkat untuk menambahkan perangkat.</p>';
            return;
        }
        connectedDevices.forEach((device, index) => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'connected-device';
            deviceElement.innerHTML = `
                <h3>${device.name}</h3>
                <p>Baterai: ${device.battery || 'Tidak tersedia'}</p>
                <p>Lokasi: ${device.location ? `${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}` : 'Tidak tersedia'}</p>
                <button class="sound-button" data-device-id="${device.id}">Bunyikan</button>
                <button class="locate-button" data-device-id="${device.id}">Temukan</button>
                <button class="remove-button" data-device-id="${device.id}">Hapus</button>
            `;
            connectedDevicesElement.appendChild(deviceElement);
        });
        document.querySelectorAll('.sound-button').forEach(button => {
            button.addEventListener('click', function() {
                const deviceId = this.getAttribute('data-device-id');
                playSound(deviceId);
                alert('Membunyikan perangkat...');
            });
        });
        document.querySelectorAll('.locate-button').forEach(button => {
            button.addEventListener('click', function() {
                const deviceId = this.getAttribute('data-device-id');
                const device = connectedDevices.find(d => d.id === deviceId);
                if (device && device.location) {
                    if (map) {
                        map.setView([device.location.lat, device.location.lng], 15);
                        L.popup()
                            .setLatLng([device.location.lat, device.location.lng])
                            .setContent(`<b>${device.name}</b><br>Lokasi terakhir`)
                            .openOn(map);
                    }
                } else {
                    alert('Lokasi perangkat tidak tersedia.');
                }
            });
        });
        document.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', function() {
                const deviceId = this.getAttribute('data-device-id');
                const deviceIndex = connectedDevices.findIndex(d => d.id === deviceId);
                if (deviceIndex !== -1) {
                    const deviceName = connectedDevices[deviceIndex].name;
                    if (confirm(`Hapus perangkat "${deviceName}"?`)) {
                        connectedDevices.splice(deviceIndex, 1);
                        localStorage.setItem('connectedDevices', JSON.stringify(connectedDevices));
                        renderConnectedDevices();
                        initMap();
                        alert(`Perangkat "${deviceName}" berhasil dihapus.`);
                    }
                }
            });
        });
    }

    function checkSharedDevice() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedDeviceParam = urlParams.get('device');
        if (sharedDeviceParam) {
            try {
                const sharedDevice = JSON.parse(decodeURIComponent(sharedDeviceParam));
                const existingDeviceIndex = connectedDevices.findIndex(device => device.id === sharedDevice.id);
                if (existingDeviceIndex === -1) {
                    connectedDevices.push(sharedDevice);
                    localStorage.setItem('connectedDevices', JSON.stringify(connectedDevices));
                    alert(`Perangkat "${sharedDevice.name}" berhasil ditambahkan dari tautan yang dibagikan!`);
                } else {
                    connectedDevices[existingDeviceIndex] = sharedDevice;
                    localStorage.setItem('connectedDevices', JSON.stringify(connectedDevices));
                    alert(`Informasi perangkat "${sharedDevice.name}" berhasil diperbarui dari tautan yang dibagikan!`);
                }
                renderConnectedDevices();
                initMap();
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Error parsing shared device data:', error);
                alert('Data perangkat yang dibagikan tidak valid.');
            }
        }
    }

    updateDeviceInfo();
    renderConnectedDevices();
    checkSharedDevice();
});
