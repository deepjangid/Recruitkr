import Team from '../models/OurTeam.js';

const serializeTeamMember = (member = {}) => ({
  _id: member._id,
  name: member.fullName || member.name || '',
  role: member.role || member.position || '',
  summary: member.shortDescription || '',
  image: member.profileImage || '',
  linkedin: member.linkedInUrl || member.linkedin || '',
  email: member.email || '',
});

export const getTeam = async (req, res) => {
  try {
    const team = await Team.find().lean();
    res.status(200).json(team.map(serializeTeamMember));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
