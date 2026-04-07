import { pool } from "../../configs/db";
import bcrypt from "bcrypt";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email],
  );
  return result.rows[0];
};

export const findUserById = async (id: string) => {
  const res = await pool.query(
    `SELECT id, email, username, role, created_at, profile_pic, profile_completed, profile_completed_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );

  return res.rows[0];
};

export const markProfileCompleted = async (userId: string) => {
  await pool.query(
    `UPDATE users SET profile_completed = TRUE, profile_completed_at = NOW() WHERE id = $1`,
    [userId],
  );
};

export const findUserProfile = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM user_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0];
};

export const updateUserPassword = async (
  userId: string,
  newPassword: string,
) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    `UPDATE users
     SET password = $1
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [hashedPassword, userId],
  );

  return result.rows[0];
};

export const verifyUserPassword = async (userId: string, password: string) => {
  const result = await pool.query(
    `SELECT password FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );

  if (result.rows.length === 0) return false;

  const isValid = await bcrypt.compare(password, result.rows[0].password);
  return isValid;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  role: string;
}) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [userData.email, userData.password, userData.username, userData.role],
  );
  return result.rows[0];
};

export const createUserProfile = async (userId: string) => {
  const result = await pool.query(
    `INSERT INTO user_profiles (user_id)
     VALUES ($1)
     RETURNING user_id`,
    [userId],
  );

  return result.rows[0];
};

export const updateUser = async (
  userId: string,
  data: { username?: string; email?: string; profile_pic?: string | null },
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
    values,
  );

  return result.rows[0];
};

export const updateUserProfile = async (
  userId: string,
  data: {
    qualifications?: string | null;
    expertise?: string[] | null;
    certifications?: string | null;
    degrees?: string[] | null;
    keywords?: string[] | null;
    profile_pic_url?: string | null;
    bio?: string | null;
    organization_name?: string | null;
    website?: string | null;
  },
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
      data.expertise && data.expertise.length > 0 ? data.expertise : null,
    );
  }

  if (data.certifications !== undefined) {
    fields.push(`certifications = $${paramCount++}`);
    values.push(data.certifications);
  }

  if (data.degrees !== undefined) {
    fields.push(`degrees = $${paramCount++}`);
    values.push(
      data.degrees && data.degrees.length > 0 ? data.degrees : null,
    );
  }

  if (data.keywords !== undefined) {
    fields.push(`keywords = $${paramCount++}`);
    values.push(
      data.keywords && data.keywords.length > 0 ? data.keywords : null,
    );
  }

  if (data.profile_pic_url !== undefined) {
    fields.push(`profile_pic_url = $${paramCount++}`);
    values.push(data.profile_pic_url);
  }

  if (data.bio !== undefined) {
    fields.push(`bio = $${paramCount++}`);
    values.push(data.bio);
  }

  if (data.organization_name !== undefined) {
    fields.push(`organization_name = $${paramCount++}`);
    values.push(data.organization_name);
  }

  if (data.website !== undefined) {
    fields.push(`website = $${paramCount++}`);
    values.push(data.website);
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
    values,
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
  },
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
    [timestamp, userId],
  );
  return result.rows[0];
};

export const createCertificationRepo = async (data: {
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}) => {
  const result = await pool.query(
    `INSERT INTO user_certifications (user_id, file_url, file_name, file_type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.user_id, data.file_url, data.file_name, data.file_type],
  );
  return result.rows[0];
};

export const getCertificationsByUserRepo = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM user_certifications WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [userId],
  );
  return result.rows;
};

export const getCertificationByIdRepo = async (certId: string) => {
  const result = await pool.query(
    `SELECT * FROM user_certifications WHERE id = $1`,
    [certId],
  );
  return result.rows[0];
};

export const deleteCertificationRepo = async (certId: string, userId: string) => {
  const result = await pool.query(
    `DELETE FROM user_certifications WHERE id = $1 AND user_id = $2 RETURNING *`,
    [certId, userId],
  );
  return result.rows[0];
};

export const countCertificationsRepo = async (userId: string) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM user_certifications WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0].count as number;
};
