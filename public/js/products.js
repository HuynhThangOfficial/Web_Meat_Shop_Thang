// Chờ cho trang web tải xong
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

/**
 * Hàm chính: Tải sản phẩm từ API và vẽ lại trang
 */
async function loadProducts() {
    try {
        console.log("Đang tải sản phẩm từ API...");
        // 1. Gọi API
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Không thể tải danh sách sản phẩm.');
        }

        const data = await response.json();
        const products = data.products || data;

        if (!products || products.length === 0) {
            const mainContainer = document.querySelector('.container');
            mainContainer.innerHTML = `<h3 style="color: grey; text-align: center;">Không có sản phẩm nào trong database.</h3>`;
            return;
        }

        console.log(`Đã tải ${products.length} sản phẩm.`);

        // 2. Setup Container
        const mainContainer = document.querySelector('.container');
        const previewContainer = document.querySelector('.products-preview');

        // 3. Xóa SẠCH HTML tĩnh cũ
        mainContainer.innerHTML = '';
        previewContainer.innerHTML = '';

        // 4. Tạo container mới
        const allProductsContainer = document.createElement('div');
        allProductsContainer.className = 'products-container';
        mainContainer.appendChild(allProductsContainer);

        // 5. Lặp qua TỪNG sản phẩm thật từ database
        products.forEach((product, index) => {
            
            // Lấy ID, tên, giá, ảnh, mô tả từ database
            const id = product._id;
            const name = product.name;
            const price = product.price;
            const description = product.description || 'Không có mô tả.';
            // Sửa lỗi ảnh: lấy ảnh đầu tiên hoặc ảnh dự phòng
            const image = product.images && product.images.length > 0 ? product.images[0] : './images/placeholder.jpg'; 

            const dataTarget = `p-${index + 1}`;
            
            // 6. Tạo card sản phẩm
            const productCard = document.createElement('div');
            productCard.className = 'product';
            productCard.setAttribute('data-name', dataTarget);
            productCard.innerHTML = `
                <img src="${image}" alt="${name}" />
                <h3>${name}</h3>
                <div class="price">${price.toLocaleString('vi-VN')} VNĐ</div>
            `;
            allProductsContainer.appendChild(productCard);

            // 7. Tạo popup (preview) cho sản phẩm
            const previewPopup = document.createElement('div');
            previewPopup.className = 'preview';
            previewPopup.setAttribute('data-target', dataTarget);
            previewPopup.innerHTML = `
                <i class="fas fa-times"></i>
                <img src="${image}" alt="${name}" />
                <h3>${name}</h3>
                <div class="stars"></div>
                <p>${description}</p>
                <div class="price">${price.toLocaleString('vi-VN')} VNĐ</div>
                <div class="buttons">
                    <a href="#" class="buy buy-now-btn" data-product-id="${id}">Buy now</a>
                    <a href="#" class="cart add-to-cart-btn" data-product-id="${id}">Add to cart</a>
                </div>
            `;
            previewContainer.appendChild(previewPopup);
        });

        // 8. Sau khi "vẽ" xong, "hồi sinh" các nút
        attachPopupListeners();
        attachCartListeners();

    } catch (error) {
        console.error("Lỗi khi tải trang sản phẩm:", error);
        const mainContainer = document.querySelector('.container');
        mainContainer.innerHTML = `<h3 style="color: red; text-align: center;">Lỗi khi tải sản phẩm: ${error.message}. Bạn đã chạy server chưa?</h3>`;
    }
}

// Hàm xử lý mở/đóng popup (Code cũ của bạn)
function attachPopupListeners() {
    let previewContainer = document.querySelector('.products-preview');
    let previewBoxes = previewContainer.querySelectorAll('.preview');

    document.querySelectorAll('.products-container .product').forEach(productCard => {
        productCard.onclick = () => {
            previewContainer.style.display = 'flex';
            let name = productCard.getAttribute('data-name');
            previewBoxes.forEach(preview => {
                let target = preview.getAttribute('data-target');
                if (name === target) {
                    preview.classList.add('active');
                }
            });
        };
    });

    previewBoxes.forEach(close => {
        close.querySelector('.fa-times').onclick = () => {
            close.classList.remove('active');
            previewContainer.style.display = 'none';
        };
    });
}

// Hàm xử lý thêm vào giỏ hàng (Đã sửa lỗi key user_id)
function attachCartListeners() {
    
    const cartButtonLogic = async (e, isBuyNow) => {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget; // Nút hiện tại được click
        const productId = button.getAttribute('data-product-id');
        const userInfo = JSON.parse(localStorage.getItem('user'));

        if (!userInfo || !userInfo._id) {
            alert('Bạn cần đăng nhập để thực hiện giao dịch.');
            window.location.href = '/login.html';
            return;
        }

        // LƯU Ý QUAN TRỌNG: Đã sửa userId thành user_id để khớp với Backend
        const dataToSend = {
            user_id: userInfo._id, 
            product_id: productId,
            quantity: 1
        };

        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể thêm vào giỏ hàng.');
            }

            alert('Đã thêm sản phẩm vào giỏ hàng!');
            document.querySelector(".products-preview").style.display = "none";
            
            if (isBuyNow) {
            // Thêm ?checkout=true để báo cho trang cart.html biết
            window.location.href = '/cart.html?checkout=true';
        }

        } catch (error) {
            console.error('Lỗi khi thêm/mua hàng:', error);
            alert(`Lỗi: ${error.message}`);
        }
    };
    
    // Gắn logic cho các nút
    document.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.onclick = (e) => cartButtonLogic(e, false);
    });

    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.onclick = (e) => cartButtonLogic(e, true);
    });
}