import { pool } from "../../configs/db";

export const saveOTP = async (
  email: string,
  otpCode: string,
  purpose: "signup" | "login" | "reset",
) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await pool.query(`DELETE FROM otp WHERE email = $1 AND purpose = $2`, [
    email,
    purpose,
  ]);

  const result = await pool.query(
    `INSERT INTO otp (email, otp_code, expiry_at, purpose)
     VALUES ($1, $2, $3, $4)
     RETURNING id, otp_code, expiry_at`,
    [email, otpCode, expiresAt, purpose],
  );

  return result.rows[0];
};

export const findOTP = async (email: string, otpCode: string) => {
  const result = await pool.query(
    `SELECT * FROM otp
        WHERE email = $1
        AND otp_code = $2
        AND expiry_at > NOW()
        LIMIT 1`,
    [email, otpCode],
  );
  return result.rows[0];
};

export const deleteOTP = async (email: string) => {
  const result = await pool.query(
    `DELETE FROM otp WHERE email = $1 RETURNING id`,
    [email],
  );
  return result.rows[0];
};

export const deleteExpiredOtps = async () => {
  await pool.query(`DELETE FROM otp WHERE expiry_at < NOW()`);
};

export const markOTPVerified = async (email: string) => {
  const result = await pool.query(
    `UPDATE otp
     SET verified = true
     WHERE email = $1
     RETURNING email`,
    [email],
  );
  return result.rows[0];
};

export const isEmailOTPVerified = async (email: string) => {
  const result = await pool.query(
    `SELECT verified FROM otp
     WHERE email = $1
     AND verified = true
     LIMIT 1`,
    [email],
  );
  return result.rows[0];
};
