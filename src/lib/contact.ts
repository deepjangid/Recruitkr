import { apiGet, apiPut } from "@/lib/api";

export type ContactMessageStatus = "unread" | "read";

export type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
};

type ContactMessagesResponse = {
  success: boolean;
  data: ContactMessage[];
};

type ContactMessageResponse = {
  success: boolean;
  data: ContactMessage;
};

export const fetchAdminContactMessages = async () => {
  const response = await apiGet<ContactMessagesResponse>("/contact", true);
  return response.data;
};

export const updateAdminContactMessageStatus = async (
  id: string,
  status: ContactMessageStatus,
) => {
  const response = await apiPut<ContactMessageResponse>(`/contact/${id}`, { status }, true);
  return response.data;
};
