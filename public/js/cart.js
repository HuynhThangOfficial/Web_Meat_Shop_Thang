// Chờ cho trang web tải xong và gọi 2 hàm chính
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải dữ liệu giỏ hàng ngay lập tức
    fetchCartData();
    // 2. Gắn bộ lắng nghe sự kiện cho các nút
    attachDynamicEventListeners();

    // 3. Kiểm tra xem có phải là "Buy Now" không
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'true') {
        // Mở cửa sổ (modal) thanh toán ngay lập tức
        document.getElementById('shipping-modal').style.display = 'flex';
    }
});

// =======================================================
// === 1. HÀM TẢI DỮ LIỆU GIỎ HÀNG (API GET) ===
// =======================================================

async function fetchCartData() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (!userInfo || !userInfo._id) {
            displayCartItems([]);
            return;
        }

        const userId = userInfo._id;
        const response = await fetch(`/api/cart/${userId}`); 
        
        if (!response.ok) {
            if (response.status === 404) {
                displayCartItems([]); // Giỏ hàng trống
                return; 
            }
            throw new Error('Không thể tải giỏ hàng. ' + response.statusText);
        }

        const cartData = await response.json();
        displayCartItems(cartData.items); 

    } catch (error) {
        console.error('Lỗi khi tải giỏ hàng:', error);
    }
}

// =======================================================
// === 2. HÀM HIỂN THỊ GIỎ HÀNG (RENDER HTML) ===
// =======================================================

function displayCartItems(items) {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const totalPriceEl = document.getElementById('total-price');

    if (!cartItemsContainer) return; 
    cartItemsContainer.innerHTML = ''; 

    if (!items || items.length === 0) {
        // Trạng thái giỏ hàng trống
        if(emptyCartMessage) {
            emptyCartMessage.textContent = "Giỏ hàng của bạn đang trống.";
            emptyCartMessage.style.display = 'block';
        }
        if(totalPriceEl) totalPriceEl.textContent = '0'; // SỬA LỖI VNĐ
    } else {
        // Trạng thái có sản phẩm
        let total = 0;
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('item');
            
            const productInfo = item.product_id; 
            const itemName = productInfo ? productInfo.name : item.name || 'Sản phẩm không rõ';
            const itemQuantity = item.quantity;
            const itemPrice = productInfo ? (productInfo.price * itemQuantity) : 0; 
            const productId = productInfo ? productInfo._id : '';
            const itemImage = productInfo.images && productInfo.images.length > 0 ? productInfo.images[0] : './images/placeholder.jpg';

            itemElement.innerHTML = `
                <div class="item-details">
                    <img src="${itemImage}" alt="${itemName}">
                    <span>${itemName}</span>
                </div>
                <div class="item-controls">
                    <input type="number" 
                           class="item-quantity" 
                           data-product-id="${productId}" 
                           value="${itemQuantity}" 
                           min="1">
                    <span class="sub-total">${itemPrice.toLocaleString('vi-VN')} VNĐ</span>
                    <button class="remove-btn" data-product-id="${productId}">Xóa</button>
                </div>
            `;
            
            cartItemsContainer.appendChild(itemElement);
            total += itemPrice;
        });

        // Cập nhật tổng tiền
        // SỬA LỖI VNĐ: Chỉ chèn SỐ vào span#total-price
        if(totalPriceEl) totalPriceEl.textContent = total.toLocaleString('vi-VN');
    }
}

// =======================================================
// === 3. HÀM GẮN SỰ KIỆN (XÓA / CẬP NHẬT / THANH TOÁN) ===
// =======================================================

function attachDynamicEventListeners() {
    
    // Gắn sự kiện "click" cho toàn bộ trang
    document.addEventListener('click', async (e) => {
        
        // --- Nhấn nút "Xóa" ---
        if (e.target.classList.contains('remove-btn')) {
            const productId = e.target.getAttribute('data-product-id');
            if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                await removeItem(productId);
            }
        }

        // --- Nhấn nút "Tiến hành thanh toán" (MỞ MODAL) ---
        if (e.target.id === 'checkout-button') {
            const userInfo = JSON.parse(localStorage.getItem('user'));
            if (!userInfo || !userInfo._id) {
                alert('Bạn cần đăng nhập để thanh toán.');
                window.location.href = '/login.html';
                return;
            }
            document.getElementById('shipping-modal').style.display = 'flex';
        }

        // --- Nhấn nút "X" để ĐÓNG MODAL ---
        if (e.target.classList.contains('close-modal')) {
            document.getElementById('shipping-modal').style.display = 'none';
        }
    });

    // Gắn sự kiện "change" (thay đổi giá trị) cho ô số lượng
    document.addEventListener('change', async (e) => {
        if (e.target.classList.contains('item-quantity')) {
            const productId = e.target.getAttribute('data-product-id');
            const newQuantity = parseInt(e.target.value);
            if (newQuantity <= 0) {
                await removeItem(productId);
            } else {
                await updateItem(productId, newQuantity);
            }
        }
    });

    // === Gắn sự kiện "Submit" cho FORM TRONG MODAL ===
    const shippingForm = document.getElementById('shipping-form');
    if (shippingForm) {
        shippingForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const userInfo = JSON.parse(localStorage.getItem('user'));

            const name = document.getElementById('shipping-name').value;
            const phone = document.getElementById('shipping-phone').value;
            const address = document.getElementById('shipping-address').value;
            
            const shippingAddressString = `${name}, SĐT: ${phone}, Địa chỉ: ${address}`;
            
            const paymentMethodValue = document.querySelector('input[name="payment"]:checked').value;

            // 4. Xử lý thanh toán
            if (paymentMethodValue === 'Momo') {
                if (confirm("Bạn sẽ được chuyển hướng đến Momo để thanh toán. Tiếp tục?")) {
                    await performMomoCheckout(userInfo._id, shippingAddressString, "Ví điện tử");
                }
            } else if (paymentMethodValue === 'Tiền mặt') {
                if (confirm("Xác nhận đặt hàng với hình thức 'Tiền mặt' (COD)?")) {
                    await performCheckout(userInfo._id, shippingAddressString, paymentMethodValue);
                }
            }
        });
    }
}

// =======================================================
// === 4. CÁC HÀM GỌI API (XÓA / CẬP NHẬT / THANH TOÁN) ===
// =======================================================

async function removeItem(productId) {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userInfo._id, product_id: productId })
        });
        if (!response.ok) throw new Error('Xóa sản phẩm thất bại.');
        fetchCartData(); 
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

async function updateItem(productId, quantity) {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userInfo._id, product_id: productId, quantity: quantity })
        });
        if (!response.ok) throw new Error('Cập nhật số lượng thất bại.');
        fetchCartData(); 
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

async function performCheckout(userId, shippingAddress, paymentMethod) {
    try {
        const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                shipping_address: shippingAddress,
                payment_method: paymentMethod
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Thanh toán thất bại.');
        }

        alert('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
        document.getElementById('shipping-modal').style.display = 'none';
        window.location.href = '/home.html'; 

    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

async function performMomoCheckout(userId, shippingAddress, paymentMethod) {
    try {
        const response = await fetch('/api/momo/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                shipping_address: shippingAddress,
                payment_method: paymentMethod 
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Không thể tạo thanh toán Momo.');
        }

        alert('Đang chuyển hướng đến cổng thanh toán Momo...');
        window.location.href = result.payUrl;

    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}