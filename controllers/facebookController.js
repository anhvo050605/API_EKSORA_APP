const User = require('../schema/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.facebookLogin = async (req, res) => {
  try {
    console.log("=== FACEBOOK LOGIN REQUEST ===");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const { facebookUid, full_name, email, avatarUrl } = req.body;

    // Detailed validation
    if (!facebookUid) {
      console.log("ERROR: Missing facebookUid");
      return res.status(400).json({
        message: "Facebook UID is required",
      });
    }

    if (!email) {
      console.log("ERROR: Missing email");
      return res.status(400).json({
        message: "Email is required for Facebook login",
      });
    }

    console.log("Validation passed, checking existing user...");

    // Check if user already exists with this email
    let existingUser = await User.findOne({ email }).exec();
    console.log("Existing user found:", !!existingUser);

    if (!existingUser) {
      console.log("Creating new user...");
      
      // Prepare user data
      const nameParts = full_name ? full_name.split(' ') : [];
      const firstName = nameParts[0] || 'Facebook';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Hash password
      const hashedPassword = await bcrypt.hash(facebookUid, 10);

      const userData = {
        email,
        first_name: firstName,
        last_name: lastName,
        avatar: avatarUrl || '',
        password: hashedPassword,
        loginType: 'facebook',
        facebookUid: facebookUid,
        isActive: true
      };

      console.log("User data to create:", userData);

      try {
        existingUser = await User.create(userData);
        console.log("User created successfully:", existingUser._id);
      } catch (createError) {
        console.error("User creation error:", createError);

        if (createError.name === 'ValidationError') {
          const validationErrors = Object.values(createError.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
          }));

          return res.status(400).json({
            message: "User validation failed",
            errors: validationErrors,
          });
        }

        throw createError;
      }
    } else {
      console.log("Updating existing user...");
      
      const nameParts = full_name ? full_name.split(' ') : [];
      if (nameParts.length > 0) {
        existingUser.first_name = nameParts[0];
        existingUser.last_name = nameParts.slice(1).join(' ') || existingUser.last_name;
      }

      existingUser.avatar = avatarUrl || existingUser.avatar;
      existingUser.facebookUid = facebookUid;
      existingUser.loginType = 'facebook';

      try {
        await existingUser.save();
        console.log("User updated successfully");
      } catch (updateError) {
        console.error("User update error:", updateError);
        throw updateError;
      }
    }

    console.log("Generating JWT token...");

    // Generate JWT token
    const tokenPayload = {
      userId: existingUser._id,
      email: existingUser.email,
      role: existingUser.role || 'user',
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Final response format
    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      userId: existingUser._id.toString(),
      user: {
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        email: existingUser.email,
        phone: existingUser.phone || '',
        address: existingUser.address || ''
      }
    });

  } catch (error) {
    console.error("=== FACEBOOK LOGIN ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        message: "User validation failed",
        errors: validationErrors,
      });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        message: "Database error occurred",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
