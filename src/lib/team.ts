import { apiGet } from "@/lib/api";

export type TeamMember = {
  _id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
  linkedin: string;
  email: string;
};

type TeamMemberResponse = {
  _id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
  linkedin: string;
  email: string;
};

export const fetchTeamMembers = async () => {
  const response = await apiGet<TeamMemberResponse[]>("/api/team");
  return Array.isArray(response) ? response : [];
};
