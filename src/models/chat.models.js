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
  videoData: {
    title: { 
      type: String,
      default: null 
    },
    ownerUsername: {
      type: String,
      default: null
    },
    avatar: {
      type: String,
      default: null 
    },
    thumbnail: {
      type: String,
      default: null 
    }
  },
  edited:{
  type:Boolean,
  default:false
  },
  delForMe:{
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
  messages: [messageSchema],
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () { return this.isGroupChat; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default Chat;
