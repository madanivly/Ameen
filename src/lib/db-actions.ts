import pool from './database';

export const fetchData = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM your_table_name'); // Replace with your table name
    return rows;
  } finally {
    connection.release();
  }
};

export const updateData = async (id: number, data: any) => {
  const connection = await pool.getConnection();
  try {
    // Example update query, adjust as needed
    const [result] = await connection.query('UPDATE your_table_name SET ? WHERE id = ?', [data, id]);
    return result;
  } finally {
    connection.release();
  }
};

export const batchUpdate = async (data: any[]) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of data) {
            const { id, ...updateData } = item;
            await connection.query('UPDATE your_table_name SET ? WHERE id = ?', [updateData, id]);
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
