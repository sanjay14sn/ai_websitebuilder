import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const GRIP_ADMIN_MOBILES = (process.env.GRIP_ADMIN_MOBILES || '9988776655,9944270374,9551205555')
  .split(',')
  .map((mobile) => mobile.trim())
  .filter(Boolean);

const normalizeMobile = (value = '') => value.replace(/\D/g, '');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // If this is the first user in the database, make them an admin automatically
    const isFirstUser = (await User.countDocuments({})) === 0;
    const assignedRole = isFirstUser ? 'admin' : (role || 'user');

    const user = await User.create({
      username,
      email,
      password,
      role: assignedRole,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin login via GRIP mobile + PIN (website builder admins)
// @route   POST /api/auth/grip-admin-login
// @access  Public
export const gripAdminLogin = async (req, res) => {
  const { mobileNumber, pin } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobileNumber);

    if (!normalizedMobile || !GRIP_ADMIN_MOBILES.includes(normalizedMobile)) {
      return res.status(403).json({
        success: false,
        message: 'This mobile number is not authorized for admin access',
      });
    }

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits',
      });
    }

    let user = await User.findOne({
      $or: [{ mobileNumber: normalizedMobile }, { email: `${normalizedMobile}@grip.admin` }],
    }).select('+password');

    if (!user) {
      await User.create({
        username: `admin-${normalizedMobile}`,
        email: `${normalizedMobile}@grip.admin`,
        mobileNumber: normalizedMobile,
        password: '1234',
        role: 'admin',
      });
      user = await User.findOne({
        $or: [{ mobileNumber: normalizedMobile }, { email: `${normalizedMobile}@grip.admin` }],
      }).select('+password');
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user.mobileNumber = normalizedMobile;
      await user.save();
      user = await User.findById(user._id).select('+password');
    }

    const isMatch = await user.comparePassword(String(pin));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Issue dashboard session for GRIP admin mobiles (after grip_backend PIN login)
// @route   POST /api/auth/grip-admin-session
// @access  Public (mobile must be in GRIP admin whitelist)
export const gripAdminSession = async (req, res) => {
  const { mobileNumber, username, email } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobileNumber);

    if (!normalizedMobile || !GRIP_ADMIN_MOBILES.includes(normalizedMobile)) {
      return res.status(403).json({
        success: false,
        message: 'This mobile number is not authorized for admin access',
      });
    }

    let user = await User.findOne({
      $or: [{ mobileNumber: normalizedMobile }, { email: `${normalizedMobile}@grip.admin` }],
    });

    if (!user) {
      user = await User.create({
        username: username || `admin-${normalizedMobile}`,
        email: email || `${normalizedMobile}@grip.admin`,
        mobileNumber: normalizedMobile,
        password: '1234',
        role: 'admin',
      });
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user.mobileNumber = normalizedMobile;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
