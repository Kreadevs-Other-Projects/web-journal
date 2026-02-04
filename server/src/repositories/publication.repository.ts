import { pool } from "../configs/db";

export const publishPaper = async (paperId: string, editorId: string) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const payment = await client.query(
      `SELECT status FROM paper_payments WHERE paper_id = $1`,
      [paperId],
    );

    if (!payment.rows.length || payment.rows[0].status !== "paid") {
      throw new Error("Author page charges not paid");
    }

    const publication = await client.query(
      `INSERT INTO publications (paper_id, published_by, published_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (paper_id)
       DO UPDATE SET published_by = $2, published_at = NOW()
       RETURNING *`,
      [paperId, editorId],
    );

    await client.query(
      `UPDATE papers 
       SET status = 'published', updated_at = NOW()
       WHERE id = $1`,
      [paperId],
    );

    await client.query("COMMIT");

    return publication.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
