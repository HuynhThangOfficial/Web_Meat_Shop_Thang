// public/js/authGuard.js

// Lấy thông tin user từ bộ nhớ trình duyệt
const userInfo = JSON.parse(localStorage.getItem('user'));

// Kiểm tra xem có thông tin user không (hoặc có _id không)
if (!userInfo || !userInfo._id) { 
    // Nếu KHÔNG có, nghĩa là chưa đăng nhập
    alert('Bạn cần đăng nhập để truy cập trang này.');
    // Lập tức "đuổi" về trang login
    window.location.href = '/login.html'; 
}