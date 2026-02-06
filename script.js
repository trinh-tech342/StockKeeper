const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLh2udmSSurjniCJRLlSFywVmbv-LiLprFlbKZZ0gWDGZ3xZ4oz6CYDgAW1Paq9Uzf/exec";

const form = document.getElementById('inventory-form');
const tableBody = document.getElementById('inventory-table');
const searchInput = document.getElementById('searchName');
const searchSelect = document.getElementById('searchCategory');
const suggestionList = document.getElementById('product-suggestions');

let inventory = []; 

// 1. Lấy dữ liệu và tạo danh sách gợi ý
async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        inventory = data.map(row => ({
            name: row[0],
            category: row[1],
            import: parseInt(row[2]) || 0,
            export: parseInt(row[3]) || 0
        }));
        
        updateSuggestions(); // Cập nhật danh sách tên để gợi ý
        updateUI();
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// 2. Tạo danh sách gợi ý tên sản phẩm (DataList)
function updateSuggestions() {
    // Lấy danh sách tên không trùng lặp
    const names = [...new Set(inventory.map(item => item.name))];
    suggestionList.innerHTML = names.map(name => `<option value="${name}">`).join('');
}

// 3. Hàm hiển thị và lọc chính xác
function updateUI() {
    const filterName = searchInput.value.toLowerCase().trim();
    const filterCat = searchSelect.value;

    tableBody.innerHTML = "";
    let tStock = 0, tImport = 0, tExport = 0;

    // Lọc dữ liệu
    const filtered = inventory.filter(item => {
        const matchName = item.name.toLowerCase().includes(filterName);
        const matchCat = (filterCat === "Tất cả") || (item.category === filterCat);
        return matchName && matchCat;
    });

    // Hiển thị & Tính toán
 filtered.forEach((item, index) => {
    const stock = item.import - item.export;
    tImport += item.import;
    tExport += item.export;
    tStock += stock;

    // TÍNH NĂNG HAY: Cảnh báo màu đỏ nếu tồn kho < 5
    const stockStatus = stock < 5 
        ? '<span class="badge bg-danger animate-pulse">Sắp hết hàng!</span>' 
        : '<span class="badge bg-success">Ổn định</span>';
    
    const rowClass = stock < 5 ? 'table-danger' : '';

    tableBody.innerHTML += `
        <tr class="${rowClass}">
            <td class="fw-bold">${item.name}</td>
            <td><span class="badge bg-info text-dark">${item.category}</span></td>
            <td class="text-success fw-bold">+${item.import}</td>
            <td class="text-danger fw-bold">-${item.export}</td>
            <td class="fw-bold text-primary">${stock}</td>
            <td>${stockStatus}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
});

    // Cập nhật thẻ thống kê
    document.getElementById('stat-stock').innerText = tStock.toLocaleString();
    document.getElementById('stat-import').innerText = tImport.toLocaleString();
    document.getElementById('stat-export').innerText = tExport.toLocaleString();
}

// 4. Lắng nghe sự kiện gõ phím và chọn danh mục
searchInput.addEventListener('input', updateUI);
searchSelect.addEventListener('change', updateUI);

// 5. Submit form
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;

    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        import: parseInt(document.getElementById('qtyImport').value) || 0,
        export: parseInt(document.getElementById('qtyExport').value) || 0
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(newItem) });
        inventory.push(newItem);
        updateSuggestions();
        updateUI();
        form.reset();
    } catch (e) { alert("Lỗi!"); }
    btn.disabled = false;
});
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Lấy thông tin tìm kiếm hiện tại để làm tiêu đề
    const searchName = document.getElementById('searchName').value || "Tất cả";
    const searchCat = document.getElementById('searchCategory').value;
    const date = new Date().toLocaleString('vi-VN');

    // Cấu hình phông chữ (Mặc định jsPDF khó hiển thị tiếng Việt có dấu, 
    // chúng ta sẽ dùng font chuẩn để tránh lỗi hiển thị nếu có thể)
    doc.setFont("helvetica", "bold");
    doc.text("BAO CAO KHO CHI TIET", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Ngay xuat: ${date}`, 14, 22);
    doc.text(`Loc theo ten: ${searchName} | Danh muc: ${searchCat}`, 14, 28);

    // Xuất bảng
    doc.autoTable({
        startY: 35,
        head: [['Ten San Pham', 'Danh Muc', 'Nhap', 'Xuat', 'Ton Cuoi']],
        body: inventory
            .filter(item => {
                const matchName = item.name.toLowerCase().includes(searchInput.value.toLowerCase().trim());
                const matchCat = (searchSelect.value === "Tất cả") || (item.category === searchSelect.value);
                return matchName && matchCat;
            })
            .map(item => [
                item.name, 
                item.category, 
                item.import, 
                item.export, 
                (item.import - item.export)
            ]),
        headStyles: { fillColor: [78, 115, 223] }, // Màu xanh primary
        styles: { font: "helvetica" }
    });

    // Tải file về
    doc.save(`Bao-cao-kho-${searchCat}.pdf`);
}

fetchFromSheets();
