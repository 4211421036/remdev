const fs = require('fs');
const fetch = require('node-fetch');

// Ganti dengan token bot Telegram Anda
const botToken = '7613841593:AAH-uvuKnVfb9Pl1Ah02g6rRYA_ebAQZr_o';
const chatId = '-4684152339'; // Ganti dengan chat ID Anda di Telegram

// File JSON untuk menyimpan data
const dataFilePath = 'deviceData.json';

// Fungsi untuk mengambil semua pesan dari bot Telegram
async function fetchAllMessages() {
    try {
        const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            const messages = data.result;
            const deviceData = messages
                .filter(msg => msg.message && msg.message.text) // Filter pesan yang valid
                .map(msg => {
                    try {
                        return JSON.parse(msg.message.text); // Parse pesan JSON
                    } catch (error) {
                        return null;
                    }
                })
                .filter(msg => msg !== null); // Hapus pesan yang tidak valid

            return deviceData;
        } else {
            console.log('No messages from bot.');
            return [];
        }
    } catch (error) {
        console.error('Error fetching data from bot:', error);
        return [];
    }
}

// Fungsi untuk menyimpan data ke file JSON
function saveDataToFile(newData) {
    let existingData = [];
    if (fs.existsSync(dataFilePath)) {
        existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    }

    // Gabungkan data baru dengan data yang sudah ada
    newData.forEach(newDevice => {
        const existingDeviceIndex = existingData.findIndex(device => device.id === newDevice.id);
        if (existingDeviceIndex === -1) {
            // Jika ID perangkat belum ada, tambahkan data baru
            existingData.push(newDevice);
        } else {
            // Jika ID perangkat sudah ada, update data yang ada
            existingData[existingDeviceIndex] = newDevice;
        }
    });

    // Simpan data ke file JSON
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));
    console.log('Data saved to file:', dataFilePath);
}

// Fungsi utama
async function main() {
    const deviceData = await fetchAllMessages(); // Ambil semua pesan dari bot Telegram
    saveDataToFile(deviceData); // Simpan data ke file JSON
}

// Jalankan fungsi utama
main();
