import { Request, Response } from 'express';
import { resolveToken } from '../helpers/helpers';
import OrderModel from '../models/Order';

const Order = new OrderModel();

const create = async (req: Request, res: Response) => {
    try {
        const user_id = Number(
            resolveToken(req.headers.authorization as string)
        );
        const { Products } = req.body;
        if (!Products) {
            return res.status(400).json({
                message: 'incorrect or missing order.',
                format: {
                    Products: [
                        { product_id: 'number', quantity: 'number' },
                        { product_id: 'number', quantity: 'number' },
                    ],
                },
            });
        }

        const activeOrder = await Order.create(user_id, Products);

        return res.json(activeOrder);
    } catch (error) {
        throw new Error(`[Error] Could not add product to order: ${error}`);
    }
};

const show = async (req: Request, res: Response) => {
    try {
        const user_id = Number(
            resolveToken(req.headers.authorization as string)
        );
        const { id } = req.params;
        if (isNaN(Number(id))) {
            return res.status(400).send('numeric order id required.');
        }
        const order = await Order.show(user_id, Number(id));
        return res.json(order);
    } catch (error) {
        throw new Error(`[Error] Could not get order: ${error}`);
    }
};

const showAll = async (req: Request, res: Response) => {
    try {
        const user_id = Number(
            resolveToken(req.headers.authorization as string)
        );
        const orders = await Order.showAll(user_id as number);
        return res.json(orders);
    } catch (error) {
        throw new Error(`[Error] Could not get all orders: ${error}`);
    }
};

const getHistory = async (req: Request, res: Response) => {
    try {
        const user_id = Number(
            resolveToken(req.headers.authorization as string)
        );
        const historicalOrders = await Order.getHistory(user_id);
        return res.json(historicalOrders);
    } catch (error) {
        throw new Error(`[Error] Could not get history: ${error}`);
    }
};

const completeOrder = async (req: Request, res: Response) => {
    try {
        const user_id = Number(
            resolveToken(req.headers.authorization as string)
        );
        const { order_id, all } = req.body;
        if ((!order_id && !all) || (order_id && all)) {
            return res.send('Only order_id or all flag is accepted.');
        }

        if (order_id && isNaN(order_id)) {
            return res.send('order_id must be numeric.');
        }
        let flag = false;

        if (all) {
            if (typeof all == 'boolean') {
                flag = true;
            } else {
                return res.send('all flag must be boolean');
            }
        }

        const completedOrders = await Order.completeOrder(
            user_id,
            order_id as number,
            flag
        );
        return res.json(completedOrders);
    } catch (error) {
        throw new Error(`[Error] Could not completed order(s): ${error}`);
    }
};

export { create, show, showAll, getHistory, completeOrder };
