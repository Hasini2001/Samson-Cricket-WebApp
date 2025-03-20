// MyOrder.js (React component)
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './MyOrder.css';
import { FaPhoneAlt } from 'react-icons/fa'; // Import the phone icon

const MyOrder = () => {
    const [orders, setOrders] = useState([]);
    const api = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;

                fetch(`${api}/api/order/user-orders/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch orders');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        setOrders(data);
                    })
                    .catch((error) => {
                        console.error('Error fetching orders:', error);
                    });
            } catch (error) {
                console.error('Error decoding token or fetching orders:', error);
            }
        }
    }, [api]);

    const handleContact = (order) => {
        console.log(`Contacting about order: ${order._id}`);
    };

    return (
        <div>
            <div className="order-container">
                <h2>Your Orders</h2>
                {orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Delivery Address</th>
                                <th>Phone Number</th>
                                <th>Payment Method</th>
                                <th>Order Status</th>
                                <th>Order Date & Time</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <ul>
                                            {order.items.map((item) => (
                                                <li key={item.productId._id}>
                                                    Product: {item.productId.brand} {item.productId.model}, Quantity: {item.quantity}, Price: LKR {item.price.toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>LKR {order.totalAmount.toFixed(2)}</td>
                                    <td>{order.deliveryAddress}</td>
                                    <td>{order.phoneNumber}</td>
                                    <td>{order.paymentMethod}</td>
                                    <td>{order.orderStatus}</td>
                                    <td>{new Date(order.orderDate).toLocaleString()}</td>
                                    <td>
                                        <button className="contact-button" onClick={() => handleContact(order)}>
                                            <FaPhoneAlt />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyOrder;