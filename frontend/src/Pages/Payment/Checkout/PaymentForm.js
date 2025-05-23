import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentForm.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import MainHeader from '../../../Common/mainHeader';
import { CartContext } from '../../../context/CartContext';

const PaymentForm = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { cartItems, clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    const api = process.env.REACT_APP_BASE_URL;
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpModalOpen, setOtpModalOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;

                if (!userId) {
                    throw new Error('User ID not found in token');
                }

                fetch(`${api}/api/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((response) => {
                        if (!response.ok) {
                            if (response.status === 401) {
                                localStorage.removeItem('token');
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Session Expired',
                                    text: 'Your session has expired. Please log in again.',
                                }).then(() => {
                                    navigate('/signin');
                                });
                                return Promise.reject('Session expired');
                            }
                            return response.json().then((errorData) => {
                                console.error('Error response:', errorData);
                                return Promise.reject(`HTTP error! status: ${response.status}`);
                            });
                        }
                        return response.json();
                    })
                    .then((data) => {
                        setFirstName(data.firstname || '');
                        setLastName(data.lastname || '');
                        setEmail(data.email || '');
                    })
                    .catch((error) => {
                        console.error('Error fetching user data:', error);
                        if (error !== 'Session expired') {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to retrieve user information.',
                            });
                            navigate('/signin');
                        }
                    });
            } catch (error) {
                console.error('Error decoding token or fetching user:', error);
                localStorage.removeItem('token');
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Error',
                    text: 'Your session is invalid. Please log in again.',
                }).then(() => {
                    navigate('/signin');
                });
            }
        } else {
            navigate('/signin');
        }
    }, [navigate, api]);

    const handleGenerateOtp = async () => {
        try {
            const response = await fetch(`${api}/api/auth/generate-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate OTP');
            }

            const data = await response.json();
            setGeneratedOtp(data.otp);
            setOtpModalOpen(true);
        } catch (error) {
            console.error('Error generating OTP:', error);
            Swal.fire({
                icon: 'error',
                title: 'OTP Error',
                text: 'Failed to send OTP to your email.',
            });
        }
    };

    const handleVerifyOtp = () => {
        if (otp === generatedOtp) {
            setOtpModalOpen(false);
            handlePlaceOrder();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: 'Incorrect OTP. Please try again.',
            });
        }
    };

    const handlePlaceOrder = async () => {
        const paymentData = {
            cardNumber: cardNumber,
            expiryDate: expiryDate,
            cvv: cvv,
        };

        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        const order = {
            userId: userId,
            items: cartItems.map(item => {
                let productModel = 'CricketBat'; // Default
                if (item.sizeType) {
                    productModel = 'CricketProtectionGear';
                } else if (item.size && item.category === 'shoes') {
                    productModel = 'Shoe';
                } else if (item.size) {
                    productModel = 'Merchandise';
                }

                if (!item._id) {
                    console.error('Invalid product ID for item:', item);
                    throw new Error('Invalid product ID in cart');
                }

                return {
                    productId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                    productModel: productModel,
                };
            }),
            totalAmount: parseFloat(calculateTotal()),
            deliveryAddress: deliveryAddress,
            phoneNumber: phoneNumber,
            paymentMethod: "Card Payment",
            paymentDetails: paymentData,
        };

        try {
            const response = await fetch(`${api}/api/order/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error creating order:', errorData);

                let errorMessage = 'An error occurred while processing your payment.';
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Payment Failed',
                    text: errorMessage,
                });
                return;
            }

            clearCart();
            Swal.fire({
                icon: 'success',
                title: 'Payment Successful! Check My Orders',
                text: 'Your payment has been processed.',
            }).then(() => {
                navigate(`/userdashboard`);
            });

        } catch (error) {
            console.error('Error creating order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: 'A network error occurred while processing your payment.',
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleGenerateOtp();
    };

    const calculateTotal = () => {
        return cartItems
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2);
    };

    return (
        <div>
            <MainHeader />
            <div className="payment-page-container">
                <div className="total-preview-section">
                    <h3>Order Summary</h3>
                    <ul className="cart-items-list">
                        {cartItems.map(item => (
                            <li key={item._id} className="cart-item">
                                {item.images && item.images.length > 0 ? (
                                    <img
                                        src={`${api}/uploads/${item.images[0]}`}
                                        alt={item.name || `${item.brand} ${item.model}`}
                                        className="cart-item-image"
                                    />
                                ) : (
                                    <div className="cart-item-image placeholder">
                                        No Image
                                    </div>
                                )}
                                <div className="cart-item-details">
                                    <h4>{item.name || `${item.brand} ${item.model}`}</h4>
                                    {item.size && <p>Size: {item.size}</p>}
                                    {item.sizeType && <p>Size: {item.sizeType}</p>}
                                    <p>Quantity: {item.quantity}</p>
                                    <p className="item-price">LKR {(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="cart-total">
                        <strong>Total:</strong> <span>LKR {calculateTotal()}</span>
                    </div>
                </div>

                <div className="card-section">
                    <h3>Payment Details</h3>
                    <form onSubmit={handleSubmit} className="payment-form">
                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                        <input type="text" placeholder="Expiry Date (MM/YY)" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
                        <input type="text" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
                        <input type="text" placeholder="Delivery Address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required />
                        <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />

                        <button type="submit" className="payment-button">Pay Now</button>
                    </form>
                </div>
            </div>
            {otpModalOpen && (
                <div className="otp-modal">
                    <div className="otp-modal-content">
                        <h2>Verify OTP</h2>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <button onClick={handleVerifyOtp}>Verify</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentForm;
