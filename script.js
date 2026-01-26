const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLh2udmSSurjniCJRLlSFywVmbv-LiLprFlbKZZ0gWDGZ3xZ4oz6CYDgAW1Paq9Uzf/exec";

// 1. Khai báo các biến truy cập DOM
const form = document.getElementById('inventory-form');
const tableBody = document.getElementById('inventory-table');
let inventory = []; // Mảng chứa dữ liệu kho

// 2. Hàm lấy dữ liệu từ Google Sheets
async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        // Chuyển đổi dữ liệu từ Sheets
        inventory = data.map(row => ({
            name: row[0],
            category: row[1],
            import: parseInt(row[2]) || 0,
            export: parseInt(row[3]) || 0
        }));
        updateUI();
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}

// 3. Hàm cập nhật giao diện (Vẽ bảng và thống kê)
function updateUI() {
    tableBody.innerHTML = "";
    let totalStock = 0, totalImport = 0, totalExport = 0;

    inventory.forEach((item, index) => {
        const stock = item.import - item.export;
        totalImport += item.import;
        totalExport += item.export;
        totalStock += stock;

        const row = `
            <tr>
                <td>${item.name}</td>
                <td><span class="badge bg-info text-dark">${item.category}</span></td>
                <td class="text-success">+${item.import}</td>
                <td class="text-danger">-${item.export}</td>
                <td class="fw-bold">${stock}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    // Cập nhật các con số thống kê ở trên đầu
    document.getElementById('stat-stock').innerText = totalStock;
    document.getElementById('stat-import').innerText = totalImport;
    document.getElementById('stat-export').innerText = totalExport;
}

// 4. Hàm gửi dữ liệu lên Google Sheets
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        import: parseInt(document.getElementById('qtyImport').value) || 0,
        export: parseInt(document.getElementById('qtyExport').value) || 0
    };

    const btn = form.querySelector('button');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';
    btn.disabled = true;

    try {
        // Gửi POST request tới Apps Script
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Quan trọng: Google Apps Script thường yêu cầu no-cors nếu không cấu hình CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newItem)
        });
        
        // Cập nhật mảng tạm thời để hiển thị ngay lập tức
        inventory.push(newItem);
        updateUI();
        form.reset();
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi khi lưu dữ liệu!");
    } finally {
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Cập nhật kho';
        btn.disabled = false;
    }
});

// Gọi hàm lấy dữ liệu lần đầu
fetchFromSheets();
