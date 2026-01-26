const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLh2udmSSurjniCJRLlSFywVmbv-LiLprFlbKZZ0gWDGZ3xZ4oz6CYDgAW1Paq9Uzf/exec";

// Hàm lấy dữ liệu từ Google Sheets khi mở trang
async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        // Chuyển đổi mảng từ Sheets thành Object
        inventory = data.map(row => ({
            name: row[0],
            category: row[1],
            import: parseInt(row[2]),
            export: parseInt(row[3])
        }));
        updateUI();
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}

// Hàm gửi dữ liệu lên Google Sheets
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        import: parseInt(document.getElementById('qtyImport').value),
        export: parseInt(document.getElementById('qtyExport').value)
    };

    // Hiển thị trạng thái đang xử lý
    const btn = form.querySelector('button');
    btn.innerText = "Đang lưu...";
    btn.disabled = true;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(newItem)
        });
        
        inventory.push(newItem);
        updateUI();
        form.reset();
    } catch (error) {
        alert("Có lỗi khi lưu dữ liệu!");
    } finally {
        btn.innerText = "Cập nhật kho";
        btn.disabled = false;
    }
});

// Gọi hàm lấy dữ liệu khi tải trang
fetchFromSheets();
