document.addEventListener('DOMContentLoaded', function () {
    const deviceInfo = document.getElementById('device-info');
    const qrCodeElement = document.getElementById('qr-code');
    const shareDeviceButton = document.getElementById('share-device');
    const playSoundButton = document.getElementById('play-sound');
    const scanBarcodeButton = document.getElementById('scan-barcode');
    const scannerElement = document.getElementById('scanner');
    const stopScanButton = document.getElementById('stop-scan');
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

    scanBarcodeButton.addEventListener('click', function () {
        scannerElement.style.display = 'block';
        const interactiveElement = document.getElementById('interactive');
        while (interactiveElement.firstChild) {
            interactiveElement.removeChild(interactiveElement.firstChild);
        }
        const videoElement = document.createElement('video');
        videoElement.style.width = '100%';
        videoElement.style.height = 'auto';
        interactiveElement.appendChild(videoElement);
        const overlayElement = document.createElement('div');
        overlayElement.style.position = 'absolute';
        overlayElement.style.top = '0';
        overlayElement.style.left = '0';
        overlayElement.style.width = '100%';
        overlayElement.style.height = '100%';
        overlayElement.style.border = '2px solid #f00';
        overlayElement.style.boxSizing = 'border-box';
        overlayElement.style.pointerEvents = 'none';
        interactiveElement.appendChild(overlayElement);
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        }).then(function(stream) {
            videoElement.srcObject = stream;
            videoElement.play().then(() => {
                console.log('Video is playing');
            }).catch((error) => {
                console.error('Error playing video:', error);
            });
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: interactiveElement,
                    constraints: {
                        width: 1280,
                        height: 720,
                        facingMode: "environment"
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 4,
                frequency: 10,
                decoder: {
                    readers: ["qr_code_reader"]
                },
                locate: true
            }, function (err) {
                if (err) {
                    console.error('Error initializing Quagga:', err);
                    alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
                    scannerElement.style.display = 'none';
                    videoElement.srcObject.getTracks().forEach(track => track.stop());
                    return;
                }
                console.log('Quagga initialized successfully');
                Quagga.start();
                const status = document.createElement('div');
                status.textContent = 'Memindai...';
                status.style.position = 'absolute';
                status.style.bottom = '10px';
                status.style.left = '0';
                status.style.right = '0';
                status.style.textAlign = 'center';
                status.style.color = 'white';
                status.style.backgroundColor = 'rgba(0,0,0,0.5)';
                status.style.padding = '5px';
                interactiveElement.appendChild(status);
            });
        }).catch(function(err) {
            console.error('Error accessing camera:', err);
            alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
            scannerElement.style.display = 'none';
        });
        let scanning = true;
        function scanQRCode() {
            if (!scanning) return;
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;
            if (videoWidth === 0 || videoHeight === 0) {
                requestAnimationFrame(scanQRCode);
                return;
            }
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
            const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
            if (window.jsQR) {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    try {
                        console.log('QR code detected with jsQR:', code.data);
                        const scannedDeviceData = JSON.parse(code.data);
                        processScannedDevice(scannedDeviceData);
                        stopScanner();
                    } catch (error) {
                        console.error('Error parsing QR code:', error);
                    }
                } else {
                    requestAnimationFrame(scanQRCode);
                }
            } else {
                requestAnimationFrame(scanQRCode);
            }
        }
        function stopScanner() {
            scanning = false;
            Quagga.stop();
            if (videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
            }
            scannerElement.style.display = 'none';
        }
        Quagga.onDetected(function (result) {
            console.log('QR code detected with Quagga:', result.codeResult.code);
            try {
                const scannedDeviceData = JSON.parse(result.codeResult.code);
                processScannedDevice(scannedDeviceData);
                stopScanner();
            } catch (error) {
                console.error('Error parsing QR code:', error);
                alert('QR code tidak valid. Pastikan QR code berisi informasi perangkat yang benar.');
            }
        });
        if (window.jsQR) {
            scanQRCode();
        }
        stopScanButton.addEventListener('click', function() {
            stopScanner();
        });
    });

    stopScanButton.addEventListener('click', function () {
        scannerElement.style.display = 'none';
        Quagga.stop();
    });

    function renderConnectedDevices() {
        connectedDevicesElement.innerHTML = '<h2>Perangkat Terhubung</h2>';
        if (connectedDevices.length === 0) {
            connectedDevicesElement.innerHTML += '<p>Tidak ada perangkat terhubung. Pindai QR code untuk menambahkan perangkat.</p>';
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
