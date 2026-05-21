export const State = {
  token: localStorage.getItem('zyxo_token'),

  user: JSON.parse(
    localStorage.getItem('zyxo_user') || 'null'
  ),

  allUsers: [],
  conversations: [],

  activeConversation: null,
  activePartner: null,

  socket: null,
  typingTimeout: null
};