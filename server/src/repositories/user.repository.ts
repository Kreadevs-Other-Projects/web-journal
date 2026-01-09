import { pool } from "../configs/db";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (id: string) => {
  const res = await pool.query(
    `SELECT id, email, username, role, created_at, profile_pic
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  return res.rows[0];
};

export const findUserProfile = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM user_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  role: string;
}) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [userData.email, userData.password, userData.username, userData.role]
  );
  return result.rows[0];
};

export const createUserProfile = async (userId: string) => {
  const result = await pool.query(
    `INSERT INTO user_profiles (user_id)
     VALUES ($1)
     RETURNING user_id`,
    [userId]
  );

  return result.rows[0];
};

export const updateUser = async (
  userId: string,
  data: { username?: string; email?: string; profile_pic?: string | null }
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.username !== undefined) {
    fields.push(`username = $${paramCount++}`);
    values.push(data.username);
  }

  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }

  if (data.profile_pic !== undefined) {
    fields.push(`profile_pic = $${paramCount++}`);
    values.push(data.profile_pic);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE users 
     SET ${fields.join(", ")}
     WHERE id = $${paramCount} AND deleted_at IS NULL
     RETURNING *`,
    values
  );

  return result.rows[0];
};

export const updateUserProfile = async (
  userId: string,
  data: {
    qualifications?: string | null;
    expertise?: string[] | null;
    certifications?: string | null;
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.qualifications !== undefined) {
    fields.push(`qualifications = $${paramCount++}`);
    values.push(data.qualifications);
  }

  if (data.expertise !== undefined) {
    fields.push(`expertise = $${paramCount++}`);
    values.push(
      data.expertise && data.expertise.length > 0 ? data.expertise : null
    );
  }

  if (data.certifications !== undefined) {
    fields.push(`certifications = $${paramCount++}`);
    values.push(data.certifications);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE user_profiles 
     SET ${fields.join(", ")}
     WHERE user_id = $${paramCount}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

export const updateProfile = async (
  userId: string,
  userData: { username?: string; email?: string },
  profileData?: {
    qualifications?: string | null;
    expertise?: string[] | null;
    certifications?: string | null;
  }
) => {
  if (userData.email) {
    const existing = await findUserByEmail(userData.email);
    if (existing && existing.id !== userId) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  let updatedUser = null;
  if (Object.keys(userData).length > 0) {
    updatedUser = await updateUser(userId, userData);
  }

  let updatedProfile = null;
  if (profileData && Object.keys(profileData).length > 0) {
    updatedProfile = await updateUserProfile(userId, profileData);
  }

  return {
    user: updatedUser,
    profile: updatedProfile,
  };
};

export const softDeleteUser = async (userId: string) => {
  const timestamp = new Date().toISOString();

  const result = await pool.query(
    `UPDATE users 
     SET 
       email = CONCAT('deleted_', email),
       username = CONCAT('deleted_', username),
       deleted_at = $1
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [timestamp, userId]
  );
  return result.rows[0];
};
