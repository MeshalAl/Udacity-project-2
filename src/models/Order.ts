import client from '../database';
import { Order } from '../types/types';
import { Product } from '../types/types';

class OrderModel {
    async create(user_id: number, products: Product[]): Promise<Order[]> {
        try {
            const conn = await client.connect();
            const defaultStatus = 'active';

            const orderQuery =
                'INSERT INTO orders (user_id, status, order_date) VALUES ($1, $2, NOW()) RETURNING order_id';
            const orderResult = await conn.query(orderQuery, [
                user_id,
                defaultStatus,
            ]);

            const order_id = orderResult.rows[0].order_id;

            const productOrderQuery =
                'INSERT INTO order_products (order_id, user_id, product_id, quantity) VALUES ($1, $2, $3, $4);';

            for (const product of products) {
                await conn.query(productOrderQuery, [
                    order_id,
                    user_id,
                    product.product_id,
                    product.quantity,
                ]);
            }
            const getOrderQuery = `
            SELECT o.order_id, u.user_id, p.product_name, op.quantity, p.price, o.status, o.order_date
                FROM (((orders AS o INNER JOIN users AS u 
                    ON o.user_id = u.user_id) 
                        INNER JOIN order_products AS op 
                            ON o.order_id = op.order_id) 
                                INNER JOIN products AS p
                                    ON op.product_id = p.product_id)
                                    WHERE u.user_id = $1 AND o.status = $2;`;
            const result = await conn.query(getOrderQuery, [
                user_id,
                defaultStatus,
            ]);
            return result.rows;
        } catch (error) {
            throw new Error(
                `[Error] Failed to create order on database:\n ${error} `
            );
        }
    }
    async show(user_id: number, order_id: number): Promise<Order[]> {
        try {
            const conn = await client.connect();
            const query = `
            SELECT o.order_id, u.user_id, p.product_name, op.quantity, p.price, o.status, o.order_date
                FROM (((orders AS o INNER JOIN users AS u 
                    ON o.user_id = u.user_id) 
                        INNER JOIN order_products AS op 
                            ON o.order_id = op.order_id) 
                                INNER JOIN products AS p
                                    ON op.product_id = p.product_id)
                                    WHERE u.user_id = $1 AND o.order_id = $2;`;
            const result = await conn.query(query, [user_id, order_id]);

            return result.rows;
        } catch (error) {
            throw new Error(
                `[Error] Failed to gen an order on database:\n ${error} `
            );
        }
    }
    async showAll(user_id: number): Promise<Order[]> {
        try {
            const conn = await client.connect();
            const query =
                'SELECT * FROM orders WHERE user_id = $1 ORDER BY order_id DESC;';
            const result = await conn.query(query, [user_id]);

            return result.rows;
        } catch (error) {
            throw new Error(
                `[Error] Failed to get all orders from database:\n ${error} `
            );
        }
    }
    async getHistory(user_id: number): Promise<Order[]> {
        try {
            const conn = await client.connect();
            const query = `
            SELECT o.order_id, u.user_id, p.product_name, op.quantity, p.price, o.status, o.order_date
                FROM (((orders AS o INNER JOIN users AS u 
                    ON o.user_id = u.user_id) 
                        INNER JOIN order_products AS op 
                            ON o.order_id = op.order_id) 
                                INNER JOIN products AS p
                                    ON op.product_id = p.product_id)
                                    WHERE u.user_id = $1 AND status = 'completed';`;
            const result = await conn.query(query, [user_id]);
            return result.rows;
        } catch (error) {
            throw new Error(
                `[Error] Failed to get completed orders from database:\n ${error} `
            );
        }
    }

    async completeOrder(
        user_id: number,
        order_id?: number,
        all?: boolean
    ): Promise<Order[] | null> {
        try {
            const conn = await client.connect();

            if (order_id && !all) {
                const query =
                    "UPDATE orders SET status = 'completed' WHERE user_id = $1 AND order_id = $2 RETURNING *;";
                const result = await conn.query(query, [user_id, order_id]);
                conn.release();
                return result.rows;
            } else if (!order_id && all) {
                const query =
                    "UPDATE orders SET status = 'completed' WHERE user_id = $1 RETURNING *;";
                const result = await conn.query(query, [user_id]);
                conn.release();
                return result.rows;
            }
            return null;
        } catch (error) {
            throw new Error(
                `[Error] Failed to complete order(s) on database:\n ${error} `
            );
        }
    }
}

export default OrderModel;
