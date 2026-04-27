import API from "./api";

const createIntent = async (payload) => (await API.post("/payments/create-intent", payload)).data;
const confirmPayment = async (payload) => (await API.post("/payments/confirm", payload)).data;
const getMyPayments = async () => (await API.get("/payments/my-payments")).data;

const paymentService = { createIntent, confirmPayment, getMyPayments };
export default paymentService;

