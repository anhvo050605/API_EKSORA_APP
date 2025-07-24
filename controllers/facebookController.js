const User = require('../schema/userSchema');

exports.facebookLogin = async (req, res) => {
  try {
    console.log("=== FACEBOOK LOGIN REQUEST ===");
    console.log("Received data:", JSON.stringify(req.body, null, 2));

    const { facebookUid, full_name, email, avatarUrl } = req.body;

    if (!facebookUid) {
      return res.status(400).json({
        success: false,
        message: "Facebook UID is required",
      });
    }

    // Check if user already exists with this email
    let existingUser = await User.findOne({ email });

    if (!existingUser) {
      // Tạo mới user nếu chưa tồn tại
      const nameParts = full_name ? full_name.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      existingUser = await User.create({
        email,
        first_name: firstName,
        last_name: lastName,
        avatar: avatarUrl,
        password: facebookUid, // giả định, bạn nên mã hóa hoặc xử lý riêng
      });
    }

    // Tạo token giả lập (có thể thay bằng JWT thực tế)
    const mockToken = `fb_token_${facebookUid}_${Date.now()}`;

    const responseData = {
      success: true,
      message: "Facebook login successful",
      token: mockToken,
      user: {
        id: existingUser._id,
        name: `${existingUser.first_name} ${existingUser.last_name}`,
        email: existingUser.email,
        avatar: existingUser.avatar,
        loginType: "facebook",
      },
    };

    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    res.status(200).json(responseData);

  } catch (error) {
    console.error("Facebook login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
