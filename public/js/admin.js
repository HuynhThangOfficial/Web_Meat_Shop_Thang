const API = '/api/admin';
const TOKEN_KEY = 'adminToken';

// 1. HỆ THỐNG AUTH (Đăng nhập/Bảo mật)
function getToken() {
    const info = JSON.parse(localStorage.getItem(TOKEN_KEY));
    return info ? info.token : null;
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = getToken();
    if (!token && window.location.pathname !== '/admin_login.html') {
        window.location.href = '/admin_login.html';
        return;
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(API + endpoint, config);
    if (res.status === 401) {
        alert("Hết phiên đăng nhập!");
        handleLogout();
        return;
    }
    return res.json();
}

async function handleLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
        window.location.href = '/admin.html';
    } else {
        document.getElementById('msg').innerText = data.message;
    }
}

function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/admin_login.html';
}

// 2. CÁC HÀM RENDER GIAO DIỆN

// --- DASHBOARD ---
async function renderDashboard() {
    setActive('dash');
    const data = await fetchAPI('/dashboard/stats');
    document.getElementById('content').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            <div style="background:white; padding:20px; border-radius:8px;"><h3>Đơn Hàng</h3><h1>${data.ordersCount}</h1></div>
            <div style="background:white; padding:20px; border-radius:8px;"><h3>Doanh Thu</h3><h1>${data.revenue.toLocaleString()} đ</h1></div>
            <div style="background:white; padding:20px; border-radius:8px;"><h3>Khách Hàng</h3><h1>${data.usersCount}</h1></div>
            <div style="background:white; padding:20px; border-radius:8px;"><h3>Sản Phẩm</h3><h1>${data.productsCount}</h1></div>
        </div>
    `;
}

// --- QUẢN LÝ SẢN PHẨM ---
async function renderProducts() {
    setActive('prod');
    const products = await fetchAPI('/products');
    let html = `<button class="btn btn-green" onclick="openModal()">+ Thêm Sản Phẩm</button><br><br>
    <table><thead><tr><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Kho</th><th>Hành động</th></tr></thead><tbody>`;
    
    products.forEach(p => {
        const img = p.images[0] || '';
        html += `<tr>
            <td><img src="${img}" width="50"></td>
            <td>${p.name}</td>
            <td>${p.price.toLocaleString()} đ</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn btn-blue" onclick='openModal(${JSON.stringify(p)})'>Sửa</button>
                <button class="btn btn-red" onclick="deleteProduct('${p._id}')">Xóa</button>
            </td>
        </tr>`;
    });
    document.getElementById('content').innerHTML = html + '</tbody></table>';
}

// --- QUẢN LÝ ĐƠN HÀNG ---
async function renderOrders() {
    setActive('order');
    const orders = await fetchAPI('/orders');
    // Sắp xếp mới nhất
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = `<table><thead><tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>TT Thanh Toán</th><th>Trạng Thái</th><th>Xử lý</th></tr></thead><tbody>`;
    
    orders.forEach(o => {
        const user = o.user_id ? o.user_id.username : 'Guest';
        html += `<tr>
            <td>${o._id.slice(-6)}</td>
            <td>${user}<br><small>${o.shipping_address.split(',')[0]}</small></td>
            <td>${o.total_amount.toLocaleString()} đ</td>
            <td>${o.payment_method}</td>
            <td>
                <select onchange="updateStatus('${o._id}', this.value)" class="status-select">
                    <option value="Chờ xác nhận" ${o.status=='Chờ xác nhận'?'selected':''}>Chờ xác nhận</option>
                    <option value="Đang giao hàng" ${o.status=='Đang giao hàng'?'selected':''}>Đang giao</option>
                    <option value="Hoàn tất" ${o.status=='Hoàn tất'?'selected':''}>Hoàn tất</option>
                    <option value="Đã hủy" ${o.status=='Đã hủy'?'selected':''}>Hủy</option>
                </select>
            </td>
            <td><button class="btn btn-blue" onclick="alert('Xem chi tiết ${o._id}')">Xem</button></td>
        </tr>`;
    });
    document.getElementById('content').innerHTML = html + '</tbody></table>';
}

// --- QUẢN LÝ KHÁCH HÀNG ---
async function renderUsers() {
    setActive('user');
    const users = await fetchAPI('/users');
    let html = `<table><thead><tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Hành động</th></tr></thead><tbody>`;
    users.forEach(u => {
        html += `<tr>
            <td>${u.username}</td><td>${u.email}</td><td>${u.role}</td>
            <td><button class="btn btn-red" onclick="deleteUser('${u._id}')">Xóa</button></td>
        </tr>`;
    });
    document.getElementById('content').innerHTML = html + '</tbody></table>';
}

// 3. CÁC HÀM XỬ LÝ LOGIC (CRUD)

// Cập nhật trạng thái đơn hàng
async function updateStatus(id, newStatus) {
    if(confirm(`Đổi trạng thái thành "${newStatus}"?`)) {
        await fetchAPI(`/orders/${id}/status`, 'PUT', { status: newStatus });
        alert('Cập nhật thành công');
    }
}

// Xóa sản phẩm
async function deleteProduct(id) {
    if(confirm('Bạn chắc chắn muốn xóa?')) {
        await fetchAPI(`/products/${id}`, 'DELETE');
        renderProducts();
    }
}

// Xóa user
async function deleteUser(id) {
    if(confirm('Xóa người dùng này?')) {
        await fetchAPI(`/users/${id}`, 'DELETE');
        renderUsers();
    }
}

// Xử lý Form Thêm/Sửa Sản phẩm
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const body = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        stock: document.getElementById('prodStock').value,
        image: document.getElementById('prodImage').value,
        description: document.getElementById('prodDesc').value,
        // Mặc định category và unit để test
        category_id: "68fcf2a0f010ef5ab16aa62a", 
        unit: "kg"
    };

    if (id) { // Sửa
        await fetchAPI(`/products/${id}`, 'PUT', body);
    } else { // Thêm mới
        await fetchAPI('/products', 'POST', body);
    }
    closeModal();
    renderProducts();
});

// Helper: Mở Modal
window.openModal = (p = null) => {
    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    if (p) {
        document.getElementById('modalTitle').innerText = "Sửa Sản Phẩm";
        document.getElementById('prodId').value = p._id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodStock').value = p.stock;
        document.getElementById('prodImage').value = p.images[0] || '';
        document.getElementById('prodDesc').value = p.description;
    } else {
        document.getElementById('modalTitle').innerText = "Thêm Sản Phẩm";
        document.getElementById('productForm').reset();
        document.getElementById('prodId').value = '';
    }
};

window.closeModal = () => {
    document.getElementById('productModal').style.display = 'none';
};

// Helper: Set Active Menu
function setActive(id) {
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-'+id).classList.add('active');
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    if(window.location.pathname.includes('admin.html')) {
        renderDashboard();
    }
});