// public/js/navbar.js

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn'); // Nút "Log In"
    const subNavbar = document.getElementById('subnavbar'); // Thanh menu
    
    // Kiểm tra xem có token User hay không
    const userInfo = localStorage.getItem('user'); 
    
    if (userInfo) {
        // Nếu đã đăng nhập
        if (loginBtn) {
            // 1. Đổi nút "Log In" thành nút "Log Out"
            loginBtn.innerHTML = '<a id="logout-link" href="#" style="color: #fff;">Log Out</a>';
            
            // 2. Gắn sự kiện Đăng xuất
            document.getElementById('logout-link').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user'); // Xóa token user
                // Nếu đang ở trang cần bảo vệ, nó sẽ đá về login
                window.location.href = '/home.html'; 
            });
        }
    } else {
        // Nếu chưa đăng nhập, đảm bảo nút Login có link đúng
        if (loginBtn) {
            loginBtn.innerHTML = '<a href="login.html" style="color: #fff">Log In</a>';
        }
    }
});