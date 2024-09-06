import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  msgStatus:{
    type: String,
    required: true,
    enum: ['read', 'delivered','sent']
  },
  content: {
    type: String,
    required: true
  },
  edited:{
  type:Boolean,
  default:false
  },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema]
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default Chat;
