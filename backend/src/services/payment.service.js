const paymentService = {
  async createPayment(order) {
    if (order.paymentMethod === 'naqd') {
      return { provider: 'naqd', paymentUrl: null };
    }

    return {
      provider: order.paymentMethod,
      paymentUrl: `https://mock-pay.vegas.uz/${order.paymentMethod}?order=${order.orderNumber}&amount=${order.totalAmount}`,
    };
  },
};

export default paymentService;
