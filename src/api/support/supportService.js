import { API } from '../authservices/authservice';

// Create a new support ticket
export const createTicket = async (ticketData) => {
    // ticketData should be FormData given we support file uploads
    const response = await API.post('/support', ticketData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get current user's tickets
export const getMyTickets = async () => {
    const response = await API.get('/support/my-tickets');
    return response.data;
};

// Get all tickets (Admin only)
export const getAllTickets = async () => {
    const response = await API.get('/support');
    return response.data;
};

// Get single ticket details
export const getTicketById = async (id) => {
    const response = await API.get(`/support/${id}`);
    return response.data;
};

// Reply to a ticket
export const replyToTicket = async (id, replyData) => {
    // replyData should be FormData
    const response = await API.post(`/support/${id}/reply`, replyData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Update ticket status (Admin only)
export const updateTicketStatus = async (id, status) => {
    const response = await API.put(`/support/${id}/status`, { status });
    return response.data;
};
