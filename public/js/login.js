// public/js/login.js
document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Xử lý click nút Login
  loginBtn.addEventListener("click", async function (event) {
    event.preventDefault(); // chặn reload trang

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Kiểm tra dữ liệu trống
    if (!email || !password) {
      alert("⚠️ Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      // Gửi request tới backend (đúng endpoint backend)
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Kiểm tra phản hồi từ server
      if (!response.ok) {
        const errData = await response.json();
        alert("❌ Sai email hoặc mật khẩu: " + (errData.message || ""));
        return;
      }

      // Nếu thành công
      const data = await response.json();

      // Lưu token vào localStorage (để xác thực cho các trang sau)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("✅ Đăng nhập thành công! Xin chào " + data.user.fullName);

      // Chuyển hướng sang trang chủ hoặc sản phẩm
      window.location.href = "home.html";
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("⚠️ Lỗi kết nối tới server!");
    }
  });
});
