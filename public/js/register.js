document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("userName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    const message = document.getElementById("message");
    message.style.color = "black";
    message.textContent = "Processing...";

    if (password !== confirmPassword) {
      message.style.color = "red";
      message.textContent = "Passwords do not match!";
      return;
    }

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          username,
          email,
          phone,
          password,
          address: "", // chưa có ô address thì gửi rỗng
        }),
      });

      const data = await res.json();

      if (res.ok) {
        message.style.color = "green";
        message.textContent = "Đăng ký thành công!";

        // Lưu thông tin nếu cần dùng sau
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        message.style.color = "red";
        message.textContent = data.message || "Đăng ký thất bại!";
      }
    } catch (error) {
      console.error("Lỗi:", error);
      message.style.color = "red";
      message.textContent = "Không thể kết nối tới server!";
    }
  });
