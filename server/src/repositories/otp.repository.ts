import { pool } from "../configs/db";

export const saveOTP = async (email: string, otpCode: string) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await pool.query(`DELETE FROM otp WHERE email = $1`, [email]);

  const result = await pool.query(
    `INSERT INTO otp (email, otp_code, expiry_at) 
     VALUES ($1, $2, $3) 
     RETURNING id, otp_code, expiry_at`,
    [email, otpCode, expiresAt]
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
    [email, otpCode]
  );
  return result.rows[0];
};

export const deleteOTP = async (email: string) => {
  const result = await pool.query(
    `DELETE FROM otp WHERE email = $1 RETURNING id`,
    [email]
  );
  return result.rows[0];
};

export const deleteExpiredOtps = async () => {
  await pool.query(`DELETE FROM otp WHERE expiry_at < NOW()`);
};
